import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as audioRoute from "@/app/api/voice/audio/[voiceId]/[chapterId]/[paragraph]/route";
import * as chapterRoute from "@/app/api/voice/chapters/[chapterId]/route";
import * as chaptersRoute from "@/app/api/voice/chapters/route";
import * as ledgerRoute from "@/app/api/voice/ledger/route";
import * as ownerRoute from "@/app/api/voice/owner/route";
import * as providersRoute from "@/app/api/voice/providers/route";
import * as bindingsRoute from "@/app/api/voice/voices/[voiceId]/bindings/route";
import * as voiceRoute from "@/app/api/voice/voices/[voiceId]/route";
import * as voicesRoute from "@/app/api/voice/voices/route";
import * as unlockRoute from "@/app/api/voice/unlock/route";
import { maxUsdPerDay, spentToday } from "@/app/api/voice/_lib/spend";
import { LAB_COOKIE, labCookieValue } from "../lab-access";
import { appendLedger } from "../ledger";
import { createMockProvider } from "../providers/mock";
import { setProvidersForTesting } from "../registry";
import { newVoiceInput, tempStorage } from "./helpers";

const ROUTES = {
  "audio/[voiceId]/[chapterId]/[paragraph]": audioRoute,
  "chapters": chaptersRoute,
  "chapters/[chapterId]": chapterRoute,
  "ledger": ledgerRoute,
  "owner": ownerRoute,
  "providers": providersRoute,
  "voices": voicesRoute,
  "voices/[voiceId]": voiceRoute,
  "voices/[voiceId]/bindings": bindingsRoute,
  "unlock": unlockRoute,
} as const;

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type AnyHandler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

const ctx = <P extends Record<string, string>>(params: P = {} as P) => ({ params: Promise.resolve(params) });
const SECRET = "correct-horse-battery-staple-42";

/** A request from a browser that has unlocked the lab (the httpOnly lab cookie). */
function labRequest(url: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set("cookie", `other=1; ${LAB_COOKIE}=${labCookieValue()}`);
  return new Request(url, { ...init, headers });
}
/** What the lab's player sends for audio. */
const PLAYER = { "x-voice-player": "1", "sec-fetch-dest": "empty", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" };
const env = { ...process.env };
let t: ReturnType<typeof tempStorage>;
let mock: ReturnType<typeof createMockProvider>;

beforeEach(() => {
  t = tempStorage();
  process.env.VOICE_DATA_DIR = t.dir;
  process.env.STORY_CONTENT_DIR = path.join(t.dir, "no-content");
  delete process.env.VOICE_FAMILY_FILE;
  mock = createMockProvider();
  setProvidersForTesting([mock]);
});
afterEach(() => {
  process.env = { ...env };
  setProvidersForTesting(null);
  t.cleanup();
});

function listRouteFiles(dir: string, base = dir): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listRouteFiles(full, base);
    return name === "route.ts" ? [path.relative(base, dir).split(path.sep).join("/")] : [];
  });
}

