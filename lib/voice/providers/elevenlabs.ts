import { VoiceProviderError, type TTSProvider } from "../types";
import { providerFailure, providerFetch, type RetryOptions } from "./fetch-util";

// ElevenLabs Instant Voice Cloning + text to speech, over the official REST API.
// Every endpoint and field below was checked against the official API
// reference on 27 Sep 2026 (URLs in docs/redesign/voice/engine-design.md):
//
//   POST   /v1/voices/add                       multipart: name, files[], remove_background_noise, description
//                                              -> { voice_id, requires_verification }
//   POST   /v1/text-to-speech/{voice_id}        ?output_format=mp3_44100_128
//                                              JSON: text, model_id, previous_text, next_text,
//                                              previous_request_ids (max 3), seed
//                                              -> audio bytes; headers request-id, character-cost
//   DELETE /v1/voices/{voice_id}                -> { status: "ok" }
//   GET    /v1/history?voice_id=&page_size=     -> { history: [{ history_item_id }], has_more, last_history_item_id }
//   DELETE /v1/history/{history_item_id}        -> { status: "ok" }
//
// Auth: "xi-api-key" header. The key is read from the environment and never
// logged or put into an error message.
//
// Request stitching (previous/next text and request ids) is not available on
// eleven_v3, so it is dropped for that model. Request ids must be under two
// hours old and the earlier audio must have been read completely. If ids are
// refused (400/404/422), the paragraph is retried once with previous_text.
//
// History: ElevenLabs keeps each generation's text (with the children's real
// names) until it is deleted. purgeHistory() runs on delete, and after every
// fully cached chapter when VOICE_PURGE_PROVIDER_HISTORY=after-chapter
// (engine.ts explains the trade-off). It lists without a cursor and deletes
// what it sees until the list is empty: a start_after cursor would point at an
// item we had just deleted.
//
// Every request goes through providerFetch (fetch-util.ts): no redirects,
// 429/503 retried with backoff (Retry-After honoured), and errors carry only
// the HTTP status, never the response body.

export const ELEVENLABS_MODELS = ["eleven_multilingual_v2", "eleven_v3", "eleven_flash_v2_5"] as const;
export type ElevenLabsModel = (typeof ELEVENLABS_MODELS)[number];

const NO_STITCHING = new Set<string>(["eleven_v3"]);
/** Per-request character limits from the models page. */
export const ELEVENLABS_CHAR_LIMITS: Record<ElevenLabsModel, number> = {
  eleven_multilingual_v2: 10_000,
  eleven_v3: 5_000,
  eleven_flash_v2_5: 40_000,
};

export interface ElevenLabsOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  outputFormat?: string;
  fetch?: typeof fetch;
  retry?: RetryOptions;
}

/** Upper bound on history list rounds in one purge (1,000 items each). */
const MAX_PURGE_ROUNDS = 50;

