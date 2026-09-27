import { describe, expect, it, vi } from "vitest";
import { createChatterboxFalProvider, createChatterboxHttpProvider, FAL_MODELS, isFalUrl, safeChatterboxUrl } from "../providers/chatterbox";
import { decodeWav, durationSeconds, toneWav } from "../wav";

const ref = { filename: "reference.wav", contentType: "audio/wav", data: toneWav(10) };
const LONG =
  "The lights of Candlemere were going out, one by one, and nobody knew why. Tonight Clara watched from the window as the lamp over the Moot Hall door shrank to the size of a seed, and went out. " +
  "Now the only light left in the whole village was Grandma Ruth's fire, crackling behind her. Then something tapped on the glass. Tap. Tap. Tap. " +
  "Clara pulled back the curtain. On the sill sat a red fox, wet to the ears, with a leaf stuck to one of them.";

describe("Chatterbox on fal.ai (mocked fetch)", () => {
  it("uploads the reference once (with a 1 h expiry), chunks the paragraph and joins the WAVs", async () => {
    const seen: Array<{ url: string; init: RequestInit }> = [];
    const f = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = String(input);
      seen.push({ url, init });
      if (url.startsWith("https://rest.fal.ai/storage/upload/initiate")) {
        return Response.json({ upload_url: "https://v3.fal.media/files/upload/put", file_url: "https://v3.fal.media/files/ref.wav" });
      }
      if (url === "https://v3.fal.media/files/upload/put") return new Response(null, { status: 200 });
      if (url === "https://fal.run/fal-ai/chatterbox/text-to-speech") {
        return Response.json({ audio: { url: "https://v3.fal.media/files/out.wav" } });
      }
      if (url === "https://v3.fal.media/files/out.wav") return new Response(toneWav(1, 24000) as BodyInit);
      throw new Error(`unexpected ${url}`);
    });
    const p = createChatterboxFalProvider({ apiKey: "fal-test", fetch: f });
    expect((await p.createVoice({ name: "x", samples: [ref], referenceClip: ref })).providerVoiceId).toMatch(/^ref-/);

    const out = await p.synthesize({ providerVoiceId: "ref-x", text: LONG, model: "", referenceClip: ref });
    const runs = seen.filter((s) => s.url.startsWith("https://fal.run/"));
    expect(runs.length).toBe(out.requests);
    expect(runs.length).toBeGreaterThan(1);
    for (const r of runs) {
      const h = new Headers(r.init.headers);
      expect(r.init.redirect).toBe("error");
      expect(h.get("authorization")).toBe("Key fal-test");
      expect(h.get("x-fal-store-io")).toBe("0");
      expect(JSON.parse(h.get("x-fal-object-lifecycle-preference")!)).toEqual({ expiration_duration_seconds: 3600 });
      const body = JSON.parse(String(r.init.body));
      expect(body.audio_url).toBe("https://v3.fal.media/files/ref.wav");
      expect(body.text.length).toBeLessThanOrEqual(350);
      expect(body.seed).toBe(1234);
    }
    const pcm = decodeWav(out.audio)!;
    expect(durationSeconds(pcm)).toBeGreaterThan(runs.length * 1);
    expect(out).toMatchObject({ contentType: "audio/wav", model: "fal-ai/chatterbox/text-to-speech", watermark: "perth-hosted" });

    await p.synthesize({ providerVoiceId: "ref-x", text: "Short.", model: "", referenceClip: ref });
    const inits = seen.filter((s) => s.url.includes("upload/initiate"));
    expect(inits).toHaveLength(1); // reused
    // The upload takes fal's storage lifecycle header (as fal-js sends it), not the run header.
    const uh = new Headers(inits[0].init.headers);
    expect(JSON.parse(uh.get("x-fal-object-lifecycle")!)).toEqual({ expiration_duration_seconds: 3600 });
    expect(uh.get("x-fal-object-lifecycle-preference")).toBeNull();
    expect(uh.get("authorization")).toBe("Key fal-test");
    expect(JSON.parse(String(inits[0].init.body))).toEqual({ file_name: "reference.wav", content_type: "audio/wav" });
    expect(inits[0].url).toBe("https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3");
  });

  it.each(FAL_MODELS)("always sends our audio_url (never fal's stock voice) on every chunk for %s", async (model) => {
    const bodies: Array<Record<string, unknown>> = [];
    const f = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = String(input);
      if (url.includes("upload/initiate")) return Response.json({ upload_url: "https://v3.fal.media/files/upload/put", file_url: "https://v3.fal.media/files/ref.wav" });
      if (url === "https://v3.fal.media/files/upload/put") return new Response(null, { status: 200 });
      if (url === `https://fal.run/${model}`) {
        bodies.push(JSON.parse(String(init.body)));
        return Response.json({ audio: { url: "https://v3.fal.media/files/out.wav" } });
      }
      if (url === "https://v3.fal.media/files/out.wav") return new Response(toneWav(0.5, 24000) as BodyInit);
      throw new Error(`unexpected ${url}`);
    });
    const p = createChatterboxFalProvider({ apiKey: "k", fetch: f });
    const out = await p.synthesize({ providerVoiceId: "ref-x", text: LONG, model, referenceClip: ref });
    expect(out.model).toBe(model);
    expect(bodies.length).toBe(out.requests);
    expect(bodies.length).toBeGreaterThan(1);
    for (const b of bodies) expect(b.audio_url).toBe("https://v3.fal.media/files/ref.wav");
  });

  it("refuses to run when the upload gives no URL (fal would read in its demo voice)", async () => {
    const calls: string[] = [];
    const f = vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return Response.json({ upload_url: "https://v3.fal.media/files/upload/put", file_url: "" });
    });
    const p = createChatterboxFalProvider({ apiKey: "k", fetch: f });
    await expect(p.synthesize({ providerVoiceId: "r", text: "Hi.", model: "", referenceClip: ref })).rejects.toThrow(/no URLs|no usable URL/);
    expect(calls.some((u) => u.startsWith("https://fal.run/"))).toBe(false);
  });

  it("requires a key and a reference clip", async () => {
    const p = createChatterboxFalProvider({ apiKey: "", fetch: vi.fn() });
    expect(p.isConfigured()).toBe(false);
    await expect(p.synthesize({ providerVoiceId: "r", text: "x", model: "", referenceClip: ref })).rejects.toThrow(/FAL_KEY/);
    const q = createChatterboxFalProvider({ apiKey: "k", fetch: vi.fn() });
    await expect(q.synthesize({ providerVoiceId: "r", text: "x", model: "" })).rejects.toThrow(/reference clip/);
  });
});

