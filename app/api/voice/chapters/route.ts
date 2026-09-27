import { listChapters } from "@/lib/voice/chapters";
import { guarded, json } from "@/lib/voice/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/voice/chapters -> { chapters: ChapterMeta[] } */
export const GET = guarded(async () => json({ chapters: await listChapters() }));
