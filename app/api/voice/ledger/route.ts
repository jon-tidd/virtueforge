import { guarded, json } from "@/lib/voice/http";
import { readLedger, summarizeLedger } from "@/lib/voice/ledger";
import { getVoiceStorage } from "@/lib/voice/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/voice/ledger?chapterId=&voiceId= -> spend per provider/model (no audio, no text). */
export const GET = guarded(async (req: Request) => {
  const url = new URL(req.url);
  const chapterId = url.searchParams.get("chapterId") ?? undefined;
  const voiceId = url.searchParams.get("voiceId") ?? undefined;
  const entries = await readLedger(getVoiceStorage());
  return json({ rows: summarizeLedger(entries, { chapterId, voiceId }) });
});
