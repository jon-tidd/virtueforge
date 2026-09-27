import { afterEach, describe, expect, it } from "vitest";
import rates from "../rates.json";
import { estimateCostUsd, ratePerThousand, summarizeLedger } from "../ledger";
import { createMockProvider } from "../providers/mock";
import { defaultProviderId, getProvider, isProviderId, listProviders, PROVIDER_IDS, setProvidersForTesting } from "../registry";
import type { LedgerEntry, ProviderId, TTSProvider } from "../types";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
  setProvidersForTesting(null);
});

function fake(id: ProviderId, configured: boolean): TTSProvider {
  return { ...createMockProvider(), id, label: id, isConfigured: () => configured };
}

describe("registry", () => {
  it("knows exactly the four providers", () => {
    expect([...PROVIDER_IDS].sort()).toEqual(["chatterbox-fal", "chatterbox-http", "elevenlabs", "mock"]);
    expect(isProviderId("elevenlabs")).toBe(true);
    expect(isProviderId("azure")).toBe(false);
    expect(isProviderId(undefined)).toBe(false);
    expect(() => getProvider("azure" as ProviderId)).toThrow(/unknown provider/);
  });

  it("defaultProviderId: VOICE_DEFAULT_PROVIDER when configured", () => {
    setProvidersForTesting([fake("elevenlabs", true), fake("chatterbox-fal", true), fake("chatterbox-http", false)]);
    process.env.VOICE_DEFAULT_PROVIDER = "chatterbox-fal";
    expect(defaultProviderId()).toBe("chatterbox-fal");
  });

  it("defaultProviderId: ignores an unconfigured or unknown choice and takes the first configured real provider", () => {
    setProvidersForTesting([fake("elevenlabs", false), fake("chatterbox-fal", true), fake("chatterbox-http", true)]);
    process.env.VOICE_DEFAULT_PROVIDER = "elevenlabs";
    expect(defaultProviderId()).toBe("chatterbox-fal");
    process.env.VOICE_DEFAULT_PROVIDER = "not-a-provider";
    expect(defaultProviderId()).toBe("chatterbox-fal");
  });

  it("defaultProviderId: falls back to the mock when nothing real is configured", () => {
    setProvidersForTesting([fake("elevenlabs", false), fake("chatterbox-fal", false), fake("chatterbox-http", false)]);
    delete process.env.VOICE_DEFAULT_PROVIDER;
    expect(defaultProviderId()).toBe("mock");
  });

  it("builds the real adapters from env without keys and lists them without secrets", () => {
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.FAL_KEY;
    delete process.env.CHATTERBOX_URL;
    setProvidersForTesting(null);
    const list = listProviders();
    expect(list.map((p) => p.id)).toEqual([...PROVIDER_IDS]);
    expect(list.find((p) => p.id === "mock")!.configured).toBe(true);
    expect(list.filter((p) => p.id !== "mock").every((p) => !p.configured)).toBe(true);
    expect(list.find((p) => p.id === "elevenlabs")).toMatchObject({ defaultModel: "eleven_multilingual_v2", stitching: true });
  });
});

describe("cost estimates (rates.json)", () => {
  it("prices per 1,000 characters from rates.json", () => {
    expect(ratePerThousand("elevenlabs", "eleven_multilingual_v2")).toBe(0.1);
    expect(estimateCostUsd("elevenlabs", "eleven_multilingual_v2", 5750)).toBeCloseTo(0.575, 6);
    expect(estimateCostUsd("elevenlabs", "eleven_flash_v2_5", 5750)).toBeCloseTo(0.2875, 6);
    expect(estimateCostUsd("chatterbox-fal", "resemble-ai/chatterboxhd/text-to-speech", 1000)).toBeCloseTo(0.04, 6);
    expect(estimateCostUsd("mock", "mock-tone", 99999)).toBe(0);
  });

  it("falls back to the provider's first rate for an unknown model", () => {
    const first = Object.values(rates.perThousandChars["chatterbox-http"])[0];
    expect(ratePerThousand("chatterbox-http", "chatterbox-turbo")).toBe(first);
    expect(ratePerThousand("elevenlabs", "eleven_future_v9")).toBe(rates.perThousandChars.elevenlabs.eleven_multilingual_v2);
  });

  it("returns 0 for a provider with no rates at all", () => {
    expect(ratePerThousand("nobody" as ProviderId, "x")).toBe(0);
  });

  it("summarizes the ledger per provider and model, with filters", () => {
    const e = (o: Partial<LedgerEntry>): LedgerEntry => ({
      ts: "2026-09-27T00:00:00Z",
      provider: "mock",
      model: "mock-tone",
      voiceId: "v_a",
      chapterId: "s1-ch01",
      paragraph: 0,
      characters: 100,
      latencyMs: 1000,
      estCostUsd: 0.01,
      requests: 1,
      watermark: "none",
      ...o,
    });
    const rows = summarizeLedger([
      e({}),
      e({ paragraph: 1, characters: 300, latencyMs: 3000 }),
      e({ provider: "elevenlabs", model: "eleven_v3" }),
      e({ voiceId: "v_b" }),
      e({ chapterId: "s1-ch02" }),
    ], { chapterId: "s1-ch01", voiceId: "v_a" });
    expect(rows).toEqual([
      { provider: "elevenlabs", model: "eleven_v3", paragraphs: 1, characters: 100, totalLatencyMs: 1000, avgLatencyMs: 1000, estCostUsd: 0.01 },
      { provider: "mock", model: "mock-tone", paragraphs: 2, characters: 400, totalLatencyMs: 4000, avgLatencyMs: 2000, estCostUsd: 0.02 },
    ]);
  });
});
