import { createHash } from "node:crypto";
import { toneWav } from "../wav";
import type { CreateVoiceInput, SynthesisRequest, TTSProvider } from "../types";

// No keys, no network. Returns a short hum per paragraph whose length follows
// the text (about 60 ms a character, capped at 6 s), so the reader, the
// prefetching and the cache can be built and tested without spending money.

export interface MockOptions {
  /** Artificial delay per paragraph, to see loading states in the UI. */
  delayMs?: number;
}

export function createMockProvider(opts: MockOptions = {}): TTSProvider & {
  calls: { created: CreateVoiceInput[]; deleted: string[]; synthesized: SynthesisRequest[] };
} {
  const calls = { created: [] as CreateVoiceInput[], deleted: [] as string[], synthesized: [] as SynthesisRequest[] };
  return {
    id: "mock",
    label: "Mock (a hum, no keys)",
    capabilities: {
      cloning: true,
      watermark: false,
      streaming: false,
      maxCharsPerRequest: 10_000,
      stitching: false,
      needsReferenceClip: false,
    },
    defaultModel: "mock-tone",
    models: ["mock-tone"],
    isConfigured: () => true,
    calls,

    async createVoice(input) {
      calls.created.push(input);
      const h = createHash("sha256");
      for (const s of input.samples) h.update(s.data);
      return { providerVoiceId: `mock-${h.digest("hex").slice(0, 16)}` };
    },

    async deleteVoice(providerVoiceId) {
      calls.deleted.push(providerVoiceId);
      return { deleted: true };
    },

    async synthesize(req) {
      calls.synthesized.push(req);
      const started = Date.now();
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      const seconds = Math.min(6, Math.max(0.4, req.text.length * 0.06));
      // Each voice hums at its own pitch so two voices sound different.
      const pitch = 180 + (parseInt(createHash("md5").update(req.providerVoiceId).digest("hex").slice(0, 4), 16) % 120);
      return {
        audio: toneWav(seconds, 16000, pitch),
        contentType: "audio/wav",
        ext: "wav",
        model: req.model,
        charactersBilled: req.text.length,
        latencyMs: Date.now() - started,
        watermark: "none",
        requests: 1,
      };
    },
  };
}