describe("Chatterbox self-hosted HTTP (mocked fetch)", () => {
  it("posts multipart text + reference to /tts and trusts X-Watermark: perth", async () => {
    const f = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
      expect(String(input)).toBe("http://127.0.0.1:8000/tts");
      expect(init.redirect).toBe("error");
      expect(new Headers(init.headers).get("authorization")).toBe("Bearer tok");
      const form = init.body as FormData;
      expect(form.get("text")).toBe("Short line.");
      expect(form.get("reference")).toBeInstanceOf(Blob);
      expect(form.get("seed")).toBe("1234");
      return new Response(toneWav(1, 24000) as BodyInit, { headers: { "X-Watermark": "perth" } });
    });
    const p = createChatterboxHttpProvider({ url: "http://127.0.0.1:8000/", token: "tok", fetch: f });
    const out = await p.synthesize({ providerVoiceId: "ref-x", text: "Short line.", model: "chatterbox", referenceClip: ref });
    expect(out.watermark).toBe("perth");
    expect(out.requests).toBe(1);
  });

  it("marks audio unwatermarked if the server doesn't say perth", async () => {
    const f = vi.fn(async () => new Response(toneWav(1, 24000) as BodyInit));
    const p = createChatterboxHttpProvider({ url: "https://gpu.example.com", fetch: f });
    const out = await p.synthesize({ providerVoiceId: "ref-x", text: "Hi.", model: "chatterbox", referenceClip: ref });
    expect(out.watermark).toBe("none");
  });
});

