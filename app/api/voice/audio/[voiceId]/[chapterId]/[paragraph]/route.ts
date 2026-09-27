import { getParagraphAudio } from "@/lib/voice/engine";
import { VoiceError } from "@/lib/voice/errors";
import { audioResponse, guarded, isPlayerFetch } from "@/lib/voice/http";
import { isProviderId } from "@/lib/voice/registry";
import { getVoiceStorage } from "@/lib/voice/storage";
import { spendLimitResponse } from "@/app/api/voice/_lib/spend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ voiceId: string; chapterId: string; paragraph: string }> };

/**
 * GET /api/voice/audio/:voiceId/:chapterId/:paragraph?provider=&model=
 * One paragraph of chapter text in a family voice. Generated on first request,
 * cached after. There is deliberately no way to pass text: only a chapter id
 * and a paragraph index. Other query parameters are ignored.
 * A cache miss that would take today's spend over VOICE_MAX_USD_PER_DAY is
 * refused with 429 spend_limit; cached paragraphs always play.
 * Served only to the lab player's fetch() (x-voice-player: 1, Sec-Fetch-Dest
 * empty): never to a navigation, which would open the browser's media viewer
 * with its Save control (see isPlayerFetch).
 */
export const GET = guarded<Ctx>(async (req, { params }) => {
  if (!isPlayerFetch(req)) return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  const { voiceId, chapterId, paragraph } = await params;
  if (!/^\d{1,4}$/.test(paragraph)) throw new VoiceError("paragraph_not_found", "No such paragraph");
  const url = new URL(req.url);
  const p = url.searchParams.get("provider");
  if (p !== null && !isProviderId(p)) throw new VoiceError("bad_request", "Unknown provider");
  const model = url.searchParams.get("model") ?? undefined;

  const request = { voiceId, chapterId, paragraph: Number(paragraph), provider: p ?? undefined, model };
  const storage = getVoiceStorage();
  const refused = await spendLimitResponse(request, storage);
  if (refused) return refused;

  const out = await getParagraphAudio(request, { storage });
  const m = out.meta;
  return audioResponse(req, out.audio, m.contentType, {
    "X-Voice-Cache": out.cache,
    "X-Voice-Provider": m.provider,
    "X-Voice-Model": m.model,
    "X-Voice-Characters": String(m.characters),
    "X-Voice-Latency-Ms": String(m.latencyMs),
    "X-Voice-Est-Cost-Usd": String(m.estCostUsd),
    "X-Voice-Watermark": m.watermark,
  });
});
