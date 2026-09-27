import { describe, expect, it } from "vitest";
import { isVoiceEngineEnabled } from "../flag";

describe("voice feature flag", () => {
  it("is off unless VOICE_ENGINE_ENABLED is exactly 'true'", () => {
    expect(isVoiceEngineEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isVoiceEngineEnabled({ NODE_ENV: "development", VOICE_ENGINE_ENABLED: "1" })).toBe(false);
    expect(isVoiceEngineEnabled({ NODE_ENV: "development", VOICE_ENGINE_ENABLED: "TRUE" })).toBe(false);
    expect(isVoiceEngineEnabled({ NODE_ENV: "development", VOICE_ENGINE_ENABLED: "true" })).toBe(true);
    expect(isVoiceEngineEnabled({ NODE_ENV: "test", VOICE_ENGINE_ENABLED: "true" })).toBe(true);
  });

  it("is always off in production, even when switched on", () => {
    expect(isVoiceEngineEnabled({ NODE_ENV: "production", VOICE_ENGINE_ENABLED: "true" })).toBe(false);
    expect(isVoiceEngineEnabled({ NODE_ENV: "development", VERCEL_ENV: "production", VOICE_ENGINE_ENABLED: "true" })).toBe(false);
  });

  it("allows Vercel preview only outside production NODE_ENV", () => {
    expect(isVoiceEngineEnabled({ NODE_ENV: "development", VERCEL_ENV: "preview", VOICE_ENGINE_ENABLED: "true" })).toBe(true);
  });
});
