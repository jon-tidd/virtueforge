#!/usr/bin/env node
// Family story voice: retry provider deletes that failed during "delete everything".
//
//   npm run voice:purge-pending
//
// When a provider delete (voice or history) fails, deleteVoiceEverywhere
// queues it in VOICE_DATA_DIR/pending-deletions/<voiceId>.json before local
// data is wiped. The lab retries that queue on its own (whenever /voice-lab
// opens, at most every 10 minutes, and right after a delete); this runs the
// same retry now and prints only counts. Keys come from .env.local via
// process.env and are never printed. Refuses unless the voice engine flag is on.

import { createJiti } from "jiti";

if (process.env.VOICE_ENGINE_ENABLED !== "true" || process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  process.stderr.write("voice-purge-pending: the voice engine flag is off (VOICE_ENGINE_ENABLED=true in .env.local, never production).\n");
  process.exit(1);
}

const jiti = createJiti(import.meta.url);
const { getVoiceStorage } = await jiti.import("../lib/voice/storage.ts");
const { retryPendingDeletions } = await jiti.import("../lib/voice/voices.ts");

try {
  const r = await retryPendingDeletions(getVoiceStorage());
  process.stdout.write(
    r.voices === 0
      ? "No pending provider deletions.\n"
      : `Voices with pending deletes: ${r.voices}. Confirmed now: ${r.confirmed}. Still pending: ${r.stillPending}.\n`,
  );
  process.exit(r.stillPending ? 2 : 0);
} catch (e) {
  process.stderr.write(`voice-purge-pending: failed (${e instanceof Error ? e.name : typeof e}).\n`);
  process.exit(1);
}
