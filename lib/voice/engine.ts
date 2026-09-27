import { cacheAudioKey, cacheKey, cacheMetaKey } from "./cache";
import { ChapterNotFoundError, loadChapter, type Chapter } from "./chapters";
import { VoiceError } from "./errors";
import { appendLedger, estimateCostUsd } from "./ledger";
import { loadFamily, personalize, type Family } from "./personalize";
import { getProvider } from "./registry";
import type { VoiceStorage } from "./storage";
import { getVoice, providerErrorToVoiceError } from "./voices";
import type { CacheMeta, ProviderId, VoiceRecord } from "./types";

// The only way audio gets made. It takes a chapter id and a paragraph index,
// never text: the words always come from our chapter files (rule: "reads ONLY
// our chapter text"). Each paragraph is generated once per voice, provider,
// model and chapter version, then served from the cache.

export interface ParagraphRequest {
  voiceId: string;
  chapterId: string;
  paragraph: number;
  provider?: ProviderId;
  model?: string;
}

export interface ParagraphAudio {
  audio: Uint8Array;
  meta: CacheMeta;
  cache: "hit" | "miss";
}

export interface EngineDeps {
  storage: VoiceStorage;
  /** Defaults to reading VOICE_FAMILY_FILE. */
  family?: Family;
  /** Defaults to loadChapter (STORY_CONTENT_DIR, then the fixture). */
  loadChapter?: (id: string) => Promise<Chapter>;
}

/** Request ids older than this can't be used for stitching (ElevenLabs docs). */
const STITCH_MAX_AGE_MS = 2 * 60 * 60 * 1000;

const inflight = new Map<string, Promise<ParagraphAudio>>();

// ---------------------------------------------------------------------------
// Provider history purge (opt-in)
// ---------------------------------------------------------------------------
//
// ElevenLabs keeps every generation in its history, with the full text (and so
// the children's real names), until the voice is deleted or the items are.
// VOICE_PURGE_PROVIDER_HISTORY=after-chapter purges the voice's provider
// history as soon as a whole chapter is cached for it.
//
// Trade-off (checked 27 Sep 2026): the request-stitching guide only says
// request ids must be under two hours old; it does not say whether a request
// id still works once its history item is deleted. So we purge only when a
// chapter is complete, when no later paragraph of that chapter needs those
// ids. The purge covers the whole voice, so a chapter being generated at the
// same moment could lose its stitching ids; the ElevenLabs adapter then
// retries that paragraph once with previous_text instead (slightly less
// seamless joins, never a failure). Off by default: history is also what
// ElevenLabs support would use to investigate a bad generation.

export const PURGE_HISTORY_ENV = "VOICE_PURGE_PROVIDER_HISTORY";
const pendingPurges = new Map<string, Promise<void>>();

function purgeAfterChapterEnabled(): boolean {
  return process.env[PURGE_HISTORY_ENV] === "after-chapter";
}

/** For tests and shutdown: resolves once every scheduled history purge has finished. */
export async function waitForHistoryPurges(): Promise<void> {
  await Promise.all([...pendingPurges.values()]);
}

/** A chapter with the family's real names swapped in. */
export async function loadPersonalizedChapter(chapterId: string, deps: Omit<EngineDeps, "storage">): Promise<Chapter> {
  let chapter: Chapter;
  try {
    chapter = await (deps.loadChapter ?? loadChapter)(chapterId);
  } catch (e) {
    if (e instanceof ChapterNotFoundError) throw new VoiceError("chapter_not_found", "No such chapter");
    throw e;
  }
  const family = deps.family ?? (await loadFamily());
  const paragraphs = chapter.paragraphs.map((p) => personalize(p, family));
  return {
    ...chapter,
    paragraphs,
    items: chapter.items.map((it) =>
      it.type === "paragraph"
        ? { ...it, text: paragraphs[it.index] }
        : { ...it, question: personalize(it.question, family), answersFirst: it.answersFirst && personalize(it.answersFirst, family) },
    ),
    pause: chapter.pause && { ...chapter.pause, question: personalize(chapter.pause.question, family) },
    lastPage: personalize(chapter.lastPage, family),
    meta: { ...chapter.meta, lead: personalize(chapter.meta.lead, family) },
  };
}

