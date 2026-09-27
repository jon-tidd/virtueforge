import path from "node:path";

// Read at call time (not import time) so tests and the dev server see env changes.

export function voiceDataDir(): string {
  return process.env.VOICE_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), ".voice-data");
}

export function storyContentDir(): string {
  return (
    process.env.STORY_CONTENT_DIR ||
    path.join(/* turbopackIgnore: true */ process.cwd(), "docs", "redesign", "story", "season-1")
  );
}

/** Optional JSON file with the family's real names. Read at runtime only. */
export function familyFilePath(): string | null {
  return process.env.VOICE_FAMILY_FILE || null;
}

/** Minimum total guided-reading audio before a voice can be made. */
export function minSampleSeconds(): number {
  const raw = process.env.VOICE_MIN_SAMPLE_SECONDS;
  const v = Number(raw);
  return raw !== undefined && raw !== "" && Number.isFinite(v) && v >= 0 ? v : 60;
}

/** How far the browser's "started reading" time may be from the server's clock. */
export const SPOKEN_AT_MAX_AGE_MS = 30 * 60 * 1000;
export const SPOKEN_AT_MAX_AHEAD_MS = 2 * 60 * 1000;

/**
 * The lab secret (VOICE_LAB_SECRET in .env.local). The lab is closed (404)
 * without one of at least 16 characters.
 */
export function labSecret(): string | null {
  const s = process.env.VOICE_LAB_SECRET ?? "";
  return s.length >= 16 ? s : null;
}

/**
 * Minimum length of the spoken consent statement. The ~30-word statement takes
 * 8-10 s at a normal pace (~180 words a minute), so 6 s leaves room for a quick
 * reader but refuses a clip that says almost nothing.
 */
export function minConsentSeconds(): number {
  const raw = process.env.VOICE_MIN_CONSENT_SECONDS;
  const v = Number(raw);
  return raw !== undefined && raw !== "" && Number.isFinite(v) && v >= 0 ? v : 6;
}
