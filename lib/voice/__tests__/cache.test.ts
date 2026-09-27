import { describe, expect, it } from "vitest";
import { cacheKey } from "../cache";

const base = {
  voiceId: "v_aaaaaaaaaaaa",
  provider: "elevenlabs" as const,
  model: "eleven_multilingual_v2",
  providerVoiceId: "abc",
  chapterHash: "h1",
  paragraph: 2,
  text: "Hugh lifted the latch.",
};

describe("cache keys", () => {
  it("is a stable sha256", () => {
    expect(cacheKey(base)).toMatch(/^[0-9a-f]{64}$/);
    expect(cacheKey(base)).toBe(cacheKey({ ...base }));
  });

  it("changes with every input", () => {
    const k = cacheKey(base);
    for (const change of [
      { voiceId: "v_bbbbbbbbbbbb" },
      { provider: "mock" as const },
      { model: "eleven_v3" },
      { providerVoiceId: "xyz" },
      { chapterHash: "h2" },
      { paragraph: 3 },
      { text: "Sam lifted the latch." }, // personalized text -> per-family cache entry
    ]) {
      expect(cacheKey({ ...base, ...change })).not.toBe(k);
    }
  });

  it("can't be confused by field boundaries", () => {
    expect(cacheKey({ ...base, model: "a|b", providerVoiceId: "c" })).not.toBe(
      cacheKey({ ...base, model: "a", providerVoiceId: "b|c" }),
    );
  });
});
