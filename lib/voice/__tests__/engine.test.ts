import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getParagraphAudio } from "../engine";
import { readLedger, summarizeLedger } from "../ledger";
import { EMPTY_FAMILY, parseFamily } from "../personalize";
import { createMockProvider } from "../providers/mock";
import { setProvidersForTesting } from "../registry";
import { VoiceProviderError } from "../types";
import { decodeWav } from "../wav";
import { addBinding, createVoiceRecord, setEnabled, getVoice } from "../voices";
import { newVoiceInput, tempStorage } from "./helpers";

let t: ReturnType<typeof tempStorage>;
let mock: ReturnType<typeof createMockProvider>;
beforeEach(() => {
  t = tempStorage();
  mock = createMockProvider();
  setProvidersForTesting([mock]);
});
afterEach(() => {
  setProvidersForTesting(null);
  t.cleanup();
});

async function makeVoice() {
  const { voice, ownerToken } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
  await addBinding(t.storage, voice, "mock");
  return { voice: (await getVoice(t.storage, voice.id))!, ownerToken };
}

describe("engine end to end with the mock provider", () => {
  it("records consent, creates the voice, reads Chapter 1 paragraph by paragraph, then caches", async () => {
    const { voice } = await makeVoice();
    expect(voice.bindings).toHaveLength(1);
    expect(mock.calls.created[0].name).toBe(`gg-${voice.id}`); // no real name sent to the provider
    expect(mock.calls.created[0].samples).toHaveLength(6);

    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    const first = await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps);
    expect(first.cache).toBe("miss");
    expect(decodeWav(first.audio)).not.toBeNull();
    expect(mock.calls.synthesized[0].text).toMatch(/^The lights of Candlemere/);

    const again = await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps);
    expect(again.cache).toBe("hit");
    expect(again.audio).toEqual(first.audio);
    expect(mock.calls.synthesized).toHaveLength(1); // generated once

    for (let i = 1; i < 6; i++) await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: i }, deps);
    expect(mock.calls.synthesized).toHaveLength(6);
    const ledger = await readLedger(t.storage);
    expect(ledger).toHaveLength(6);
    const [row] = summarizeLedger(ledger, { chapterId: "s1-ch01" });
    expect(row).toMatchObject({ provider: "mock", paragraphs: 6, estCostUsd: 0 });
    expect(row.characters).toBe(mock.calls.synthesized.reduce((n, r) => n + r.text.length, 0));
  });

  it("generates a paragraph only once even when play and prefetch race", async () => {
    const { voice } = await makeVoice();
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    const req = { voiceId: voice.id, chapterId: "s1-ch01", paragraph: 2 };
    await Promise.all([getParagraphAudio(req, deps), getParagraphAudio(req, deps)]);
    expect(mock.calls.synthesized).toHaveLength(1);
  });

  it("caches per family: personalized text gets its own audio", async () => {
    const { voice } = await makeVoice();
    const fam = parseFamily({ slots: { youngest: { sample: "Clara", real: "Rosie" } } });
    const a = await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, { storage: t.storage, family: EMPTY_FAMILY });
    const b = await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, { storage: t.storage, family: fam });
    expect(b.cache).toBe("miss");
    expect(a.meta.key).not.toBe(b.meta.key);
    expect(mock.calls.synthesized[1].text).toContain("Tonight Rosie watched");
  });

  it("the off switch stops playback, cached audio included", async () => {
    const { voice } = await makeVoice();
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps);
    await setEnabled(t.storage, voice, false);
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps)).rejects.toMatchObject({
      code: "voice_off",
    });
    await setEnabled(t.storage, voice, true);
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps)).resolves.toMatchObject({
      cache: "hit",
    });
  });

  it("refuses unknown chapters, out-of-range paragraphs, unbound providers and odd models", async () => {
    const { voice } = await makeVoice();
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch55", paragraph: 0 }, deps)).rejects.toMatchObject({ code: "chapter_not_found" });
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 6 }, deps)).rejects.toMatchObject({ code: "paragraph_not_found" });
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: -1 }, deps)).rejects.toMatchObject({ code: "paragraph_not_found" });
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0, provider: "elevenlabs" }, deps)).rejects.toMatchObject({ code: "not_bound" });
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0, model: "anything" }, deps)).rejects.toMatchObject({ code: "model_not_allowed" });
    await expect(getParagraphAudio({ voiceId: "v_nope00000000", chapterId: "s1-ch01", paragraph: 0 }, deps)).rejects.toMatchObject({ code: "voice_not_found" });
  });

  it("a request arriving while another job is writing the cache shares it (never a second paid generation)", async () => {
    const { voice } = await makeVoice();
    let release!: () => void;
    const held = new Promise<void>((r) => (release = r));
    let atWrite!: () => void;
    const writing = new Promise<void>((r) => (atWrite = r));
    const storage = Object.create(t.storage) as typeof t.storage;
    storage.writeJson = async (key, value) => {
      if (key.startsWith("cache/")) {
        atWrite();
        await held;
      }
      return t.storage.writeJson(key, value);
    };
    const req = { voiceId: voice.id, chapterId: "s1-ch01", paragraph: 3 };
    const a = getParagraphAudio(req, { storage, family: EMPTY_FAMILY });
    await writing;
    const b = getParagraphAudio(req, { storage, family: EMPTY_FAMILY });
    release();
    await Promise.all([a, b]);
    const c = await getParagraphAudio(req, { storage, family: EMPTY_FAMILY });
    expect(c.cache).toBe("hit");
    expect(mock.calls.synthesized).toHaveLength(1);
  });

  it("maps a provider that stays busy (429) to rate_limited, and never passes provider bodies on", async () => {
    setProvidersForTesting([
      { ...mock, synthesize: async () => Promise.reject(new VoiceProviderError("mock", "synthesis failed (429)", 429)) },
    ]);
    const { voice } = await makeVoice();
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps)).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
    });
    setProvidersForTesting([
      { ...mock, synthesize: async () => Promise.reject(new VoiceProviderError("mock", "synthesis failed (422)", 422)) },
    ]);
    await expect(getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, deps)).rejects.toMatchObject({
      code: "provider_error",
      message: "mock: synthesis failed (422)",
    });
  });
});
