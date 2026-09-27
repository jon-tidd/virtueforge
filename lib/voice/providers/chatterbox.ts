import { createHash } from "node:crypto";
import { chunkText, CHATTERBOX_CHUNKS } from "../chunking";
import { concatWav, decodeWav } from "../wav";
import { providerFailure, providerFetch, type RetryOptions } from "./fetch-util";
import {
  VoiceProviderError,
  type AudioSample,
  type ProviderCapabilities,
  type SynthesisRequest,
  type SynthesisResult,
  type TTSProvider,
  type WatermarkKind,
} from "../types";

// Chatterbox (Resemble AI, MIT) is zero-shot: there is no voice to create at
// the provider. The "voice" is our reference clip (the cleanest ~12 s of the
// guided reading), sent with every request. Its code reads only the first
// ~10 s, and long input garbles, so each paragraph is split into sentence
// groups of about 250–350 characters and the WAV pieces are joined with a
// short gap.
//
// Two adapters share that logic:
//
// 1. chatterbox-fal: hosted on fal.ai (the research doc's first hosted pick).
//    Checked against fal's official docs on 27 Sep 2026:
//      POST https://fal.run/{model}             Authorization: Key $FAL_KEY
//           JSON { text (<= 5000 chars), audio_url, exaggeration, temperature, cfg, seed }
//           -> { audio: { url } }  (a .wav on fal's CDN)
//      POST https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3
//           JSON { file_name, content_type } -> { upload_url, file_url }; then PUT the bytes
//      Headers we send:
//        on fal.run calls:   X-Fal-Store-IO: 0 (don't keep request payloads) and
//                            X-Fal-Object-Lifecycle-Preference: {"expiration_duration_seconds": 3600}
//                            (generated audio expires after an hour);
//        on upload/initiate: X-Fal-Object-Lifecycle: {"expiration_duration_seconds": 3600}
//                            (the header fal's own client, fal-js libs/client/src/storage.ts,
//                            sends on uploads; the -Preference header does not apply there).
//      PRIVACY: an uploaded reference clip is ~12 s of the owner's voice at an
//      unauthenticated fal CDN URL. Anyone holding that URL can fetch it until it
//      expires (1 h). The URL never leaves the server (it is not logged, stored
//      on disk or returned to the browser), but it is still publicly addressable
//      for its lifetime. fal has no documented call to delete an uploaded file,
//      so deleteVoice() forgets the URL and reports `deleted: false` with the
//      time the last copy expires; the receipt shows that time instead of
//      "voice deleted". The self-hosted adapter below avoids this entirely.
//      Every URL fal hands back (upload_url, file_url, audio.url) must be https
//      on a fal host (FAL_HOST_SUFFIXES), and no fetch follows redirects.
//
// 2. chatterbox-http: our own server (scripts/chatterbox_server.py) at CHATTERBOX_URL.
//      POST {CHATTERBOX_URL}/tts   multipart: text (<= 350), model, reference (WAV),
//           exaggeration, cfg_weight, temperature, seed   -> audio/wav, plus
//           X-Watermark: perth only when the server re-detected PerTh on its output
//      "Authorization: Bearer $CHATTERBOX_TOKEN" (the server refuses requests without it).
//    The server is stateless: it keeps no reference clips and no audio.
//    CHATTERBOX_URL must be https, or plain http only to this machine
//    (127.0.0.1, ::1, localhost): otherwise the adapter reports itself as not
//    configured, so the token and the reference clip never cross a network in
//    cleartext.

const CAPABILITIES: ProviderCapabilities = {
  cloning: true,
  watermark: true,
  streaming: false,
  maxCharsPerRequest: CHATTERBOX_CHUNKS.max,
  stitching: false,
  needsReferenceClip: true,
};

/** Same reference + fixed seed for every chunk keeps a chapter consistent (research Q24). */
export const CHATTERBOX_SEED = 1234;

export const FAL_MODELS = ["fal-ai/chatterbox/text-to-speech", "resemble-ai/chatterboxhd/text-to-speech"] as const;

