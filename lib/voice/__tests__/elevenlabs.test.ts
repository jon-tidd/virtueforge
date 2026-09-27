import { describe, expect, it, vi } from "vitest";
import { createElevenLabsProvider } from "../providers/elevenlabs";
import { toneWav } from "../wav";

const KEY = "test-key-not-real";

function fakeFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init ?? {}));
}

describe("ElevenLabs adapter (mocked fetch)", () => {
  it("creates an IVC voice with multipart files and the xi-api-key header", async () => {
    const f = fakeFetch(async (url, init) => {
      expect(url).toBe("https://api.elevenlabs.io/v1/voices/add");
      expect(init.method).toBe("POST");
      expect(new Headers(init.headers).get("xi-api-key")).toBe(KEY);
      const form = init.body as FormData;
      expect(form.get("name")).toBe("gg-v_x");
      expect(form.get("remove_background_noise")).toBe("false");
      expect(form.getAll("files")).toHaveLength(2);
      return Response.json({ voice_id: "voice123", requires_verification: false });
    });
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    const sample = { filename: "a.wav", contentType: "audio/wav", data: toneWav(1) };
    const out = await p.createVoice({ name: "gg-v_x", samples: [sample, sample], referenceClip: sample });
    expect(out).toEqual({ providerVoiceId: "voice123", requiresVerification: false });
  });

  it("synthesizes with Multilingual v2 and request stitching, reading request-id and character-cost", async () => {
    const f = fakeFetch(async (url, init) => {
      expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voice123?output_format=mp3_44100_128");
      const body = JSON.parse(String(init.body));
      expect(body).toEqual({
        text: "Hello there.",
        model_id: "eleven_multilingual_v2",
        previous_request_ids: ["r1", "r2", "r3"],
        next_text: "Next one.",
      });
      return new Response(new Uint8Array([1, 2, 3]), { headers: { "request-id": "r4", "character-cost": "12" } });
    });
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    const out = await p.synthesize({
      providerVoiceId: "voice123",
      text: "Hello there.",
      model: "eleven_multilingual_v2",
      context: { previousText: "Before.", nextText: "Next one.", previousRequestIds: ["r0", "r1", "r2", "r3"] },
    });
    expect(out).toMatchObject({ contentType: "audio/mpeg", ext: "mp3", requestId: "r4", charactersBilled: 12, watermark: "provider-claimed" });
    expect(Array.from(out.audio)).toEqual([1, 2, 3]);
  });

  it("falls back to previous_text without request ids, and drops stitching on v3", async () => {
    const bodies: Record<string, unknown>[] = [];
    const f = fakeFetch(async (_url, init) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(new Uint8Array([0]));
    });
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    const ctx = { previousText: "Before.", nextText: "After." };
    await p.synthesize({ providerVoiceId: "v", text: "Now.", model: "eleven_flash_v2_5", context: ctx });
    await p.synthesize({ providerVoiceId: "v", text: "Now.", model: "eleven_v3", context: ctx });
    expect(bodies[0]).toEqual({ text: "Now.", model_id: "eleven_flash_v2_5", previous_text: "Before.", next_text: "After." });
    expect(bodies[1]).toEqual({ text: "Now.", model_id: "eleven_v3" });
  });

  it("retries once with previous_text when stale/purged request ids are refused", async () => {
    const bodies: Record<string, unknown>[] = [];
    const f = fakeFetch(async (_url, init) => {
      const body = JSON.parse(String(init.body));
      bodies.push(body);
      if (body.previous_request_ids) return new Response("invalid request id", { status: 400 });
      return new Response(new Uint8Array([7]), { headers: { "request-id": "r9" } });
    });
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    const out = await p.synthesize({
      providerVoiceId: "v",
      text: "Now.",
      model: "eleven_multilingual_v2",
      context: { previousText: "Before.", nextText: "After.", previousRequestIds: ["gone"] },
    });
    expect(out.requestId).toBe("r9");
    expect(bodies).toEqual([
      { text: "Now.", model_id: "eleven_multilingual_v2", previous_request_ids: ["gone"], next_text: "After." },
      { text: "Now.", model_id: "eleven_multilingual_v2", previous_text: "Before.", next_text: "After." },
    ]);
  });

  it("does not retry other failures", async () => {
    const f = fakeFetch(async () => new Response("server", { status: 500 }));
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    await expect(
      p.synthesize({ providerVoiceId: "v", text: "Now.", model: "eleven_multilingual_v2", context: { previousRequestIds: ["r1"] } }),
    ).rejects.toThrow(/500/);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("rejects models outside the allowlist and over-long text", async () => {
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: fakeFetch(() => new Response("")) });
    await expect(p.synthesize({ providerVoiceId: "v", text: "x", model: "eleven_monolingual_v1" })).rejects.toThrow(/not allowed/);
    await expect(p.synthesize({ providerVoiceId: "v", text: "x".repeat(5001), model: "eleven_v3" })).rejects.toThrow(/takes 5000/);
  });

  it("deletes the voice (404 counts as gone) and purges history without a cursor until it is empty", async () => {
    const calls: string[] = [];
    // A server that holds 3 items and hands out at most 2 per page, and
    // (like a real one) doesn't accept a cursor pointing at a deleted item.
    const items = ["h1", "h2", "h3"];
    const f = fakeFetch(async (url, init) => {
      calls.push(`${init.method} ${url.replace("https://api.elevenlabs.io", "")}`);
      if (url.includes("/v1/history?")) {
        if (url.includes("start_after")) return new Response("stale cursor", { status: 400 });
        return Response.json({ history: items.slice(0, 2).map((id) => ({ history_item_id: id })), has_more: items.length > 2 });
      }
      const m = /\/v1\/history\/(\w+)$/.exec(url);
      if (m) {
        items.splice(items.indexOf(m[1]), 1);
        return Response.json({ status: "ok" });
      }
      if (url.endsWith("/v1/voices/gone")) return new Response("", { status: 404 });
      return Response.json({ status: "ok" });
    });
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    expect(await p.purgeHistory!("voice123")).toEqual({ deleted: 3 });
    expect(await p.deleteVoice("voice123")).toEqual({ deleted: true });
    expect(await p.deleteVoice("gone")).toMatchObject({ deleted: true });
    expect(calls).toEqual([
      "GET /v1/history?voice_id=voice123&page_size=1000",
      "DELETE /v1/history/h1",
      "DELETE /v1/history/h2",
      "GET /v1/history?voice_id=voice123&page_size=1000",
      "DELETE /v1/history/h3",
      "DELETE /v1/voices/voice123",
      "DELETE /v1/voices/gone",
    ]);
  });

  it("stops a purge that never empties instead of looping forever", async () => {
    const f = fakeFetch(async (url) =>
      url.includes("/v1/history?") ? Response.json({ history: [{ history_item_id: "stuck" }], has_more: true }) : Response.json({ status: "ok" }),
    );
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    await expect(p.purgeHistory!("v")).rejects.toThrow(/stopped after/);
  });

  it("retries 429/503 with backoff and Retry-After, then reports an exhausted 429 by status", async () => {
    const waits: number[] = [];
    const sleep = async (ms: number) => void waits.push(ms);
    let n = 0;
    const ok = fakeFetch(async () =>
      ++n === 1
        ? new Response('{"detail":{"status":"too_many_concurrent_requests"}}', { status: 429, headers: { "Retry-After": "1" } })
        : n === 2
          ? new Response("busy", { status: 503 })
          : new Response(new Uint8Array([1])),
    );
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: ok, retry: { sleep } });
    await expect(p.synthesize({ providerVoiceId: "v", text: "Now.", model: "eleven_multilingual_v2" })).resolves.toBeTruthy();
    expect(waits).toEqual([1000, 1000]);
    for (const init of ok.mock.calls.map((c) => c[1])) expect(init?.redirect).toBe("error");

    const busy = fakeFetch(async () => new Response("system_busy", { status: 429 }));
    const q = createElevenLabsProvider({ apiKey: KEY, fetch: busy, retry: { sleep } });
    const err = await q.synthesize({ providerVoiceId: "v", text: "Now.", model: "eleven_multilingual_v2" }).catch((e) => e);
    expect(err).toMatchObject({ status: 429 });
    expect(busy).toHaveBeenCalledTimes(3);
  });

  it("never puts a provider response body into an error (it can echo our text or URLs)", async () => {
    const f = fakeFetch(async () => new Response('{"detail":[{"input":{"text":"Tonight Rosie watched"}}]}', { status: 422 }));
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: f });
    const err = await p.synthesize({ providerVoiceId: "v", text: "Tonight Rosie watched", model: "eleven_multilingual_v2" }).catch((e) => e);
    expect(err.message).toBe("elevenlabs: synthesis failed (422)");
    const del = await createElevenLabsProvider({ apiKey: KEY, fetch: fakeFetch(async () => new Response("secret body", { status: 500 })) })
      .deleteVoice("v")
      .catch((e) => e);
    expect(del.message).toBe("elevenlabs: voice delete failed (500)");
  });

  it("never puts the key in an error, and says when it's missing", async () => {
    const p = createElevenLabsProvider({ apiKey: KEY, fetch: fakeFetch(() => new Response("bad", { status: 401 })) });
    const err = await p.synthesize({ providerVoiceId: "v", text: "x", model: "eleven_multilingual_v2" }).catch((e) => e);
    expect(String(err.message)).toMatch(/401/);
    expect(String(err.message)).not.toContain(KEY);
    const noKey = createElevenLabsProvider({ apiKey: "", fetch: fakeFetch(() => new Response("")) });
    expect(noKey.isConfigured()).toBe(false);
    await expect(noKey.deleteVoice("v")).rejects.toThrow(/ELEVENLABS_API_KEY is not set/);
  });
});
