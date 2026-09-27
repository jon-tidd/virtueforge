import { guarded, isCrossSite, json } from "@/lib/voice/http";
import { clearLabCookieHeader, labCookieHeader, labCookieValue, secretMatches } from "@/lib/voice/lab-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/voice/unlock  JSON { secret } -> 204 + the lab cookie (lab-access.ts)
// DELETE /api/voice/unlock -> 204, cookie cleared (locks this browser again)
// The only voice route that works without the lab cookie. Still 404 when the
// flag is off, and 404 when no VOICE_LAB_SECRET is set. Ten wrong tries in ten
// minutes lock it for the rest of that window.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 10;
let failures: number[] = [];

export const POST = guarded(
  async (req: Request) => {
    if (isCrossSite(req)) return json({ error: "bad_request", message: "Cross-site request refused" }, 400);
    const cookie = labCookieValue();
    if (!cookie) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    const now = Date.now();
    failures = failures.filter((t) => now - t < WINDOW_MS);
    if (failures.length >= MAX_FAILURES) {
      return json({ error: "too_many_tries", message: "Too many wrong tries. Wait ten minutes." }, 429, { "Retry-After": "600" });
    }
    const body = (await req.json().catch(() => null)) as { secret?: unknown } | null;
    if (!secretMatches(body?.secret)) {
      failures.push(now);
      return json({ error: "wrong_secret", message: "That isn't the lab secret." }, 401);
    }
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": labCookieHeader(req, cookie), "Cache-Control": "no-store" },
    });
  },
  { requireLab: false },
);

export const DELETE = guarded(
  async (req: Request) =>
    new Response(null, { status: 204, headers: { "Set-Cookie": clearLabCookieHeader(req), "Cache-Control": "no-store" } }),
  { requireLab: false },
);