export function createElevenLabsProvider(opts: ElevenLabsOptions = {}): TTSProvider {
  const apiKey = () => opts.apiKey ?? process.env.ELEVENLABS_API_KEY ?? "";
  const base = (opts.baseUrl ?? process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io").replace(/\/$/, "");
  const doFetch = opts.fetch ?? fetch;
  const outputFormat = opts.outputFormat ?? "mp3_44100_128";
  const envModel = opts.defaultModel ?? process.env.ELEVENLABS_MODEL;
  const defaultModel = ELEVENLABS_MODELS.includes(envModel as ElevenLabsModel) ? (envModel as string) : "eleven_multilingual_v2";

  const call = async (path: string, init: RequestInit): Promise<Response> => {
    const key = apiKey();
    if (!key) throw new VoiceProviderError("elevenlabs", "ELEVENLABS_API_KEY is not set");
    const headers = new Headers(init.headers);
    headers.set("xi-api-key", key);
    return providerFetch("elevenlabs", doFetch, `${base}${path}`, { ...init, headers }, opts.retry);
  };

  return {
    id: "elevenlabs",
    label: "ElevenLabs (Instant Voice Clone)",
    capabilities: {
      cloning: true,
      watermark: true,
      streaming: true,
      maxCharsPerRequest: 5_000,
      stitching: true,
      needsReferenceClip: false,
    },
    defaultModel,
    models: ELEVENLABS_MODELS,
    isConfigured: () => Boolean(apiKey()),

    async createVoice(input) {
      const form = new FormData();
      form.append("name", input.name);
      if (input.description) form.append("description", input.description);
      form.append("remove_background_noise", "false");
      for (const s of input.samples) {
        const blob = new Blob([s.data as BlobPart], { type: s.contentType });
        form.append("files", blob, s.filename);
      }
      const res = await call("/v1/voices/add", { method: "POST", body: form });
      if (!res.ok) throw await providerFailure("elevenlabs", "voice create", res);
      const body = (await res.json()) as { voice_id?: string; requires_verification?: boolean };
      if (!body.voice_id) throw new VoiceProviderError("elevenlabs", "voice create returned no voice_id");
      return { providerVoiceId: body.voice_id, requiresVerification: Boolean(body.requires_verification) };
    },

    async deleteVoice(providerVoiceId) {
      const res = await call(`/v1/voices/${encodeURIComponent(providerVoiceId)}`, { method: "DELETE" });
      if (res.ok) return { deleted: true };
      if (res.status === 404) return { deleted: true, detail: "already gone" };
      throw await providerFailure("elevenlabs", "voice delete", res);
    },

    async purgeHistory(providerVoiceId) {
      let deleted = 0;
      for (let round = 0; round < MAX_PURGE_ROUNDS; round++) {
        const q = new URLSearchParams({ voice_id: providerVoiceId, page_size: "1000" });
        const res = await call(`/v1/history?${q}`, { method: "GET" });
        if (!res.ok) throw await providerFailure("elevenlabs", "history list", res);
        const body = (await res.json()) as { history?: Array<{ history_item_id: string }>; has_more?: boolean };
        const items = body.history ?? [];
        if (items.length === 0) return { deleted };
        for (const item of items) {
          const del = await call(`/v1/history/${encodeURIComponent(item.history_item_id)}`, { method: "DELETE" });
          // 404: already gone, which is what we want.
          if (del.ok || del.status === 404) {
            deleted++;
            await del.body?.cancel().catch(() => undefined);
          } else throw await providerFailure("elevenlabs", "history delete", del);
        }
        if (!body.has_more) return { deleted };
      }
      throw new VoiceProviderError("elevenlabs", `history purge stopped after ${MAX_PURGE_ROUNDS} rounds`);
    },

    async synthesize(req) {
      const model = req.model || defaultModel;
      if (!ELEVENLABS_MODELS.includes(model as ElevenLabsModel)) {
        throw new VoiceProviderError("elevenlabs", `model not allowed: ${model}`);
      }
      const limit = ELEVENLABS_CHAR_LIMITS[model as ElevenLabsModel];
      if (req.text.length > limit) {
        throw new VoiceProviderError("elevenlabs", `paragraph is ${req.text.length} characters; ${model} takes ${limit}`);
      }
      const body: Record<string, unknown> = { text: req.text, model_id: model };
      if (!NO_STITCHING.has(model) && req.context) {
        const ids = (req.context.previousRequestIds ?? []).filter(Boolean).slice(-3);
        if (ids.length) body.previous_request_ids = ids;
        else if (req.context.previousText) body.previous_text = req.context.previousText;
        if (req.context.nextText) body.next_text = req.context.nextText;
      }
      if (typeof req.seed === "number") body.seed = req.seed;

      const started = Date.now();
      const post = (b: Record<string, unknown>) =>
        call(`/v1/text-to-speech/${encodeURIComponent(req.providerVoiceId)}?output_format=${encodeURIComponent(outputFormat)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify(b),
        });
      let res = await post(body);
      // Stitching ids can go stale (older than 2 h, or their history item was
      // purged: the docs don't say whether that breaks them). Rather than fail
      // the paragraph, retry once with the neighbouring text instead.
      if (!res.ok && body.previous_request_ids && [400, 404, 422].includes(res.status)) {
        await res.body?.cancel().catch(() => undefined);
        const { previous_request_ids: _ids, ...rest } = body;
        void _ids;
        if (req.context?.previousText) rest.previous_text = req.context.previousText;
        res = await post(rest);
      }
      if (!res.ok) throw await providerFailure("elevenlabs", "synthesis", res);
      const audio = new Uint8Array(await res.arrayBuffer());
      const billed = Number(res.headers.get("character-cost"));
      return {
        audio,
        contentType: outputFormat.startsWith("mp3") ? "audio/mpeg" : res.headers.get("content-type") || "application/octet-stream",
        ext: outputFormat.startsWith("mp3") ? "mp3" : outputFormat.startsWith("pcm") ? "pcm" : "bin",
        model,
        charactersBilled: Number.isFinite(billed) && billed > 0 ? billed : req.text.length,
        latencyMs: Date.now() - started,
        // A Sep 2026 ElevenLabs blog post says every generation carries a SynthID
        // watermark; the API docs don't confirm it for paid cloned voices.
        watermark: "provider-claimed",
        requestId: res.headers.get("request-id") ?? undefined,
        requests: 1,
      };
    },
  };
}