function refHash(clip: AudioSample): string {
  return createHash("sha256").update(clip.data).digest("hex");
}

async function synthesizeChunks(
  provider: "chatterbox-fal" | "chatterbox-http",
  req: SynthesisRequest,
  one: (text: string) => Promise<{ wav: Uint8Array; watermark?: WatermarkKind }>,
  defaultWatermark: WatermarkKind,
): Promise<SynthesisResult> {
  if (!req.referenceClip) throw new VoiceProviderError(provider, "reference clip missing");
  const chunks = chunkText(req.text, CHATTERBOX_CHUNKS);
  if (chunks.length === 0) throw new VoiceProviderError(provider, "empty paragraph");
  const started = Date.now();
  const pieces: Uint8Array[] = [];
  let watermark = defaultWatermark;
  for (const chunk of chunks) {
    const out = await one(chunk);
    if (out.watermark) watermark = out.watermark;
    pieces.push(out.wav);
  }
  let audio: Uint8Array;
  if (pieces.length === 1) audio = pieces[0];
  else {
    if (pieces.some((p) => !decodeWav(p))) {
      throw new VoiceProviderError(provider, "provider returned non-WAV audio; cannot join chunks");
    }
    audio = concatWav(pieces, 120);
  }
  return {
    audio,
    contentType: "audio/wav",
    ext: "wav",
    model: req.model,
    charactersBilled: chunks.reduce((n, c) => n + c.length, 0),
    latencyMs: Date.now() - started,
    watermark,
    requests: chunks.length,
  };
}

// ---------------------------------------------------------------------------
// fal.ai
// ---------------------------------------------------------------------------

/** fal-owned hosts. Anything else in a fal response is refused (no SSRF, no leaking the clip). */
export const FAL_HOST_SUFFIXES = ["fal.media", "fal.ai", "fal.run"] as const;

export function isFalUrl(u: unknown): u is string {
  if (typeof u !== "string") return false;
  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return FAL_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
}

function requireFalUrl(u: unknown, what: string): string {
  // The URL itself stays out of the message: it may point at the owner's voice.
  if (!isFalUrl(u)) throw new VoiceProviderError("chatterbox-fal", `${what} is not an https fal URL; refused`);
  return u;
}

export interface FalOptions {
  apiKey?: string;
  runBase?: string;
  restBase?: string;
  defaultModel?: string;
  fetch?: typeof fetch;
  /** How long fal keeps uploaded clips and outputs. */
  expirySeconds?: number;
  retry?: RetryOptions;
  now?: () => number;
}

