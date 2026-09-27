import { VoiceError } from "@/lib/voice/errors";
import { guarded, json } from "@/lib/voice/http";
import { getVoiceStorage } from "@/lib/voice/storage";
import { getVoice, toPublic } from "@/lib/voice/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ voiceId: string }> };

/** GET /api/voice/voices/:voiceId -> { voice: PublicVoice } */
export const GET = guarded<Ctx>(async (_req, { params }) => {
  const { voiceId } = await params;
  const v = await getVoice(getVoiceStorage(), voiceId);
  // A voice being deleted is already gone as far as listeners are concerned.
  if (!v || v.deleting) throw new VoiceError("voice_not_found", "No such voice");
  return json({ voice: toPublic(v) });
});