describe("route guards", () => {
  it("knows every voice route (a new route must be added here, and to the no-free-text review)", () => {
    const found = listRouteFiles(path.join(process.cwd(), "app", "api", "voice")).sort();
    expect(found).toEqual(Object.keys(ROUTES).sort());
  });

  it("returns 404 from every handler when the flag is off", async () => {
    delete process.env.VOICE_ENGINE_ENABLED;
    for (const [name, mod] of Object.entries(ROUTES)) {
      for (const m of METHODS) {
        const h = (mod as Record<string, unknown>)[m] as AnyHandler | undefined;
        if (!h) continue;
        const res = await h(new Request(`http://localhost/api/voice/${name}`, { method: m }), ctx({ voiceId: "v", chapterId: "s1-ch01", paragraph: "0" }));
        expect(res.status, `${m} ${name}`).toBe(404);
      }
    }
  });

  it("returns 404 in production even with the flag on", async () => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    (process.env as Record<string, string>).NODE_ENV = "production";
    const res = await chaptersRoute.GET(new Request("http://localhost/api/voice/chapters"), ctx());
    expect(res.status).toBe(404);
  });

  it("returns 404 from every handler without the lab cookie, even with the flag on (a LAN client can't tell it's there)", async () => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    process.env.VOICE_LAB_SECRET = SECRET;
    const wrong = { cookie: `${LAB_COOKIE}=${"x".repeat(43)}` };
    for (const [name, mod] of Object.entries(ROUTES)) {
      if (name === "unlock") continue;
      for (const m of METHODS) {
        const h = (mod as Record<string, unknown>)[m] as AnyHandler | undefined;
        if (!h) continue;
        for (const headers of [{}, wrong]) {
          const res = await h(new Request(`http://localhost/api/voice/${name}`, { method: m, headers }), ctx({ voiceId: "v", chapterId: "s1-ch01", paragraph: "0" }));
          expect(res.status, `${m} ${name}`).toBe(404);
        }
      }
    }
    // No secret configured: the lab stays closed, cookie or not.
    delete process.env.VOICE_LAB_SECRET;
    expect((await chaptersRoute.GET(new Request("http://localhost/api/voice/chapters", { headers: wrong }), ctx())).status).toBe(404);
  });

  it("unlocks with the secret: httpOnly, SameSite=Strict cookie; wrong tries are refused", async () => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    const unlock = (secret: unknown, headers: Record<string, string> = {}) =>
      unlockRoute.POST(
        new Request("http://localhost/api/voice/unlock", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({ secret }) }),
        ctx(),
      );
    expect((await unlock(SECRET)).status).toBe(404); // no VOICE_LAB_SECRET set
    process.env.VOICE_LAB_SECRET = "too-short";
    expect((await unlock("too-short")).status).toBe(404); // under 16 characters doesn't count
    process.env.VOICE_LAB_SECRET = SECRET;
    expect((await unlock("nope")).status).toBe(401);
    expect((await unlock(SECRET, { "sec-fetch-site": "cross-site" })).status).toBe(400);
    const ok = await unlock(SECRET);
    expect(ok.status).toBe(204);
    const cookie = ok.headers.get("set-cookie")!;
    expect(cookie).toMatch(new RegExp(`^${LAB_COOKIE}=[A-Za-z0-9_-]{43};`));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain(SECRET); // an HMAC of it, never the secret
    const value = cookie.split(";")[0];
    const res = await chaptersRoute.GET(new Request("http://localhost/api/voice/chapters", { headers: { cookie: value } }), ctx());
    expect(res.status).toBe(200);
    // Changing the secret locks everyone out again.
    process.env.VOICE_LAB_SECRET = SECRET + "-rotated";
    expect((await chaptersRoute.GET(new Request("http://localhost/api/voice/chapters", { headers: { cookie: value } }), ctx())).status).toBe(404);
  });

  it("has no route that takes text: the audio route is GET-only and ignores a ?text= parameter", async () => {
    expect(Object.keys(audioRoute).filter((k) => (METHODS as readonly string[]).includes(k))).toEqual(["GET"]);
    for (const mod of Object.values(ROUTES)) {
      for (const k of Object.keys(mod)) expect(["GET", "POST", "PATCH", "DELETE", "runtime", "dynamic"]).toContain(k);
    }
  });
});