export function createChatterboxFalProvider(opts: FalOptions = {}): TTSProvider {
  const apiKey = () => opts.apiKey ?? process.env.FAL_KEY ?? "";
  const runBase = (opts.runBase ?? "https://fal.run").replace(/\/$/, "");
  const restBase = (opts.restBase ?? "https://rest.fal.ai").replace(/\/$/, "");
  const doFetch = opts.fetch ?? fetch;
  const expiry = opts.expirySeconds ?? 3600;
  const now = opts.now ?? Date.now;
  const envModel = opts.defaultModel ?? process.env.CHATTERBOX_FAL_MODEL;
  const defaultModel = FAL_MODELS.includes(envModel as (typeof FAL_MODELS)[number]) ? (envModel as string) : FAL_MODELS[0];
  // Per provider voice id: the uploaded reference URL (reused until shortly
  // before fal expires it) and when fal last received anything in this voice.
  // Memory only; deleteVoice() removes the entry.
  const uploads = new Map<string, { url: string; clipHash: string; reuseUntil: number }>();
  const lastSent = new Map<string, number>();

  const auth = () => {
    const key = apiKey();
    if (!key) throw new VoiceProviderError("chatterbox-fal", "FAL_KEY is not set");
    return `Key ${key}`;
  };
  const lifecycle = JSON.stringify({ expiration_duration_seconds: expiry });
  const call = (url: string, init: RequestInit) => providerFetch("chatterbox-fal", doFetch, url, init, opts.retry);

  const uploadReference = async (providerVoiceId: string, clip: AudioSample): Promise<string> => {
    const h = refHash(clip);
    const cached = uploads.get(providerVoiceId);
    if (cached && cached.clipHash === h && cached.reuseUntil > now()) return cached.url;
    const init = await call(`${restBase}/storage/upload/initiate?storage_type=fal-cdn-v3`, {
      method: "POST",
      headers: {
        Authorization: auth(),
        "Content-Type": "application/json",
        // Uploads take X-Fal-Object-Lifecycle (not the -Preference run header).
        "X-Fal-Object-Lifecycle": lifecycle,
      },
      body: JSON.stringify({ file_name: "reference.wav", content_type: clip.contentType }),
    });
    if (!init.ok) throw await providerFailure("chatterbox-fal", "reference upload initiate", init);
    const { upload_url, file_url } = (await init.json()) as { upload_url?: unknown; file_url?: unknown };
    if (typeof upload_url !== "string" || !upload_url.trim() || typeof file_url !== "string" || !file_url.trim()) {
      throw new VoiceProviderError("chatterbox-fal", "upload initiate returned no URLs");
    }
    const putUrl = requireFalUrl(upload_url, "upload_url");
    const fileUrl = requireFalUrl(file_url, "file_url");
    lastSent.set(providerVoiceId, now());
    const put = await call(putUrl, { method: "PUT", headers: { "Content-Type": clip.contentType }, body: clip.data as BodyInit });
    if (!put.ok) throw await providerFailure("chatterbox-fal", "reference upload", put);
    await put.body?.cancel().catch(() => undefined);
    uploads.set(providerVoiceId, { url: fileUrl, clipHash: h, reuseUntil: now() + (expiry - 600) * 1000 });
    return fileUrl;
  };

  return {
    id: "chatterbox-fal",
    label: "Chatterbox on fal.ai (hosted)",
    capabilities: CAPABILITIES,
    defaultModel,
    models: FAL_MODELS,
    isConfigured: () => Boolean(apiKey()),

    async createVoice(input) {
      // Nothing is stored at fal. The id names our reference clip.
      return { providerVoiceId: `ref-${refHash(input.referenceClip).slice(0, 24)}` };
    },

    async deleteVoice(providerVoiceId) {
      // There is no voice object at fal, and no documented way to delete an
      // uploaded file. Forget the URL so it is never reused, and say honestly
      // when fal's last copy (reference clip or generated audio) expires. If
      // this process never sent anything in this voice (say, after a restart),
      // "now + expiry" is still a safe upper bound.
      uploads.delete(providerVoiceId);
      const last = lastSent.get(providerVoiceId);
      lastSent.delete(providerVoiceId);
      const expiresAt = new Date((last ?? now()) + expiry * 1000).toISOString();
      return {
        deleted: false,
        expiresAt,
        detail: "fal can't delete uploaded files on request; its copies expire on their own",
      };
    },

    async synthesize(req) {
      const model = req.model || defaultModel;
      if (!FAL_MODELS.includes(model as (typeof FAL_MODELS)[number])) {
        throw new VoiceProviderError("chatterbox-fal", `model not allowed: ${model}`);
      }
      const clip = req.referenceClip;
      if (!clip) throw new VoiceProviderError("chatterbox-fal", "reference clip missing");
      // Without our audio_url fal reads in a stock demo voice. uploadReference
      // only ever returns an https fal URL, or throws.
      const audioUrl = await uploadReference(req.providerVoiceId, clip);
      return synthesizeChunks(
        "chatterbox-fal",
        { ...req, model },
        async (text) => {
          lastSent.set(req.providerVoiceId, now());
          const res = await call(`${runBase}/${model}`, {
            method: "POST",
            headers: {
              Authorization: auth(),
              "Content-Type": "application/json",
              "X-Fal-Store-IO": "0",
              "X-Fal-Object-Lifecycle-Preference": lifecycle,
            },
            body: JSON.stringify({ text, audio_url: audioUrl, seed: req.seed ?? CHATTERBOX_SEED }),
          });
          if (!res.ok) throw await providerFailure("chatterbox-fal", "synthesis", res);
          const body = (await res.json()) as { audio?: { url?: unknown } };
          if (!body.audio?.url) throw new VoiceProviderError("chatterbox-fal", "no audio URL in response");
          const url = requireFalUrl(body.audio.url, "audio URL");
          const audioRes = await call(url, { method: "GET" });
          if (!audioRes.ok) throw await providerFailure("chatterbox-fal", "audio download", audioRes);
          return { wav: new Uint8Array(await audioRes.arrayBuffer()) };
        },
        // fal runs Resemble's code, which applies PerTh; we can't inspect it.
        "perth-hosted",
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Self-hosted HTTP server
// ---------------------------------------------------------------------------

export interface ChatterboxHttpOptions {
  url?: string;
  token?: string;
  fetch?: typeof fetch;
  exaggeration?: number;
  cfgWeight?: number;
  temperature?: number;
  retry?: RetryOptions;
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/**
 * The server URL if it is safe to send a token and a voice clip to: https
 * anywhere, or plain http only to this machine. Otherwise null.
 */
export function safeChatterboxUrl(raw: string): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  const host = url.hostname.toLowerCase();
  const loopback = LOOPBACK.has(host) || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
  if (url.protocol === "https:" || (url.protocol === "http:" && loopback)) return url.toString().replace(/\/$/, "");
  return null;
}

export function createChatterboxHttpProvider(opts: ChatterboxHttpOptions = {}): TTSProvider {
  const rawUrl = () => opts.url ?? process.env.CHATTERBOX_URL ?? "";
  const baseUrl = () => safeChatterboxUrl(rawUrl());
  const token = () => opts.token ?? process.env.CHATTERBOX_TOKEN ?? "";
  const doFetch = opts.fetch ?? fetch;

  return {
    id: "chatterbox-http",
    label: "Chatterbox (self-hosted)",
    capabilities: CAPABILITIES,
    defaultModel: "chatterbox",
    models: ["chatterbox", "chatterbox-turbo"],
    isConfigured: () => Boolean(baseUrl()),

    async createVoice(input) {
      return { providerVoiceId: `ref-${refHash(input.referenceClip).slice(0, 24)}` };
    },

    async deleteVoice() {
      return { deleted: true, detail: "stateless server; nothing stored" };
    },

    async synthesize(req) {
      const url = baseUrl();
      if (!url) {
        throw new VoiceProviderError(
          "chatterbox-http",
          rawUrl() ? "CHATTERBOX_URL must be https (plain http only to 127.0.0.1 / localhost)" : "CHATTERBOX_URL is not set",
        );
      }
      const clip = req.referenceClip;
      if (!clip) throw new VoiceProviderError("chatterbox-http", "reference clip missing");
      const model = req.model || "chatterbox";
      return synthesizeChunks(
        "chatterbox-http",
        { ...req, model },
        async (text) => {
          const form = new FormData();
          form.append("text", text);
          form.append("model", model);
          form.append("reference", new Blob([clip.data as BlobPart], { type: clip.contentType }), "reference.wav");
          form.append("exaggeration", String(opts.exaggeration ?? 0.5));
          form.append("cfg_weight", String(opts.cfgWeight ?? 0.5));
          form.append("temperature", String(opts.temperature ?? 0.8));
          form.append("seed", String(req.seed ?? CHATTERBOX_SEED));
          const headers: Record<string, string> = {};
          if (token()) headers.Authorization = `Bearer ${token()}`;
          const res = await providerFetch("chatterbox-http", doFetch, `${url}/tts`, { method: "POST", body: form, headers }, opts.retry);
          if (!res.ok) throw await providerFailure("chatterbox-http", "synthesis", res);
          const mark = res.headers.get("x-watermark");
          return {
            wav: new Uint8Array(await res.arrayBuffer()),
            // Our server says whether PerTh was applied; anything else is "none".
            watermark: mark === "perth" ? "perth" : "none",
          };
        },
        "none",
      );
    },
  };
}
