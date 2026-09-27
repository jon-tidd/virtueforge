import { createHash } from "node:crypto";
import type { ProviderId } from "./types";

export interface CacheKeyParts {
  /** Our voice id. Two voices never share audio, so deleting one can't strand or steal the other's cache. */
  voiceId: string;
  provider: ProviderId;
  model: string;
  providerVoiceId: string;
  /** sha256 of the chapter file. */
  chapterHash: string;
  paragraph: number;
  /** The exact text sent to the provider (after personalization). */
  text: string;
}

/**
 * sha256 over every input that changes the audio. Because the final text is
 * included, each family's personalized paragraph gets its own entry, and any
 * edit to a chapter makes a fresh key (generate once per version).
 */
export function cacheKey(p: CacheKeyParts): string {
  const canonical = JSON.stringify([
    "gg-voice-cache-v1",
    p.voiceId,
    p.provider,
    p.model,
    p.providerVoiceId,
    p.chapterHash,
    p.paragraph,
    p.text,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

export function sha256Hex(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Where a paragraph's audio and meta live: under a per-voice prefix, so a
 * delete removes every cached file of that voice with one prefix delete,
 * including files a generation still in flight writes (see engine.ts).
 */
export function cacheDir(voiceId: string): string {
  return `cache/${voiceId}/`;
}
export function cacheMetaKey(voiceId: string, key: string): string {
  return `cache/${voiceId}/${key}.json`;
}
export function cacheAudioKey(voiceId: string, key: string, ext: string): string {
  return `cache/${voiceId}/${key}.${ext}`;
}
