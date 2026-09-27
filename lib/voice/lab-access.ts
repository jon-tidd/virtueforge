import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { labSecret } from "./config";

// The lab secret. The feature flag decides whether the lab exists at all; the
// secret decides who may use it. `next dev` listens on every interface by
// default, so without this anyone on the same network could list voices, play
// (and so record) a cloned voice, read chapters with the children's names, or
// upload someone else's recording. Run the lab with `npm run voice:dev`
// (bound to 127.0.0.1) and set VOICE_LAB_SECRET in .env.local; the secret is
// typed once on /voice-lab/unlock and kept in an httpOnly, SameSite=Strict
// cookie. A Host-header check would not do: curl can send any Host.
//
// The cookie holds an HMAC of the secret, never the secret itself. Every
// comparison is timingSafeEqual over sha256 digests (equal lengths always).

export const LAB_COOKIE = "gg_voice_lab";
const COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;

function digest(s: string): Buffer {
  return createHash("sha256").update(s, "utf8").digest();
}

export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/** The cookie value for the current secret, or null when the lab has no (valid) secret. */
export function labCookieValue(secret = labSecret()): string | null {
  return secret ? createHmac("sha256", secret).update("gg-voice-lab-cookie-v1").digest("base64url") : null;
}

/** Does this cookie value unlock the lab? False whenever no secret is configured. */
export function hasLabAccess(cookieValue: string | null | undefined): boolean {
  const expected = labCookieValue();
  if (!expected || !cookieValue) return false;
  return safeEqual(cookieValue, expected);
}

/** Is `given` the lab secret? */
export function secretMatches(given: unknown): boolean {
  const secret = labSecret();
  if (!secret || typeof given !== "string" || given.length === 0 || given.length > 512) return false;
  return safeEqual(given, secret);
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function requestHasLabAccess(req: Request): boolean {
  return hasLabAccess(readCookie(req, LAB_COOKIE));
}

function isHttps(req: Request): boolean {
  return new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
}

export function labCookieHeader(req: Request, value: string): string {
  return `${LAB_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE_S}${isHttps(req) ? "; Secure" : ""}`;
}

export function clearLabCookieHeader(req: Request): string {
  return `${LAB_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isHttps(req) ? "; Secure" : ""}`;
}

/** Where to go after unlocking: only a path inside the lab. */
export function safeNextPath(next: unknown): string {
  return typeof next === "string" && /^\/voice-lab(\/[A-Za-z0-9_\-/]*)?$/.test(next) && !next.includes("//") ? next : "/voice-lab";
}
