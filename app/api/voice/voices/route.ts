import { VoiceError } from "@/lib/voice/errors";
import { GUIDED_PASSAGES } from "@/lib/voice/guided-reading";
import { guarded, isCrossSite, json, readCappedBody } from "@/lib/voice/http";
import { loadFamily } from "@/lib/voice/personalize";
import { getVoiceStorage } from "@/lib/voice/storage";
import { createVoiceRecord, listVoices, toPublic } from "@/lib/voice/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 6 samples (25 MB each at most) plus the consent clip (10 MB) fit well under this. */
const MAX_CREATE_BYTES = 200 * 1024 * 1024;

/** GET /api/voice/voices -> { voices: PublicVoice[] } (no owner tokens). */
export const GET = guarded(async () => json({ voices: (await listVoices(getVoiceStorage())).map(toPublic) }));

async function fileBytes(v: FormDataEntryValue | null, what: string): Promise<Uint8Array> {
  if (!v || typeof v === "string") throw new VoiceError("bad_audio", `${what} is missing`);
  return new Uint8Array(await v.arrayBuffer());
}

/**
 * POST /api/voice/voices  (multipart/form-data)
 *   ownerName, relationship,
 *   attestAdult=true, attestOwnVoice=true, attestNoChildVoice=true,
 *   consentText, consentScriptVersion, consentSpokenAt (ISO), consentAudio (WAV),
 *   sample:<passageId> (WAV), one per guided passage
 * -> 201 { voice, ownerToken, ownerPath }  (ownerPath = /voice-lab/owner#<token>: the
 *    token rides in the fragment, which never reaches server logs)
 * Stores the recording and consent only. Provider voices are made by
 * POST /api/voice/voices/:voiceId/bindings.
 */
export const POST = guarded(async (req: Request) => {
  if (isCrossSite(req)) throw new VoiceError("bad_request", "Cross-site request refused");
  // Refuse oversized uploads before buffering them (Content-Length, then a running count).
  const body = await readCappedBody(req, MAX_CREATE_BYTES);
  let form: FormData;
  try {
    form = await new Response(body as BodyInit, { headers: { "content-type": req.headers.get("content-type") ?? "" } }).formData();
  } catch {
    throw new VoiceError("bad_request", "Expected multipart/form-data");
  }
  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : "";
  };
  const samples: Array<{ passageId: string; audio: Uint8Array }> = [];
  for (const [k, v] of form.entries()) {
    if (!k.startsWith("sample:")) continue;
    if (samples.length >= GUIDED_PASSAGES.length) throw new VoiceError("bad_request", "Too many samples");
    samples.push({ passageId: k.slice("sample:".length), audio: await fileBytes(v, k) });
  }
  const storage = getVoiceStorage();
  const { voice, ownerToken } = await createVoiceRecord(
    {
      ownerName: str("ownerName"),
      relationship: str("relationship"),
      attestAdult: str("attestAdult") === "true",
      attestOwnVoice: str("attestOwnVoice") === "true",
      attestNoChildVoice: str("attestNoChildVoice") === "true",
      consent: {
        text: str("consentText"),
        scriptVersion: str("consentScriptVersion"),
        spokenAt: str("consentSpokenAt"),
        audio: await fileBytes(form.get("consentAudio"), "consentAudio"),
      },
      samples,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
    storage,
    await loadFamily(),
  );
  return json({ voice: toPublic(voice), ownerToken, ownerPath: `/voice-lab/owner#${ownerToken}` }, 201);
});