describe("HTTP flow with the flag on (mock provider)", () => {
  beforeEach(() => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    process.env.VOICE_LAB_SECRET = SECRET;
    process.env.VOICE_MIN_SAMPLE_SECONDS = "30";
  });

  async function createViaHttp() {
    const input = newVoiceInput();
    const form = new FormData();
    form.set("ownerName", input.ownerName);
    form.set("relationship", input.relationship);
    form.set("attestAdult", "true");
    form.set("attestOwnVoice", "true");
    form.set("attestNoChildVoice", "true");
    form.set("consentText", input.consent.text);
    form.set("consentScriptVersion", input.consent.scriptVersion);
    form.set("consentSpokenAt", input.consent.spokenAt);
    form.set("consentAudio", new Blob([input.consent.audio as BlobPart], { type: "audio/wav" }), "consent.wav");
    for (const s of input.samples) form.set(`sample:${s.passageId}`, new Blob([s.audio as BlobPart], { type: "audio/wav" }), `${s.passageId}.wav`);
    form.set("text", "Say whatever I type"); // ignored: there is no free-text field
    const res = await voicesRoute.POST(labRequest("http://localhost/api/voice/voices", { method: "POST", body: form }), ctx());
    expect(res.status).toBe(201);
    const body = (await res.json()) as { voice: { id: string; label: string }; ownerToken: string; ownerPath: string };
    expect(JSON.stringify(body.voice)).not.toContain("ownerTokenHash");
    const bind = await bindingsRoute.POST(
      labRequest(`http://localhost/api/voice/voices/${body.voice.id}/bindings`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-voice-owner-token": body.ownerToken },
        body: JSON.stringify({ provider: "mock" }),
      }),
      ctx({ voiceId: body.voice.id }),
    );
    expect(bind.status).toBe(201);
    return body;
  }

  it("creates, plays (ignoring ?text=), supports Range, switches off, and deletes", async () => {
    const { voice, ownerToken } = await createViaHttp();

    const noToken = await bindingsRoute.POST(
      labRequest("http://localhost/x", { method: "POST", body: JSON.stringify({ provider: "mock" }) }),
      ctx({ voiceId: voice.id }),
    );
    expect(noToken.status).toBe(401);

    const manifest = await (await chapterRoute.GET(labRequest("http://localhost/x"), ctx({ chapterId: "s1-ch01" }))).json();
    expect(manifest.items.filter((i: { type: string }) => i.type === "pause")).toHaveLength(1);

    const audioReq = (p: string, headers: Record<string, string> = {}) =>
      audioRoute.GET(
        labRequest(`http://localhost/api/voice/audio/${voice.id}/s1-ch01/${p}?provider=mock&text=Say%20something%20else`, {
          headers: { ...PLAYER, ...headers },
        }),
        ctx({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: p }),
      );
    const res = await audioReq("0");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("audio/wav");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("cross-origin-resource-policy")).toBe("same-origin");
    expect(res.headers.get("x-voice-cache")).toBe("miss");
    expect(mock.calls.synthesized.map((r) => r.text)).toEqual([expect.stringMatching(/^The lights of Candlemere/)]);
    expect(mock.calls.synthesized[0].text).not.toContain("Say something else");

    const ranged = await audioReq("0", { range: "bytes=0-9" });
    expect(ranged.status).toBe(206);
    expect(ranged.headers.get("content-range")).toMatch(/^bytes 0-9\/\d+$/);
    expect((await ranged.arrayBuffer()).byteLength).toBe(10);
    expect(ranged.headers.get("x-voice-cache")).toBe("hit");

    expect((await audioReq("0", { "sec-fetch-site": "cross-site" })).status).toBe(403);
    // No downloads: a typed-in URL (a navigation) or a plain <audio src> never gets the audio.
    expect((await audioReq("0", { "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "none" })).status).toBe(403);
    expect((await audioReq("0", { "sec-fetch-dest": "audio", "sec-fetch-mode": "no-cors" })).status).toBe(403);
    const noPlayerHeader = await audioRoute.GET(
      labRequest(`http://localhost/api/voice/audio/${voice.id}/s1-ch01/0?provider=mock`),
      ctx({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: "0" }),
    );
    expect(noPlayerHeader.status).toBe(403);
    expect((await audioReq("abc")).status).toBe(404);
    expect((await audioReq("99")).status).toBe(404);

    const asOwner = (method: string, init: RequestInit = {}, token = ownerToken) =>
      labRequest("http://localhost/api/voice/owner", { ...init, method, headers: { "x-voice-owner-token": token } });

    const off = await ownerRoute.PATCH(asOwner("PATCH", { body: JSON.stringify({ enabled: false }) }), ctx());
    expect(off.status).toBe(200);
    expect((await audioReq("0")).status).toBe(403);

    const owner = await (await ownerRoute.GET(asOwner("GET"), ctx())).json();
    expect(owner.consent.text).toMatch(/^I'm Jon, and I'd like Grit & Grace/);

    const del = await ownerRoute.DELETE(asOwner("DELETE"), ctx());
    expect(del.status).toBe(200);
    expect((await del.json()).receipt.placeholder).toBe(true);
    expect((await audioReq("0")).status).toBe(404);
    expect((await ownerRoute.GET(asOwner("GET"), ctx())).status).toBe(404);
    expect((await voiceRoute.GET(labRequest("http://localhost/x"), ctx({ voiceId: voice.id }))).status).toBe(404);

    const ledger = await (await ledgerRoute.GET(labRequest("http://localhost/api/voice/ledger?chapterId=s1-ch01"), ctx())).json();
    expect(ledger.rows[0]).toMatchObject({ provider: "mock", paragraphs: 1 });
  });

  it("keeps the owner token out of every path: header only, fragment in the owner link", async () => {
    const { voice, ownerToken, ownerPath } = await createViaHttp();
    expect(ownerPath).toBe(`/voice-lab/owner#${ownerToken}`);
    const owner = (method: string, headers: Record<string, string>, body?: string) =>
      labRequest("http://localhost/api/voice/owner", { method, headers, body });

    // No token, a malformed token, or someone else's well-formed token: the same 404.
    const badHeaders: Record<string, string>[] = [{}, { "x-voice-owner-token": "nope" }, { "x-voice-owner-token": "A".repeat(43) }];
    for (const headers of badHeaders) {
      for (const [m, h] of [["GET", ownerRoute.GET], ["DELETE", ownerRoute.DELETE]] as const) {
        const res = await h(owner(m, headers), ctx());
        expect(res.status, `${m} ${JSON.stringify(headers)}`).toBe(404);
        expect((await res.json()).error).toBe("voice_not_found");
      }
      expect((await ownerRoute.PATCH(owner("PATCH", headers, JSON.stringify({ enabled: false })), ctx())).status).toBe(404);
    }
    // The token in the query string is not a credential either.
    const inQuery = await ownerRoute.GET(labRequest(`http://localhost/api/voice/owner?token=${ownerToken}`), ctx());
    expect(inQuery.status).toBe(404);

    const good = { "x-voice-owner-token": ownerToken };
    const got = await ownerRoute.GET(owner("GET", good), ctx());
    expect(got.status).toBe(200);
    expect(got.headers.get("cache-control")).toBe("no-store");
    expect(got.headers.get("referrer-policy")).toBe("no-referrer");
    const gotBody = (await got.json()) as { voice: { id: string } };
    expect(gotBody.voice.id).toBe(voice.id);
    expect(JSON.stringify(gotBody)).not.toContain("ownerTokenHash");

    expect((await ownerRoute.PATCH(owner("PATCH", good, JSON.stringify({ enabled: "no" })), ctx())).status).toBe(400);
    expect((await ownerRoute.PATCH(owner("PATCH", { ...good, "sec-fetch-site": "cross-site" }, JSON.stringify({ enabled: false })), ctx())).status).toBe(400);
    expect((await ownerRoute.DELETE(owner("DELETE", { ...good, "sec-fetch-site": "same-site" }), ctx())).status).toBe(400);
    // Still there after the refused attempts.
    expect((await voiceRoute.GET(labRequest("http://localhost/x"), ctx({ voiceId: voice.id }))).status).toBe(200);
  });

  it("refuses a cache miss over VOICE_MAX_USD_PER_DAY with 429 spend_limit, but still plays cached paragraphs", async () => {
    const { voice } = await createViaHttp();
    const play = (p: string) =>
      audioRoute.GET(
        labRequest(`http://localhost/api/voice/audio/${voice.id}/s1-ch01/${p}?provider=mock`, { headers: PLAYER }),
        ctx({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: p }),
      );
    expect((await play("0")).headers.get("x-voice-cache")).toBe("miss");

    const spend = (ts: string, estCostUsd: number) =>
      appendLedger(t.storage, {
        ts, provider: "elevenlabs", model: "eleven_multilingual_v2", voiceId: voice.id, chapterId: "s1-ch01",
        paragraph: 9, characters: 1000, latencyMs: 1, estCostUsd, requests: 1, watermark: "none",
      });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await spend(yesterday.toISOString(), 100); // yesterday's spend doesn't count
    process.env.VOICE_MAX_USD_PER_DAY = "1";
    expect((await play("1")).status).toBe(200);

    await spend(new Date().toISOString(), 1.5);
    const calls = mock.calls.synthesized.length;
    const refused = await play("2");
    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(await refused.json()).toMatchObject({ error: "spend_limit", limitUsd: 1, spentTodayUsd: 1.5 });
    expect(mock.calls.synthesized.length).toBe(calls); // no provider call

    const cached = await play("0");
    expect(cached.status).toBe(200);
    expect(cached.headers.get("x-voice-cache")).toBe("hit");

    // Errors that happen before any provider call keep their own answers.
    expect((await play("99")).status).toBe(404);

    process.env.VOICE_MAX_USD_PER_DAY = "10";
    expect((await play("2")).status).toBe(200);
  });

  it("reads the spend limit and sums only today's ledger", () => {
    expect(maxUsdPerDay({})).toBe(5);
    expect(maxUsdPerDay({ VOICE_MAX_USD_PER_DAY: "" })).toBe(5);
    expect(maxUsdPerDay({ VOICE_MAX_USD_PER_DAY: "abc" })).toBe(5);
    expect(maxUsdPerDay({ VOICE_MAX_USD_PER_DAY: "-1" })).toBe(5);
    expect(maxUsdPerDay({ VOICE_MAX_USD_PER_DAY: "0" })).toBe(0);
    expect(maxUsdPerDay({ VOICE_MAX_USD_PER_DAY: "12.5" })).toBe(12.5);

    const now = new Date(2026, 8, 27, 15, 0, 0);
    const at = (d: Date, estCostUsd: number) => ({
      ts: d.toISOString(), provider: "mock" as const, model: "mock-tone", voiceId: "v", chapterId: "s1-ch01",
      paragraph: 0, characters: 1, latencyMs: 1, estCostUsd, requests: 1, watermark: "none" as const,
    });
    const entries = [
      at(new Date(2026, 8, 27, 0, 0, 0), 0.1),
      at(new Date(2026, 8, 27, 23, 59, 59), 0.2),
      at(new Date(2026, 8, 26, 23, 59, 59), 5),
      at(new Date(2026, 8, 28, 0, 0, 0), 5),
      { ...at(now, 1), ts: "not a date" },
    ];
    expect(spentToday(entries, now)).toBeCloseTo(0.3, 6);
  });

  it("lists providers without exposing keys", async () => {
    process.env.ELEVENLABS_API_KEY = "sk-should-not-leak";
    setProvidersForTesting(null);
    const res = await providersRoute.GET(labRequest("http://localhost/x"), ctx());
    const text = await res.text();
    expect(text).not.toContain("sk-should-not-leak");
    expect(JSON.parse(text).providers.find((p: { id: string }) => p.id === "elevenlabs").configured).toBe(true);
  });

  it("refuses oversized uploads before reading them, and more samples than there are passages", async () => {
    const big = await voicesRoute.POST(
      labRequest("http://localhost/api/voice/voices", {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=x", "content-length": String(300 * 1024 * 1024) },
        body: "--x--",
      }),
      ctx(),
    );
    expect(big.status).toBe(413);

    const input = newVoiceInput();
    const form = new FormData();
    for (let i = 0; i < 7; i++) form.append(`sample:extra-${i}`, new Blob([input.samples[0].audio as BlobPart], { type: "audio/wav" }), "x.wav");
    const many = await voicesRoute.POST(labRequest("http://localhost/api/voice/voices", { method: "POST", body: form }), ctx());
    expect(many.status).toBe(400);
    expect((await many.json()).message).toMatch(/Too many samples/);
  });

  it("refuses creation without the adult/own-voice attestations", async () => {
    const form = new FormData();
    form.set("ownerName", "Someone");
    form.set("relationship", "Parent");
    const res = await voicesRoute.POST(labRequest("http://localhost/x", { method: "POST", body: form }), ctx());
    expect(res.status).toBe(400);
  });
});
