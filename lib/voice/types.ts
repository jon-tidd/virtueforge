// Family story voice: shared types.
//
// The TTS layer is provider-agnostic: every provider (ElevenLabs, hosted or
// self-hosted Chatterbox, the mock) implements TTSProvider. Nothing in here
// accepts free text from a user. Synthesis text always comes from a chapter
// file, chosen by chapter id + paragraph index (see engine.ts).

export type ProviderId = "elevenlabs" | "chatterbox-fal" | "chatterbox-http" | "mock";

/** How (or whether) generated audio carries a watermark. */
export type WatermarkKind =
  /** No watermark (mock provider). */
  | "none"
  /** Resemble's PerTh watermark, applied by code we run (self-hosted Chatterbox). */
  | "perth"
  /** PerTh, applied by a host we don't control (fal.ai runs Chatterbox's code). */
  | "perth-hosted"
  /** Provider says it watermarks, but we cannot verify it (ElevenLabs, as of Sep 2026). */
  | "provider-claimed";

export interface ProviderCapabilities {
  /** Can make a voice from a recording. */
  cloning: boolean;
  /** Watermarks its output (see WatermarkKind for how sure we are). */
  watermark: boolean;
  /** Supports streaming audio out as it is generated. We still cache per paragraph. */
  streaming: boolean;
  /** Longest text the adapter sends in one request. Longer paragraphs are chunked by the adapter. */
  maxCharsPerRequest: number;
  /** Uses previous/next context (request stitching) to keep paragraphs consistent. */
  stitching: boolean;
  /** Needs the reference clip at synthesis time (zero-shot models like Chatterbox). */
  needsReferenceClip: boolean;
}

/** An audio file we hold (a recording or a reference clip). */
export interface AudioSample {
  filename: string;
  contentType: string;
  data: Uint8Array;
}

export interface CreateVoiceInput {
  /** Neutral provider-side name. Never the owner's real name. */
  name: string;
  description?: string;
  /** The guided-reading recordings (16-bit mono WAV). */
  samples: AudioSample[];
  /** The cleanest ~10–15 s picked from the samples (for zero-shot models). */
  referenceClip: AudioSample;
}

export interface CreatedVoice {
  providerVoiceId: string;
  /** ElevenLabs may ask for extra verification (voice CAPTCHA). */
  requiresVerification?: boolean;
}

export interface StitchingContext {
  /** Text of the paragraph before this one (same chapter). */
  previousText?: string;
  /** Text of the paragraph after this one (same chapter). */
  nextText?: string;
  /** Provider request ids of up to 3 earlier generations (ElevenLabs, < 2 h old). */
  previousRequestIds?: string[];
}

export interface SynthesisRequest {
  providerVoiceId: string;
  /** One paragraph of chapter text, already personalized. Never user-typed text. */
  text: string;
  model: string;
  context?: StitchingContext;
  /** Present when capabilities.needsReferenceClip is true. */
  referenceClip?: AudioSample;
  seed?: number;
}

export interface SynthesisResult {
  audio: Uint8Array;
  contentType: string;
  /** File extension for the cache ("mp3", "wav"). */
  ext: string;
  model: string;
  /** Characters the provider bills for (its own count when it reports one). */
  charactersBilled: number;
  /** Wall-clock time for the whole paragraph, including every chunk. */
  latencyMs: number;
  watermark: WatermarkKind;
  /** Provider request id, used for ElevenLabs request stitching. */
  requestId?: string;
  /** How many provider requests the paragraph took (Chatterbox chunks). */
  requests: number;
}

export interface TTSProvider {
  id: ProviderId;
  label: string;
  capabilities: ProviderCapabilities;
  defaultModel: string;
  /** Models this adapter allows. Anything else is rejected. */
  models: readonly string[];
  /** True when the keys / URL it needs are present. */
  isConfigured(): boolean;
  createVoice(input: CreateVoiceInput): Promise<CreatedVoice>;
  /**
   * Removes the voice at the provider. Resolves (not throws) if it is already gone.
   * `deleted: false` with `expiresAt` means the provider has nothing to delete on
   * request but still holds a copy until then (fal's CDN uploads).
   */
  deleteVoice(providerVoiceId: string): Promise<ProviderDeleteResult>;
  /** Removes provider-side generation history for this voice, where the provider keeps any. */
  purgeHistory?(providerVoiceId: string): Promise<{ deleted: number }>;
  /** Synthesizes one paragraph (the adapter chunks it if it must). */
  synthesize(req: SynthesisRequest): Promise<SynthesisResult>;
}

export interface ProviderDeleteResult {
  deleted: boolean;
  /** Short, fixed wording from our adapter. Never a provider response body. */
  detail?: string;
  /** When a copy the provider keeps (and can't delete on request) expires, ISO 8601. */
  expiresAt?: string;
}

/**
 * A provider call failed. The message is built from our own words plus the
 * provider id and HTTP status only: provider response bodies can echo request
 * fields (reference-clip URLs, chapter text with the children's names), so
 * they never go into a message that reaches the browser, a log or a file.
 */
export class VoiceProviderError extends Error {
  constructor(
    public readonly provider: ProviderId,
    message: string,
    public readonly status?: number,
    /** From a Retry-After header, when the provider sent one. */
    public readonly retryAfterMs?: number,
  ) {
    super(`${provider}: ${message}`);
    this.name = "VoiceProviderError";
  }
}

