import { loadPersonalizedChapter } from "@/lib/voice/engine";
import { guarded, json } from "@/lib/voice/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ chapterId: string }> };

/**
 * GET /api/voice/chapters/:chapterId
 * The reading manifest: paragraphs (personalized) and the Pause & ask stop.
 */
export const GET = guarded<Ctx>(async (_req, { params }) => {
  const { chapterId } = await params;
  const ch = await loadPersonalizedChapter(chapterId, {});
  return json({
    meta: ch.meta,
    source: ch.source,
    contentHash: ch.contentHash,
    items: ch.items,
    paragraphCount: ch.paragraphs.length,
    characters: ch.paragraphs.reduce((n, p) => n + p.length, 0),
    lastPage: ch.lastPage,
  });
});