function pickBinding(voice: VoiceRecord, provider?: ProviderId) {
  const b = provider ? voice.bindings.find((x) => x.provider === provider) : voice.bindings[0];
  if (!b) {
    throw new VoiceError(
      "not_bound",
      provider ? `This voice hasn't been made with ${provider} yet` : "This voice hasn't been made with any provider yet",
    );
  }
  return b;
}

async function assertPlayable(storage: VoiceStorage, voiceId: string): Promise<VoiceRecord> {
  const voice = await getVoice(storage, voiceId);
  // A tombstoned voice (delete in progress) is already gone as far as playback goes.
  if (!voice || voice.deleting) throw new VoiceError("voice_not_found", "No such voice");
  if (!voice.enabled) throw new VoiceError("voice_off", "This voice is switched off by its owner");
  return voice;
}

async function readCached(storage: VoiceStorage, voiceId: string, key: string): Promise<ParagraphAudio | null> {
  const meta = await storage.readJson<CacheMeta>(cacheMetaKey(voiceId, key));
  if (!meta) return null;
  const audio = await storage.read(cacheAudioKey(voiceId, key, meta.ext));
  return audio ? { audio, meta, cache: "hit" } : null;
}

export async function getParagraphAudio(req: ParagraphRequest, deps: EngineDeps): Promise<ParagraphAudio> {
  const { storage } = deps;
  const voice = await assertPlayable(storage, req.voiceId);
  const binding = pickBinding(voice, req.provider);
  const provider = getProvider(binding.provider);
  const model = req.model || provider.defaultModel;
  if (!provider.models.includes(model)) throw new VoiceError("model_not_allowed", `Model not allowed: ${model}`);

  const chapter = await loadPersonalizedChapter(req.chapterId, deps);
  const i = req.paragraph;
  if (!Number.isInteger(i) || i < 0 || i >= chapter.paragraphs.length) {
    throw new VoiceError("paragraph_not_found", "No such paragraph");
  }
  const text = chapter.paragraphs[i];
  const keyFor = (idx: number) =>
    cacheKey({
      voiceId: voice.id,
      provider: binding.provider,
      model,
      providerVoiceId: binding.providerVoiceId,
      chapterHash: chapter.contentHash,
      paragraph: idx,
      text: chapter.paragraphs[idx],
    });
  const key = keyFor(i);

  // Check and register the job with no await in between, so concurrent
  // requests for one paragraph always share a single job. The cache read
  // happens inside the job: a request that would have read "not cached" just
  // before another job wrote it still gets the hit instead of paying twice.
  const running = inflight.get(key);
  if (running) return running;

  const job = (async (): Promise<ParagraphAudio> => {
    const hit = await readCached(storage, voice.id, key);
    if (hit) return hit;

    if (!provider.isConfigured()) throw new VoiceError("provider_not_configured", `${provider.label} is not configured`);

    // Stitching context: neighbouring text, plus request ids of the paragraphs
    // just before this one if they were generated in the last two hours.
    const previousRequestIds: string[] = [];
    if (provider.capabilities.stitching) {
      for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
        const m = await storage.readJson<CacheMeta>(cacheMetaKey(voice.id, keyFor(j)));
        if (!m?.requestId || Date.now() - Date.parse(m.createdAt) > STITCH_MAX_AGE_MS) break;
        previousRequestIds.unshift(m.requestId);
      }
    }
    const referenceClip = provider.capabilities.needsReferenceClip
      ? await storage.read(`voices/${voice.id}/reference.wav`)
      : null;
    if (provider.capabilities.needsReferenceClip && !referenceClip) {
      throw new VoiceError("bad_audio", "The reference clip for this voice is missing");
    }

    let result;
    try {
      result = await provider.synthesize({
        providerVoiceId: binding.providerVoiceId,
        text,
        model,
        context: provider.capabilities.stitching
          ? {
              previousText: chapter.paragraphs[i - 1],
              nextText: chapter.paragraphs[i + 1],
              previousRequestIds,
            }
          : undefined,
        referenceClip: referenceClip ? { filename: "reference.wav", contentType: "audio/wav", data: referenceClip } : undefined,
      });
    } catch (e) {
      // Provider id and HTTP status only; an exhausted 429 becomes rate_limited.
      throw providerErrorToVoiceError(e, provider.id, "synthesis failed");
    }

    const meta: CacheMeta = {
      key,
      voiceId: voice.id,
      provider: binding.provider,
      model: result.model,
      providerVoiceId: binding.providerVoiceId,
      chapterId: chapter.meta.id,
      chapterHash: chapter.contentHash,
      paragraph: i,
      characters: result.charactersBilled,
      latencyMs: result.latencyMs,
      estCostUsd: estimateCostUsd(binding.provider, result.model, result.charactersBilled),
      contentType: result.contentType,
      ext: result.ext,
      watermark: result.watermark,
      requestId: result.requestId,
      createdAt: new Date().toISOString(),
    };

    // Always record the spend, even if the voice was switched off or deleted
    // while we waited: we were billed either way.
    await appendLedger(storage, {
      ts: meta.createdAt,
      provider: meta.provider,
      model: meta.model,
      voiceId: meta.voiceId,
      chapterId: meta.chapterId,
      paragraph: i,
      characters: meta.characters,
      latencyMs: meta.latencyMs,
      estCostUsd: meta.estCostUsd,
      requests: result.requests,
      watermark: meta.watermark,
    });

    // Don't cache (or return) audio for a voice deleted or switched off mid-generation.
    await assertPlayable(storage, voice.id);
    // Meta first, then audio, both under cache/<voiceId>/. Then look again: a
    // delete (or the off switch) that started while we were writing may have
    // swept the cache before our files landed. Its tombstone is written before
    // its sweep, so whichever order things happen in, nothing of a deleted
    // voice stays in the cache.
    const metaKey = cacheMetaKey(voice.id, key);
    const audioKey = cacheAudioKey(voice.id, key, meta.ext);
    await storage.writeJson(metaKey, meta);
    await storage.write(audioKey, result.audio);
    const after = await getVoice(storage, voice.id);
    if (!after || after.deleting || !after.enabled) {
      await storage.delete(audioKey).catch(() => false);
      await storage.delete(metaKey).catch(() => false);
      if (after && !after.deleting) throw new VoiceError("voice_off", "This voice is switched off by its owner");
      throw new VoiceError("voice_not_found", "No such voice");
    }

    if (purgeAfterChapterEnabled() && provider.purgeHistory) {
      let complete = true;
      for (let j = 0; j < chapter.paragraphs.length && complete; j++) {
        if (j !== i && !(await storage.exists(cacheMetaKey(voice.id, keyFor(j))))) complete = false;
      }
      const purgeKey = `${binding.provider}|${binding.providerVoiceId}`;
      if (complete && !pendingPurges.has(purgeKey)) {
        // In the background: the listener shouldn't wait for dozens of deletes.
        const purge = provider
          .purgeHistory(binding.providerVoiceId)
          .then(
            (r) => console.info(`[voice] purged ${r.deleted} provider history item(s) after ${chapter.meta.id}`),
            (e) => console.error("[voice] provider history purge failed:", e instanceof Error ? e.name : typeof e),
          )
          .finally(() => pendingPurges.delete(purgeKey));
        pendingPurges.set(purgeKey, purge);
      }
    }
    return { audio: result.audio, meta, cache: "miss" };
  })();

  inflight.set(key, job);
  const done = () => {
    if (inflight.get(key) === job) inflight.delete(key);
  };
  job.then(done, done);
  return job;
}
