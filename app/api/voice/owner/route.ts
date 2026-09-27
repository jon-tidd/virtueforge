import { VoiceError } from "@/lib/voice/errors";
import { guarded, isCrossSite, json, ownerToken } from "@/lib/voice/http";
import { getVoiceStorage } from "@/lib/voice/storage";
import {
  deleteVoiceEverywhere,
  findVoiceByToken,
  readConsentChecked,
  retryPendingDeletionsSoon,
  setEnabled,
  toPublic,
} from "@/lib/voice/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The voice owner's controls. The owner token is the only credential for the
// off switch and delete, so it travels in the x-voice-owner-token header, never
// in the path: paths end up in dev-server logs, browser history and analytics.
// The owner page is /voice-lab/owner#<token> and reads location.hash.

async function owned(req: Request) {
  if (isCrossSite(req)) throw new VoiceError("bad_request", "Cross-site request refused");
  const storage = getVoiceStorage();
  // A missing, malformed or unknown token all get the same answer.
  const voice = await findVoiceByToken(storage, ownerToken(req));
  if (!voice) throw new VoiceError("voice_not_found", "This owner link isn't valid (or the voice was deleted)");
  return { storage, voice };
}

/**
 * GET /api/voice/owner  (header x-voice-owner-token) -> { voice, consent } for the owner's page.
 * consent.intact is false when consent.json no longer matches its own hash or
 * the hash voice.json holds (someone edited it).
 */
export const GET = guarded(async (req: Request) => {
  const { storage, voice } = await owned(req);
  const checked = await readConsentChecked(storage, voice);
  const consent = checked?.record;
  return json({
    voice: toPublic(voice),
    consent: consent && {
      text: consent.text,
      spokenAt: consent.spokenAt,
      receivedAt: consent.receivedAt,
      audioSha256: consent.audioSha256,
      scriptVersion: consent.scriptVersion,
      recordSha256: consent.recordSha256 ?? null,
      intact: checked.intact,
    },
  });
});

/** PATCH /api/voice/owner  (header x-voice-owner-token) JSON { enabled: boolean } -> the off switch. */
export const PATCH = guarded(async (req: Request) => {
  const { storage, voice } = await owned(req);
  const body = (await req.json().catch(() => null)) as { enabled?: unknown } | null;
  if (!body || typeof body.enabled !== "boolean") throw new VoiceError("bad_request", "enabled must be true or false");
  return json({ voice: toPublic(await setEnabled(storage, voice, body.enabled)) });
});

/** DELETE /api/voice/owner  (header x-voice-owner-token) -> removes everything; returns the (audio-free) receipt. */
export const DELETE = guarded(async (req: Request) => {
  const { storage, voice } = await owned(req);
  const receipt = await deleteVoiceEverywhere(storage, voice);
  // Any provider delete that failed is queued; try the queue again soon.
  retryPendingDeletionsSoon(storage, 0);
  return json({ receipt });
});
