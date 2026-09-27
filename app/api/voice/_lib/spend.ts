import { cacheAudioKey, cacheKey, cacheMetaKey } from "@/lib/voice/cache";
import { loadPersonalizedChapter, type ParagraphRequest } from "@/lib/voice/engine";
import { json } from "@/lib/voice/http";
import { estimateCostUsd, readLedger } from "@/lib/voice/ledger";
import { getProvider } from "@/lib/voice/registry";
import type { VoiceStorage } from "@/lib/voice/storage";
import type { CacheMeta, LedgerEntry, ProviderId } from "@/lib/voice/types";
import { getVoice } from "@/lib/voice/voices";

// Daily spend guard for the voice lab (engine-design.md section 11).
//
// Before a request that would reach a paid provider (a cache miss), sum
// today's ledger and refuse with 429 spend_limit if this paragraph would take
// the day over VOICE_MAX_USD_PER_DAY (default $5). Cache hits are never
// refused: they cost nothing. Requests that would fail before any provider
// call (unknown voice, switched off, not bound, bad model, unknown chapter or
// paragraph, provider without keys) are left to the engine, which answers
// with its usual error.
//
// "Today" is the server's local calendar day. Two misses racing at the limit
// can both pass; this is a guard against runaway spend, not an exact budget.

export const SPEND_LIMIT_ENV = "VOICE_MAX_USD_PER_DAY";
export const DEFAULT_MAX_USD_PER_DAY = 5;

type Env = Record<string, string | undefined>;

/** VOICE_MAX_USD_PER_DAY as a number of dollars. Unset, empty, negative or unparsable -> the default. 0 allows only free providers. */
export function maxUsdPerDay(env: Env = process.env): number {
  const raw = env[SPEND_LIMIT_ENV];
  if (raw === undefined || raw.trim() === "") return DEFAULT_MAX_USD_PER_DAY;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MAX_USD_PER_DAY;
}

function dayBounds(now: Date): { start: number; end: number } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

/** Estimated dollars spent on generations with a timestamp in today's local calendar day. */
export function spentToday(entries: LedgerEntry[], now: Date = new Date()): number {
  const { start, end } = dayBounds(now);
  let total = 0;
  for (const e of entries) {
    const t = Date.parse(e.ts);
    if (Number.isFinite(t) && t >= start && t < end && Number.isFinite(e.estCostUsd)) total += e.estCostUsd;
  }
  return Math.round(total * 1e6) / 1e6;
}

interface PendingGeneration {
  provider: ProviderId;
  model: string;
  characters: number;
}

/**
 * What this request would generate, or null when it would be served from the
 * cache or would fail before any provider call. Mirrors the engine's own
 * checks and cache key; any error here means "let the engine decide".
 */
async function pendingGeneration(req: ParagraphRequest, storage: VoiceStorage): Promise<PendingGeneration | null> {
  try {
    const voice = await getVoice(storage, req.voiceId);
    if (!voice || !voice.enabled || voice.deleting) return null;
    const binding = req.provider ? voice.bindings.find((b) => b.provider === req.provider) : voice.bindings[0];
    if (!binding) return null;
    const provider = getProvider(binding.provider);
    const model = req.model || provider.defaultModel;
    if (!provider.models.includes(model) || !provider.isConfigured()) return null;
    const chapter = await loadPersonalizedChapter(req.chapterId, {});
    const i = req.paragraph;
    if (!Number.isInteger(i) || i < 0 || i >= chapter.paragraphs.length) return null;
    const text = chapter.paragraphs[i];
    const key = cacheKey({
      voiceId: voice.id,
      provider: binding.provider,
      model,
      providerVoiceId: binding.providerVoiceId,
      chapterHash: chapter.contentHash,
      paragraph: i,
      text,
    });
    const meta = await storage.readJson<CacheMeta>(cacheMetaKey(voice.id, key));
    if (meta && (await storage.exists(cacheAudioKey(voice.id, key, meta.ext)))) return null;
    return { provider: binding.provider, model, characters: text.length };
  } catch {
    return null;
  }
}

/** Returns a 429 response when this request would take today's spend over the limit, else null. */
export async function spendLimitResponse(
  req: ParagraphRequest,
  storage: VoiceStorage,
  now: Date = new Date(),
): Promise<Response | null> {
  const pending = await pendingGeneration(req, storage);
  if (!pending) return null;
  const limit = maxUsdPerDay();
  const spent = spentToday(await readLedger(storage), now);
  const next = estimateCostUsd(pending.provider, pending.model, pending.characters);
  if (spent + next <= limit + 1e-9) return null;
  const retryAfter = Math.max(1, Math.ceil((dayBounds(now).end - now.getTime()) / 1000));
  return json(
    {
      error: "spend_limit",
      message: `Today's voice spend limit ($${limit.toFixed(2)}) would be exceeded. Already cached paragraphs still play. Raise ${SPEND_LIMIT_ENV} in .env.local, or try again tomorrow.`,
      spentTodayUsd: spent,
      limitUsd: limit,
    },
    429,
    { "Retry-After": String(retryAfter) },
  );
}