// ---------------------------------------------------------------------------
// On-disk records (see engine-design.md, "Data model on disk")
// ---------------------------------------------------------------------------

export interface ProviderBinding {
  provider: ProviderId;
  providerVoiceId: string;
  createdAt: string;
  requiresVerification?: boolean;
}

export interface VoiceRecord {
  id: string;
  ownerName: string;
  relationship: string;
  /** "Made from Jon's recording, with their permission" */
  label: string;
  /** The owner's off switch. When false nothing plays, cached audio included. */
  enabled: boolean;
  /** sha256 of the owner token. The raw token is shown once and never stored. */
  ownerTokenHash: string;
  /** One recording and one consent; one binding per provider it was made with. */
  bindings: ProviderBinding[];
  /** sha256 of the consent record (ConsentRecord.recordSha256), so an edited consent.json shows. */
  consentSha256?: string;
  /**
   * Tombstone: set (ISO time) the moment a delete starts. From then on nothing
   * plays, nothing is generated or cached, and no provider voice can be added.
   */
  deleting?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attestations {
  adult: true;
  ownVoice: true;
  noChildVoice: true;
  attestedAt: string;
}

export interface ConsentRecord {
  voiceId: string;
  scriptVersion: string;
  /** The exact statement shown and read aloud. */
  text: string;
  /** When the speaker started reading (browser clock, ISO 8601). */
  spokenAt: string;
  /** When the server stored it (ISO 8601, UTC). */
  receivedAt: string;
  audioFile: string;
  audioSha256: string;
  audioSeconds: number;
  attestations: Attestations;
  userAgent?: string;
  /**
   * sha256 over the canonical JSON of { voiceId, scriptVersion, text, spokenAt,
   * receivedAt, audioSha256, audioSeconds, attestations }. Also stored in
   * voice.json (consentSha256) and the deletion receipt, so an edit to any of
   * those fields is detectable (see voices.ts, consentRecordSha256).
   */
  recordSha256: string;
}

export interface SampleRecord {
  passageId: string;
  file: string;
  sha256: string;
  seconds: number;
}

/**
 * The text-only part of a ConsentRecord that outlives a delete. The children's
 * names are replaced by a placeholder; textSha256 is the hash of the exact
 * original wording (placeholder until the privacy lawyer decides what is kept).
 */
export interface DeletionConsent
  extends Pick<ConsentRecord, "scriptVersion" | "spokenAt" | "receivedAt" | "audioSha256" | "audioSeconds" | "attestations"> {
  /** The statement with the children's names replaced by "[the children's names]". */
  text: string;
  /** sha256 of the exact statement as it was read aloud. */
  textSha256: string;
  /** ConsentRecord.recordSha256 as stored (null for records made before it existed). */
  recordSha256: string | null;
  /** Whether consent.json still matched its hash when the voice was deleted. */
  recordIntact: boolean;
}

export interface ProviderDeletionRow {
  provider: ProviderId;
  providerVoiceId: string;
  voiceDeleted: boolean;
  historyItemsDeleted?: number;
  /** "HTTP 429" or "failed": never a provider response body. */
  historyError?: string;
  /** "HTTP 500" or "failed": never a provider response body. */
  error?: string;
  /** The provider keeps a copy it can't delete on request until this time (ISO 8601). */
  expiresAt?: string;
  detail?: string;
  /** True when the provider delete failed and is queued in pending-deletions/ for retry. */
  retryPending?: boolean;
  /** Set when a later retry confirmed the delete. */
  retriedAt?: string;
}

/** pending-deletions/<voiceId>.json: provider deletes that failed and will be retried. */
export interface PendingDeletion {
  voiceId: string;
  since: string;
  rows: Array<{ provider: ProviderId; providerVoiceId: string; attempts: number; lastTriedAt: string; lastError?: string }>;
}

export interface DeletionReceipt {
  /** Always true: what we keep after a delete is not decided yet. */
  placeholder: true;
  placeholderNote: string;
  voiceId: string;
  ownerName: string;
  consentedAt: string | null;
  /**
   * The consent record itself, text only (no audio): the spec says both
   * "delete removes everything" and "keep the consent record". Null when no
   * consent record was found. Placeholder until the privacy lawyer decides.
   */
  consent: DeletionConsent | null;
  deletedAt: string;
  audioHashes: { consent: string | null; samples: string[]; reference: string | null };
  providerDeletions: ProviderDeletionRow[];
  cachedFilesDeleted: number;
  localFilesDeleted: number;
}

export interface CacheMeta {
  key: string;
  voiceId: string;
  provider: ProviderId;
  model: string;
  providerVoiceId: string;
  chapterId: string;
  chapterHash: string;
  paragraph: number;
  characters: number;
  latencyMs: number;
  estCostUsd: number;
  contentType: string;
  ext: string;
  watermark: WatermarkKind;
  requestId?: string;
  createdAt: string;
}

export interface LedgerEntry {
  ts: string;
  provider: ProviderId;
  model: string;
  voiceId: string;
  chapterId: string;
  paragraph: number;
  characters: number;
  latencyMs: number;
  estCostUsd: number;
  requests: number;
  watermark: WatermarkKind;
}
