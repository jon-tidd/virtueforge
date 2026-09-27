import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { CONSENT_SCRIPT_VERSION, buildConsentStatement } from "../consent-text";
import { GUIDED_PASSAGES } from "../guided-reading";
import { childrenPhrase, EMPTY_FAMILY, type Family } from "../personalize";
import { LocalVoiceStorage } from "../storage";
import { toneWav } from "../wav";
import type { NewVoiceInput } from "../voices";

export function tempStorage() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "gg-voice-test-"));
  return { dir, storage: new LocalVoiceStorage(dir), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/**
 * A valid creation request: 8 s of "consent" read a minute ago (the server
 * accepts spokenAt only within 30 min of its own clock) and six 12 s
 * "samples" (72 s total).
 */
export function newVoiceInput(overrides: Partial<NewVoiceInput> = {}, family: Family = EMPTY_FAMILY): NewVoiceInput {
  const ownerName = overrides.ownerName ?? "Jon Tester";
  return {
    ownerName,
    relationship: "Parent",
    attestAdult: true,
    attestOwnVoice: true,
    attestNoChildVoice: true,
    consent: {
      text: buildConsentStatement(ownerName, childrenPhrase(family)),
      scriptVersion: CONSENT_SCRIPT_VERSION,
      spokenAt: new Date(Date.now() - 60_000).toISOString(),
      audio: toneWav(8, 16000, 200),
    },
    samples: GUIDED_PASSAGES.map((p, i) => ({ passageId: p.id, audio: toneWav(12, 16000, 180 + i * 10) })),
    userAgent: "vitest",
    ...overrides,
  };
}
