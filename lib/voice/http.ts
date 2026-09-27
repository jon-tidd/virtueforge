import { VoiceError } from "./errors";
import { isVoiceEngineEnabled } from "./flag";
import { requestHasLabAccess } from "./lab-access";

// Shared plumbing for the /api/voice routes.

export function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", ...extra },
  });
}

export function errorResponse(e: unknown): Response {
  if (e instanceof VoiceError) return json({ error: e.code, message: e.message }, e.status);
  // Log the type only: error messages from deep in a provider call could, in
  // theory, echo request details, and keys must never reach the logs.
  console.error("[voice] unexpected error:", e instanceof Error ? e.name : typeof e);
  return json({ error: "internal", message: "Something went wrong" }, 500);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/**
 * Every voice route is wrapped in this. When the flag is off (or in
 * production) the route does not exist: 404, before any other work. Without
 * the lab cookie (lab-access.ts) it is a 404 too, so nothing on the network
 * can tell the lab is there. Only the unlock route opts out of the cookie.
 */
export function guarded<C>(handler: Handler<C>, opts: { requireLab?: boolean } = {}): Handler<C> {
  const requireLab = opts.requireLab ?? true;
  return async (req, ctx) => {
    if (!isVoiceEngineEnabled()) return notFound();
    if (requireLab && !requestHasLabAccess(req)) return notFound();
    try {
      return await handler(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Blocks cross-site use of our audio and APIs (a deterrent; see engine-design.md). */
export function isCrossSite(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  return site === "cross-site" || site === "same-site";
}

/** The header the lab's player sends. Browsers can't add it to a navigation or an <audio src>. */
export const PLAYER_HEADER = "x-voice-player";

/**
 * "No downloads": audio is only served to the player's own fetch(). Typing
 * the URL into the address bar (Sec-Fetch-Dest: document) would open the
 * browser's media viewer, which has a Save control, and <audio src> or <a
 * download> can't send the custom header.
 */
export function isPlayerFetch(req: Request): boolean {
  if (req.headers.get(PLAYER_HEADER) !== "1") return false;
  const dest = req.headers.get("sec-fetch-dest");
  const mode = req.headers.get("sec-fetch-mode");
  if (dest !== null && dest !== "empty") return false;
  if (mode !== null && mode !== "cors" && mode !== "same-origin") return false;
  return !isCrossSite(req);
}

/**
 * The request body, refusing anything over `maxBytes` (by Content-Length up
 * front, and by counting as it streams in case the header is missing or wrong).
 */
export async function readCappedBody(req: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new VoiceError("too_large", "That upload is too large");
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new VoiceError("too_large", "That upload is too large");
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.byteLength;
  }
  return out;
}

export function ownerToken(req: Request): string {
  return req.headers.get("x-voice-owner-token") ?? "";
}

/**
 * Serves audio inline with Range support (Safari's <audio> needs 206s).
 * No attachment disposition, no caching by anyone else.
 */
export function audioResponse(
  req: Request,
  audio: Uint8Array,
  contentType: string,
  extraHeaders: Record<string, string> = {},
): Response {
  const base: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    ...extraHeaders,
  };
  const size = audio.length;
  const range = req.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (m && (m[1] || m[2])) {
    let start: number;
    let end: number;
    if (m[1]) {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    } else {
      const suffix = Number(m[2]);
      start = Math.max(0, size - suffix);
      end = size - 1;
    }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    }
    const slice = audio.slice(start, end + 1);
    return new Response(slice as BodyInit, {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(slice.length) },
    });
  }
  return new Response(audio as BodyInit, { status: 200, headers: { ...base, "Content-Length": String(size) } });
}