describe("Chatterbox: no SSRF, no voice clip over cleartext", () => {
  const handler = (overrides: { upload?: string; file?: string; audio?: string }) => {
    const seen: string[] = [];
    const f = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      seen.push(url);
      if (url.includes("upload/initiate")) {
        return Response.json({
          upload_url: overrides.upload ?? "https://v3.fal.media/files/upload/put",
          file_url: overrides.file ?? "https://v3.fal.media/files/ref.wav",
        });
      }
      if (url.startsWith("https://v3.fal.media/files/upload")) return new Response(null, { status: 200 });
      if (url.startsWith("https://fal.run/")) return Response.json({ audio: { url: overrides.audio ?? "https://v3.fal.media/files/out.wav" } });
      if (url === "https://v3.fal.media/files/out.wav") return new Response(toneWav(0.5, 24000) as BodyInit);
      return new Response(toneWav(0.5, 24000) as BodyInit);
    });
    return { f, seen };
  };

  it("only accepts https fal hosts", () => {
    expect(isFalUrl("https://v3.fal.media/files/x.wav")).toBe(true);
    expect(isFalUrl("https://fal.media/x")).toBe(true);
    expect(isFalUrl("https://rest.alpha.fal.ai/x")).toBe(true);
    expect(isFalUrl("http://v3.fal.media/x")).toBe(false);
    expect(isFalUrl("https://evilfal.media/x")).toBe(false);
    expect(isFalUrl("https://fal.media.evil.com/x")).toBe(false);
    expect(isFalUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isFalUrl("https://user:pw@v3.fal.media/x")).toBe(false);
    expect(isFalUrl(42)).toBe(false);
  });

  it.each([
    ["an audio URL off fal's hosts (internal address)", { audio: "http://169.254.169.254/latest/meta-data" }, "audio URL"],
    ["an audio URL on another https host", { audio: "https://attacker.example/out.wav" }, "audio URL"],
    ["an upload_url that would send the clip elsewhere", { upload: "https://attacker.example/put" }, "upload_url"],
    ["a file_url off fal's hosts", { file: "https://attacker.example/ref.wav" }, "file_url"],
  ])("refuses %s, without the URL in the error and without fetching it", async (_name, overrides, what) => {
    const { f, seen } = handler(overrides);
    const p = createChatterboxFalProvider({ apiKey: "k", fetch: f });
    const err = await p.synthesize({ providerVoiceId: "ref-x", text: "Hello there.", model: "", referenceClip: ref }).catch((e) => e);
    expect(String(err.message)).toContain(what);
    expect(String(err.message)).not.toMatch(/attacker|169\.254/);
    expect(seen.some((u) => /attacker|169\.254/.test(u))).toBe(false);
  });

  it("forgets the reference upload on delete and reports when fal's copy expires", async () => {
    let t = Date.parse("2026-09-27T20:00:00Z");
    const { f, seen } = handler({});
    const p = createChatterboxFalProvider({ apiKey: "k", fetch: f, now: () => t });
    await p.synthesize({ providerVoiceId: "ref-x", text: "Hello there.", model: "", referenceClip: ref });
    t += 60_000;
    // fal last received this voice at 20:00, so its copies are gone by 21:00.
    const del = await p.deleteVoice("ref-x");
    expect(del).toMatchObject({ deleted: false, expiresAt: "2026-09-27T21:00:00.000Z" });
    // The next synthesis uploads afresh rather than reusing the old URL.
    await p.synthesize({ providerVoiceId: "ref-x", text: "Hello there.", model: "", referenceClip: ref });
    expect(seen.filter((u) => u.includes("upload/initiate"))).toHaveLength(2);
  });

  it("self-hosted: https anywhere, plain http only to this machine", () => {
    expect(safeChatterboxUrl("https://gg--chatterbox.modal.run/")).toBe("https://gg--chatterbox.modal.run");
    expect(safeChatterboxUrl("http://127.0.0.1:8000")).toBe("http://127.0.0.1:8000");
    expect(safeChatterboxUrl("http://localhost:8000")).toBe("http://localhost:8000");
    expect(safeChatterboxUrl("http://[::1]:8000")).toBe("http://[::1]:8000");
    expect(safeChatterboxUrl("http://gpu.local:8000")).toBeNull();
    expect(safeChatterboxUrl("http://10.0.0.5:8000")).toBeNull();
    expect(safeChatterboxUrl("ftp://127.0.0.1")).toBeNull();
    expect(safeChatterboxUrl("not a url")).toBeNull();
  });

  it("self-hosted: an http CHATTERBOX_URL on another host is 'not configured' and never gets the token or the clip", async () => {
    const f = vi.fn(async () => new Response(toneWav(1, 24000) as BodyInit));
    const p = createChatterboxHttpProvider({ url: "http://gpu.local:8000", token: "t".repeat(40), fetch: f });
    expect(p.isConfigured()).toBe(false);
    await expect(p.synthesize({ providerVoiceId: "ref-x", text: "Hi.", model: "chatterbox", referenceClip: ref })).rejects.toThrow(/https/);
    expect(f).not.toHaveBeenCalled();
  });

  it("retries a busy (429) self-hosted server, honouring Retry-After", async () => {
    const waits: number[] = [];
    let n = 0;
    const f = vi.fn(async () =>
      ++n < 3 ? new Response("busy", { status: 429, headers: { "Retry-After": "2" } }) : new Response(toneWav(1, 24000) as BodyInit),
    );
    const p = createChatterboxHttpProvider({ url: "https://gpu.example.com", fetch: f, retry: { sleep: async (ms) => void waits.push(ms) } });
    await expect(p.synthesize({ providerVoiceId: "ref-x", text: "Hi.", model: "chatterbox", referenceClip: ref })).resolves.toBeTruthy();
    expect(waits).toEqual([2000, 2000]);
  });
});
