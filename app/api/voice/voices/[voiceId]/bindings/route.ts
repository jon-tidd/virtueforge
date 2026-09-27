import { VoiceError } from "@/lib/voice/errors";
import { guarded, isCrossSite, json, ownerToken } from "@/lib/voice/http";
import { isProviderId } from "@/lib/voice/registry";
import { getVoiceStorage } from "@/lib/voice/storage";
import { addBinding, requireOwner } from "@/lib/voice/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ voiceId: string }> };

/**
 * POST /api/voice/voices/:voiceId/bindings
 *   header x-voice-owner-token; JSON { provider }
 * -> 201 { binding }   Makes the provider voice from the stored samples.
 */
export const POST = guarded<Ctx>(async (req, { params }) => {
  if (isCrossSite(req)) throw new VoiceError("bad_request", "Cross-site request refused");
  const { voiceId } = await params;
  const body = (await req.json().catch(() => null)) as { provider?: unknown } | null;
  if (!body || !isProviderId(body.provider)) throw new VoiceError("bad_request", "provider is required");
  const storage = getVoiceStorage();
  const voice = await requireOwner(storage, voiceId, ownerToken(req));
  const binding = await addBinding(storage, voice, body.provider);
  return json({ binding }, 201);
});
