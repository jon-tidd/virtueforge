# Family story voice: engine design

**Date:** 27 September 2026
**Status:** prototype, behind a feature flag that is off in production. Local-only.
**Spec:** `docs/redesign/decisions.md`, section "Family voice engine" (authoritative). Providers, prices and legal notes: `provider-research.md`. UX: the mockups `canvas/project/VoiceIntro`, `VoiceCapture`, `VoiceReady`, `Voices` and `RecordChapter` (`.dc.html`).

This document describes the engine **as it should be**. It follows the code that already exists in `lib/voice/`, `app/api/voice/`, `app/voice-lab/` and `components/voice-lab/`, which is mostly sound. Where the target differs from today's code, the section says so and the gap list at the end tracks it (section 13).

---

## 1. Rules the design enforces

| Rule (decisions.md) | Where it is enforced |
|---|---|
| Provider-agnostic TTS layer | `TTSProvider` interface (`lib/voice/types.ts`), adapters in `lib/voice/providers/`, registry in `lib/voice/registry.ts`. Nothing outside the adapters knows a provider's API. |
| ElevenLabs cloning first; a self-hosted open-source adapter to compare | `providers/elevenlabs.ts` (Instant Voice Cloning); `providers/chatterbox.ts` (fal.ai hosted and a generic self-hosted HTTP server); `/voice-lab/compare`. |
| Consent statement read aloud, stored with a timestamp | `createVoiceRecord` stores `consent.wav`, the exact text, the script version, `spokenAt` (browser clock, accepted only within 30 min of the server's), `receivedAt` (server clock), the audio's sha256 and a `recordSha256` over all of it (also in voice.json). The server rebuilds the statement itself and rejects a mismatch or a clip under 6 s. |
| About 3 minutes of guided reading | `lib/voice/guided-reading.ts` (six passages, target about 450 words), a progress bar towards 3:00, a server-side minimum (`VOICE_MIN_SAMPLE_SECONDS`, default 60 s). |
| Voice created, then previewed | Step "create" makes the provider voice; step "preview" plays paragraph 1 before the full chapter. |
| Label "Made from [name]'s recording, with their permission" | `voiceLabel()` in `consent-text.ts`, stored on the voice record, shown by `ChapterPlayer` whenever the voice plays. |
| The owner controls an off switch | `VoiceRecord.enabled`. Off refuses all playback, cached audio included (`voice_off`, 403). Only the owner token can flip it. |
| Delete removes everything | `deleteVoiceEverywhere`: tombstone first, then provider history and provider voice (independently; failures queued in `pending-deletions/` and retried), samples, consent audio, reference clip, every cached paragraph (`cache/<voiceId>/`). Leaves a text-only receipt. |
| Adults only, own voice only, never a child's voice | Three separate attestations, required by the server (`adult_own_voice_required`). Copy on the "who" step. Provider-side name is neutral (`gg-<voiceId>`). |
| Reads ONLY our chapter text, no free-text path | Synthesis takes `(voiceId, chapterId, paragraph index)`, never text. The only text source is a chapter file. A route test lists every route and every exported method so a new one can't slip in unreviewed. |
| No downloads | Audio served only to the player's `fetch()` (`x-voice-player` header, `Sec-Fetch-Dest: empty`), `Content-Disposition: inline`, `Cache-Control: private, no-store`, `Cross-Origin-Resource-Policy: same-origin`; the player has no visible controls, `controlsList="nodownload"`, and no context menu. **This is a deterrent, not DRM**: anyone can record their speakers or copy a blob URL from dev tools. |
| Watermark where the provider supports it | Every result carries `WatermarkKind`; the ledger and the player show it. Chatterbox applies PerTh in code; ElevenLabs is recorded as `provider-claimed` until confirmed in writing. |
| Keep the consent record | The deletion receipt keeps the consent text (children's names replaced by a placeholder, plus a hash of the exact words), script version, timestamps, attestations, audio hashes and the record hash, never audio. A placeholder until the privacy lawyer decides. |
| Generate each chapter once and cache it | Content-addressed paragraph cache (section 5), plus an in-process de-duplication map so play and prefetch never generate twice. |
| Stream paragraph by paragraph | One GET per paragraph; the player prefetches the next paragraph while one plays; a Pause & ask marker stops playback and shows the question. |
| Keys only in `.env.local` | Adapters read `process.env` at call time. Keys never enter a response, a log line, an error message or a file. `.env*` is gitignored. |
| Behind a feature flag, off in production | `isVoiceEngineEnabled()` (section 3). Every route and page returns 404 when it is false. With it on, the lab still needs `VOICE_LAB_SECRET` and its cookie (section 11). `npm run voice:dev` also binds it to 127.0.0.1; plain `npm run dev` works too, protected by the secret. |

---

## 2. Architecture

```
Browser (/voice-lab)                          Server (Next.js route handlers, Node runtime)
────────────────────                          ─────────────────────────────────────────────
useRecorder (Web Audio PCM -> WAV)  ──POST──▶ /api/voice/voices            createVoiceRecord()
                                    ──POST──▶ /api/voice/voices/:id/bindings  addBinding() ─▶ TTSProvider.createVoice
ChapterPlayer                       ──GET───▶ /api/voice/chapters/:chapterId   loadPersonalizedChapter()
  (paragraph i, prefetch i+1)       ──GET───▶ /api/voice/audio/:v/:ch/:i     getParagraphAudio() ─▶ cache hit? serve
                                                                                               └▶ TTSProvider.synthesize ─▶ cache + ledger
OwnerPanel (owner link)             ──PATCH/DELETE▶ /api/voice/owner           setEnabled() / deleteVoiceEverywhere()
ComparePanel                        ──GET───▶ /api/voice/ledger              summarizeLedger()

lib/voice/
  flag.ts         the flag            engine.ts       the only way audio is made
  types.ts        interfaces          voices.ts       voice records, consent, bindings, delete
  registry.ts     provider lookup     chapters.ts     Markdown chapter loader
  providers/      elevenlabs, chatterbox (fal + http), mock
  storage.ts      VoiceStorage (local files now, Supabase later)
  cache.ts        cache keys           ledger.ts       spend ledger + cost estimates (rates.json)
  personalize.ts  sample -> real names chunking.ts     sentence groups for Chatterbox
  wav.ts          PCM WAV encode/decode/concat/trim  consent-text.ts, guided-reading.ts, errors.ts, http.ts, config.ts
```

Two layers matter most:

1. **The engine** (`engine.ts`) is the single entry point for audio. Routes never call a provider's `synthesize` directly.
2. **The provider interface** (`types.ts`) is the only surface adapters implement. Adding Azure personal voice or Speechify later is one new file plus a registry entry and a rates row.

---

## 3. Feature flag

```ts
// lib/voice/flag.ts
export function isVoiceEngineEnabled(env = process.env): boolean {
  if (env.VOICE_ENGINE_ENABLED !== "true") return false; // exactly "true"
  if (env.NODE_ENV === "production") return false;       // `next build`/`next start`, all Vercel deployments
  if (env.VERCEL_ENV === "production") return false;     // belt and braces
  return true;
}
```

- Read on every request (not at import), so tests and a restarted dev server see changes.
- Every API route is wrapped in `guarded()` (`lib/voice/http.ts`), which returns a bare `404 Not found` **before any other work** when the flag is off.
- Every page under `/voice-lab` calls `notFound()` when the flag is off, and so does the `/voice-lab` layout.
- Because Vercel Preview builds also run with `NODE_ENV=production`, the lab is off on previews too. It only ever runs under `next dev`.

---

## 4. TypeScript interfaces

These are the exact interfaces in `lib/voice/types.ts` today, plus the target additions marked `// target`.

```ts
export type ProviderId = "elevenlabs" | "chatterbox-fal" | "chatterbox-http" | "mock";
// target: add "chatterbox-replicate" only if fal.ai proves unreliable; Azure / Speechify later.

export type WatermarkKind =
  | "none"              // mock, or a self-hosted server that did not confirm PerTh
  | "perth"             // PerTh applied by code we run (self-hosted Chatterbox)
  | "perth-hosted"      // PerTh applied by a host we don't control (fal.ai runs Resemble's code)
  | "provider-claimed"; // provider says it watermarks; not verified (ElevenLabs, Sep 2026)

export interface ProviderCapabilities {
  cloning: boolean;
  watermark: boolean;
  streaming: boolean;           // provider can stream; we still cache whole paragraphs
  maxCharsPerRequest: number;   // adapter chunks above this (Chatterbox) or refuses (ElevenLabs)
  stitching: boolean;           // uses previous/next context between paragraphs
  needsReferenceClip: boolean;  // zero-shot models: the reference clip goes with every request
}

export interface AudioSample { filename: string; contentType: string; data: Uint8Array }

export interface CreateVoiceInput {
  name: string;                 // neutral: "gg-<voiceId>", never the owner's name
  description?: string;
  samples: AudioSample[];       // guided-reading WAVs (16-bit mono)
  referenceClip: AudioSample;   // cleanest ~12 s, for zero-shot models
}

export interface CreatedVoice { providerVoiceId: string; requiresVerification?: boolean }

export interface StitchingContext {
  previousText?: string;
  nextText?: string;
  previousRequestIds?: string[]; // ElevenLabs: at most 3, each < 2 h old
}

export interface SynthesisRequest {
  providerVoiceId: string;
  text: string;                 // ONE paragraph of chapter text, already personalized
  model: string;                // must be in provider.models
  context?: StitchingContext;
  referenceClip?: AudioSample;  // when capabilities.needsReferenceClip
  seed?: number;
}

export interface SynthesisResult {
  audio: Uint8Array;
  contentType: string;          // "audio/mpeg" | "audio/wav"
  ext: string;                  // "mp3" | "wav"
  model: string;
  charactersBilled: number;     // provider's own count when it reports one (ElevenLabs `character-cost`)
  latencyMs: number;            // whole paragraph, all chunks
  watermark: WatermarkKind;
  requestId?: string;           // ElevenLabs `request-id`, for stitching
  requests: number;             // provider calls this paragraph took
}

export interface TTSProvider {
  id: ProviderId;
  label: string;
  capabilities: ProviderCapabilities;
  defaultModel: string;
  models: readonly string[];    // allowlist; anything else is refused
  isConfigured(): boolean;      // key / URL present; never reveals the value
  createVoice(input: CreateVoiceInput): Promise<CreatedVoice>;
  deleteVoice(providerVoiceId: string): Promise<{ deleted: boolean; detail?: string }>; // resolves if already gone
  purgeHistory?(providerVoiceId: string): Promise<{ deleted: number }>;                 // provider-side generation history
  synthesize(req: SynthesisRequest): Promise<SynthesisResult>;
}
```

On-disk records:

```ts
export interface ProviderBinding {
  provider: ProviderId; providerVoiceId: string; createdAt: string; requiresVerification?: boolean;
}

export interface VoiceRecord {
  id: string;                   // "v_" + 12 base64url chars
  ownerName: string;
  relationship: string;         // "Parent" | "Grandparent" | ...
  label: string;                // "Made from Jon's recording, with their permission"
  enabled: boolean;             // the owner's off switch
  ownerTokenHash: string;       // sha256(ownerToken); the raw token is shown once, never stored
  bindings: ProviderBinding[];  // one recording + one consent, one binding per provider
  createdAt: string; updatedAt: string;
}

export interface Attestations { adult: true; ownVoice: true; noChildVoice: true; attestedAt: string }

export interface ConsentRecord {
  voiceId: string;
  scriptVersion: string;        // "consent-v1-2026-09"
  text: string;                 // the exact statement shown and read aloud
  spokenAt: string;             // ISO 8601, browser clock, when recording started
  receivedAt: string;           // ISO 8601 UTC, server clock
  audioFile: "consent.wav";
  audioSha256: string;
  audioSeconds: number;
  attestations: Attestations;
  userAgent?: string;
  recordSha256: string;         // sha256 of the canonical fields above; also VoiceRecord.consentSha256
}

export interface SampleRecord { passageId: string; file: string; sha256: string; seconds: number }

export interface DeletionReceipt {
  placeholder: true;            // what we keep after delete is pending the privacy lawyer's call
  placeholderNote: string;
  voiceId: string;
  ownerName: string;
  consentedAt: string | null;
  // the consent record itself: text only, no audio, children's names redacted
  consent: (Pick<ConsentRecord, "scriptVersion" | "spokenAt" | "receivedAt" | "audioSha256" | "audioSeconds" | "attestations">
    & { text: string; textSha256: string; recordSha256: string | null; recordIntact: boolean }) | null;
  deletedAt: string;
  audioHashes: { consent: string | null; samples: string[]; reference: string | null };
  providerDeletions: Array<{
    provider: ProviderId; providerVoiceId: string; voiceDeleted: boolean;
    historyItemsDeleted?: number; historyError?: string; error?: string;   // "HTTP <status>" only
    expiresAt?: string; detail?: string; retryPending?: boolean; retriedAt?: string;
  }>;
  cachedFilesDeleted: number;
  localFilesDeleted: number;
}

export interface CacheMeta {
  key: string; voiceId: string; provider: ProviderId; model: string; providerVoiceId: string;
  chapterId: string; chapterHash: string; paragraph: number;
  characters: number; latencyMs: number; estCostUsd: number;
  contentType: string; ext: string; watermark: WatermarkKind; requestId?: string; createdAt: string;
}

export interface LedgerEntry {
  ts: string; provider: ProviderId; model: string; voiceId: string; chapterId: string; paragraph: number;
  characters: number; latencyMs: number; estCostUsd: number; requests: number; watermark: WatermarkKind;
}
```

Storage:

```ts
// lib/voice/storage.ts
export interface VoiceStorage {
  read(key: string): Promise<Uint8Array | null>;
  write(key: string, data: Uint8Array | string): Promise<void>;   // atomic (write + rename) locally
  readJson<T>(key: string): Promise<T | null>;
  writeJson(key: string, value: unknown): Promise<void>;
  appendLine(key: string, line: string): Promise<void>;           // ledger.jsonl
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  deletePrefix(prefix: string): Promise<number>;
  list(prefix: string): Promise<string[]>;                         // deep, sorted
}
```

Keys are relative paths matched by `^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*/?$`, never `.` or `..`; the local implementation also checks the resolved path stays under the root.

Engine:

```ts
// lib/voice/engine.ts
export interface ParagraphRequest { voiceId: string; chapterId: string; paragraph: number; provider?: ProviderId; model?: string }
export interface ParagraphAudio { audio: Uint8Array; meta: CacheMeta; cache: "hit" | "miss" }
export interface EngineDeps { storage: VoiceStorage; family?: Family; loadChapter?: (id: string) => Promise<Chapter> }
export function getParagraphAudio(req: ParagraphRequest, deps: EngineDeps): Promise<ParagraphAudio>;
export function loadPersonalizedChapter(chapterId: string, deps: Omit<EngineDeps, "storage">): Promise<Chapter>;
```

Chapters:

```ts
// lib/voice/chapters.ts
export interface ChapterMeta { id: string; season: number; part: number; chapter: number; title: string; tag: string; lead: string }
export type ChapterItem =
  | { type: "paragraph"; index: number; text: string }
  | { type: "pause"; question: string; answersFirst?: string };
export interface Chapter {
  meta: ChapterMeta;
  contentHash: string;              // sha256 of the raw file
  source: "content" | "fixture";
  items: ChapterItem[];             // reading order, pauses included
  paragraphs: string[];             // readable paragraphs only; paragraphs[i] <-> item.index i
  pause: { question: string; answersFirst?: string } | null;
  lastPage: string;
}
```

---

## 5. Engine behaviour

`getParagraphAudio(req)`:

1. Load the voice record. Missing: `voice_not_found` (404). `enabled === false`: `voice_off` (403). This check runs **before** the cache, so the off switch stops cached audio too.
2. Pick the binding for `req.provider` (or the first one). None: `not_bound` (409).
3. `model = req.model || provider.defaultModel`; must be in `provider.models`, else `model_not_allowed` (400).
4. Load the chapter (`STORY_CONTENT_DIR`, then the fixture) and personalize it (section 6). Index out of range: `paragraph_not_found` (404).
5. Cache key (below). Hit: return it.
6. De-duplicate: if the same key is already generating in this process, await that promise.
7. Miss: provider not configured: `provider_not_configured` (503). Build stitching context when `capabilities.stitching` (neighbouring paragraph text; request ids of up to 3 preceding paragraphs cached in the last 2 hours). Load `voices/<id>/reference.wav` when `needsReferenceClip`.
8. `provider.synthesize(...)`. Provider errors become `provider_error` (502) with a key-free message.
9. **Always append a ledger line** (we were billed even if the voice changed meanwhile).
10. Re-check the voice is still present and enabled; only then write `cache/<key>.<ext>` and `cache/<key>.json`.

**Cache key**

```
sha256(JSON.stringify(["gg-voice-cache-v1", voiceId, provider, model, providerVoiceId,
                       chapterContentHash, paragraphIndex, finalPersonalizedText]))
```

This is the spec's key plus our own `voiceId` (so two of our voices never share or strand each other's audio) and a version tag. JSON-array encoding means field boundaries can't collide. Because the final text is included, every family's personalized paragraph has its own entry, and any edit to a chapter file changes every key for that chapter ("freeze text before voicing", research lever 1).

**Cost estimate:** `characters / 1000 × rates.json[provider][model]`. `rates.json` is the single source of rates for the ledger, the compare page and `scripts/voice-cost.mjs`.

---

## 6. Chapters and personalization

**Location:** `STORY_CONTENT_DIR` (default `docs/redesign/story/season-1/`), one file per chapter named `<id>.md`, for example `s1-ch01.md`. Until real chapters exist, the loader falls back to `lib/voice/__fixtures__/s1-ch01.md` (the canon §8 free sample page: 6 paragraphs, about 1,200 characters, against about 5,750 for a full chapter).

**Format:**

```markdown
---
id: s1-ch01          # /^s\d{1,2}-ch\d{2,3}$/
season: 1
part: 1
chapter: 1
title: The Fox at the Window
tag: Brave
lead: Clara
---

## Chapter-book telling
Paragraph one…

Paragraph two…

[[Pause & ask]]            <- or "**Pause & ask:** inline question?"

Paragraph three…

## Picture-book telling
…(not voiced in the prototype)

## Pause & ask
**Question:** "Why do you think she did?"
**Answers first:** Clara

## Last page
Tomorrow: Chapter 2 · I'll Help!
```

- The voice reads **only** the "Chapter-book telling". Paragraphs are blank-line separated; Markdown emphasis, links and blockquote marks are stripped; HTML comments are ignored.
- A block that is exactly `[[Pause & ask]]` (or starts with `**Pause & ask:**`) becomes a pause item, using its inline question or the "## Pause & ask" section's question. It is never sent to a voice. With no marker, the pause goes at the end.
- `contentHash` is the sha256 of the raw file.

**Personalization.** If `VOICE_FAMILY_FILE` points to JSON of the form

```json
{ "slots": { "eldest": { "sample": "Hugh", "real": "…" }, "middle": { "sample": "Alfie", "real": "…" }, "youngest": { "sample": "Clara", "real": "…" } } }
```

the engine swaps each sample name for the real one, whole words only (Unicode-aware boundaries, possessives work), in one pass so a real name equal to another sample name is never swapped twice. It applies to paragraphs, the pause question, "answers first", the last page and the guided-reading passages; the children's real names also go into the consent statement ("…only for reading stories to A, B and C"). The file is read at runtime only, never logged, and a missing or malformed file silently falls back to the sample family. Because the cache key includes the final text, personalized audio never mixes with sample-family audio.

> The repo's `docs/redesign/private/family.json` may not be in this shape. The engine only reads whatever path `VOICE_FAMILY_FILE` names; if the shapes differ, Jon makes a second file in the shape above.

---

## 7. API routes

All routes: Node runtime, `dynamic = "force-dynamic"`, wrapped in `guarded()`: flag off → 404 before anything else, and **no lab cookie → 404** too (section 11; only `/api/voice/unlock` works without it). `Cache-Control: no-store`, `Referrer-Policy: no-referrer`. JSON errors are `{ error: <code>, message: <safe text> }` with the status from `errors.ts`. Messages carry our own wording plus a provider id and HTTP status at most, never a provider response body. Unexpected errors log only the error **type** and return `500 { error: "internal" }`. Mutating routes refuse `Sec-Fetch-Site: cross-site | same-site` (400). The audio route answers only the player's own `fetch()` (header `x-voice-player: 1`, `Sec-Fetch-Dest: empty`, `Sec-Fetch-Mode: cors | same-origin`, not cross-site); anything else, including a URL typed into the address bar, gets 403.

| # | Method & path | Request | Success | Errors |
|---|---|---|---|---|
| 1 | `GET /api/voice/providers` | none | `200 { providers: ProviderInfo[], defaultProvider }` where `ProviderInfo = { id, label, configured, defaultModel, models, watermark, stitching }`. Never returns keys. | 404 (flag) |
| 2 | `GET /api/voice/chapters` | none | `200 { chapters: ChapterMeta[] }` (content dir + fixture, de-duplicated; unparsable drafts skipped) | 404 (flag) |
| 3 | `GET /api/voice/chapters/:chapterId` | none | `200 { meta, source, contentHash, items, paragraphCount, characters, lastPage }`, personalized | 404 `chapter_not_found` |
| 4 | `GET /api/voice/voices` | none | `200 { voices: PublicVoice[] }` (no token hash) | 404 (flag) |
| 5 | `POST /api/voice/voices` | `multipart/form-data` (whole body ≤ 200 MB, checked from `Content-Length` and while reading): `ownerName` (1–60), `relationship` (1–40), `attestAdult=true`, `attestOwnVoice=true`, `attestNoChildVoice=true`, `consentText`, `consentScriptVersion`, `consentSpokenAt` (ISO, within 30 min before to 2 min after the server's clock), `consentAudio` (16-bit mono WAV ≤ 10 MB, ≥ `VOICE_MIN_CONSENT_SECONDS`, default 6 s), `sample:<passageId>` (WAV ≤ 25 MB each, at most one per guided passage, known ids, no duplicates, total ≥ `VOICE_MIN_SAMPLE_SECONDS`). Any other field (e.g. `text`) is ignored. | `201 { voice, ownerToken, ownerPath }`. Stores consent and samples only; no provider call. | 400 `bad_request`, `adult_own_voice_required`, `consent_text_mismatch`, `consent_stale` (read it again), `bad_audio`, `not_enough_audio`; 413 `too_large` |
| 6 | `GET /api/voice/voices/:voiceId` | none | `200 { voice: PublicVoice }` | 404 `voice_not_found` (also while a delete is running) |
| 7 | `POST /api/voice/voices/:voiceId/bindings` | header `x-voice-owner-token`; JSON `{ provider }` | `201 { binding }` (provider voice made from stored samples; neutral name) | 400 `bad_request`; 401 `unauthorized`; 404 `voice_not_found`; 409 `already_bound` (also while one is being made); 429 `rate_limited`; 503 `provider_not_configured`; 502 `provider_error`; 400 `bad_audio` (samples missing) |
| 8 | `GET /api/voice/audio/:voiceId/:chapterId/:paragraph?provider=&model=` | path only; `paragraph` = 1–4 digits; `provider` must be a known id; any other query parameter (e.g. `text`) is ignored. Honors `Range`. | `200` or `206` audio (`audio/mpeg` or `audio/wav`), `Content-Disposition: inline`, `Cache-Control: private, no-store`, `Cross-Origin-Resource-Policy: same-origin`, `X-Content-Type-Options: nosniff`, `Accept-Ranges: bytes`, plus `X-Voice-Cache`, `-Provider`, `-Model`, `-Characters`, `-Latency-Ms`, `-Est-Cost-Usd`, `-Watermark` | 403 (not the player's fetch) / `voice_off`; 404 `voice_not_found`, `chapter_not_found`, `paragraph_not_found`; 409 `not_bound`; 400 `model_not_allowed`, `bad_request`; 416 bad range; 429 `spend_limit` / `rate_limited` (provider busy after retries); 502; 503 |
| 9 | `GET /api/voice/owner` | header `x-voice-owner-token` | `200 { voice, consent: { text, spokenAt, receivedAt, audioSha256, scriptVersion, recordSha256, intact } }` (`intact` false if consent.json no longer matches its hash) | 404 `voice_not_found` (bad or unknown token: same answer) |
| 10 | `PATCH /api/voice/owner` | header token; JSON `{ enabled: boolean }` | `200 { voice }` | 400; 404 |
| 11 | `DELETE /api/voice/owner` | header token | `200 { receipt: DeletionReceipt }` | 400; 404 |
| 12 | `GET /api/voice/ledger?chapterId=&voiceId=` | none | `200 { rows: LedgerSummaryRow[] }` = per provider+model: paragraphs, characters, total/avg latency, est. cost. No text, no audio. | 404 (flag) |
| 13 | `POST /api/voice/unlock` / `DELETE /api/voice/unlock` | JSON `{ secret }` / none | `204` + the lab cookie (httpOnly, SameSite=Strict, Path=/, 30 days; an HMAC of the secret) / `204` cookie cleared | 401 wrong secret; 429 after 10 wrong tries in 10 min; 404 flag off or no `VOICE_LAB_SECRET` |

**The owner token never travels in a path.** Paths land in the dev server's request log, browser history and any analytics. The owner page is `/voice-lab/owner#<token>`; `OwnerPanel` reads `location.hash` and sends it as `x-voice-owner-token`. Old `/voice-lab/owner/<token>` links redirect to the fragment form.

**No free-text path, by construction:** no route accepts a `text` field; the only synthesis route is a GET whose inputs are ids and an integer. `routes.test.ts` fails if a route file is added or an unexpected export appears.

---

## 8. Data on disk

Root: `VOICE_DATA_DIR`, default `<repo>/.voice-data/` (gitignored). Files are written `0600`, atomically (temp file + rename).

```
.voice-data/
  voices/<voiceId>/
    voice.json          VoiceRecord (ownerTokenHash only, never the token; consentSha256;
                        `deleting` tombstone while a delete runs)
    consent.json        ConsentRecord (exact text, script version, spokenAt, receivedAt, audio sha256,
                        attestations, recordSha256 over all of those, also kept in voice.json)
    consent.wav         the spoken consent, 16-bit mono WAV, 24 kHz
    samples.json        SampleRecord[]
    samples/<passageId>.wav
    reference.wav       cleanest ~12 s (longest take, silence trimmed) for zero-shot models
  cache/<voiceId>/
    <key>.json          CacheMeta (written first)
    <key>.mp3|.wav      one paragraph of audio
  deletions/<voiceId>.json   DeletionReceipt (text only, no audio, children's names redacted)
  pending-deletions/<voiceId>.json   provider deletes that failed, retried until confirmed
  ledger.jsonl          one LedgerEntry per provider generation (append-only)
```

What leaves the machine:

| Data | ElevenLabs | fal.ai (Chatterbox) | Self-hosted Chatterbox |
|---|---|---|---|
| Guided-reading samples | all samples (IVC) | no | no |
| Reference clip (~12 s) | no | uploaded to fal's CDN, expiring after 1 h | sent per request; server keeps nothing |
| Consent audio, owner name | **never** | **never** | **never** |
| Chapter paragraph text (with real names) | yes, and kept in ElevenLabs history until purged | yes; payload storage off (`X-Fal-Store-IO: 0`) | yes; not stored |

---

## 9. Flows

### 9.1 Recording (browser)

- `useRecorder` asks for the microphone with echo cancellation, noise suppression and auto-gain **off** (the clone should hear the real voice), captures raw PCM with an `AudioWorklet` (ScriptProcessor fallback), and encodes **16-bit mono WAV at 24 kHz** in the browser (`encodeWavFromFloat`: join, band-limited windowed-sinc resample with a low-pass at 0.45 × the new rate so sibilants and hiss above 12 kHz don't alias into the speech band, clamp; about 0.5 s for 3 minutes). This avoids MediaRecorder codec differences between Chrome and Safari; every provider accepts WAV.
- A 36-bar level meter (RMS × 6), a mm:ss timer, "we can't hear you yet" when the level stays under 0.02, a per-take maximum (consent 60 s, passages 120 s), and a playback check with `controlsList="nodownload"` before "Sounds right, use this".

### 9.2 Consent and guided reading (`/voice-lab`)

Matches VoiceIntro → VoiceCapture → VoiceReady:

1. **Who is recording.** Name, relationship, and three separate checkboxes: 18 or older; my own voice and I'm the one recording; no child's voice will be in these recordings. "Next" stays disabled until all are ticked; the server re-checks.
2. **Consent, read aloud.** The statement (script `consent-v1-2026-09`, mockup wording): *"I'm {first name}, and I'd like Grit & Grace to make my story voice, only for reading stories to {children}. I can switch it off whenever I want."* Recorded, checked by ear, accepted. `spokenAt` is the moment recording started.
3. **About 3 minutes of guided reading.** Six passages (warm-up, big feelings, the lane at night, questions, Grandma's hearth, goodnight) covering narration, dialogue, whispers, a loud line, questions, a laugh and a sleepy close; a progress bar to 3:00. The passages show the **sample** names, never the children's real names: they only need to capture how the adult reads, and they become the clone's training audio. The main button is "All done. Make my voice" (every passage, or 3:00); from `VOICE_MIN_SAMPLE_SECONDS` a secondary "Make my voice now (shorter reading, may sound less like you)" appears, and the create step shows how much reading each provider gets.
4. **Create.** "Save my recording" → `POST /api/voice/voices` stores everything; the owner link appears, and nothing continues until "I've saved my owner link" is ticked (it is the only off switch and delete; `npm run voice:owner-link -- <voiceId>` can issue a new one on this machine). Then one `POST …/bindings` per chosen provider (ElevenLabs, plus a Chatterbox adapter for the comparison). `requires_verification` from ElevenLabs is surfaced. If the consent was read more than 30 minutes earlier the server answers `consent_stale`: the person reads the statement again and comes straight back here (samples kept).
5. **Preview.** The first paragraph of Chapter 1 with the label "Made from {name}'s recording, with their permission". Buttons: "Sounds like me. Read Chapter 1", and a provider switcher when there are two.
6. **Listen.** Chapter 1, paragraph by paragraph.

### 9.3 Playback (`ChapterPlayer`)

- Fetch the manifest (`GET /api/voice/chapters/:id`), then walk `items`.
- Paragraph item: fetch `GET /api/voice/audio/...` (first time generates, later hits the cache), play it from a blob URL in a hidden `<audio controlsList="nodownload noplaybackrate">` with the context menu off, and **prefetch the next paragraph** as soon as this one starts.
- Pause item: stop, show the question card ("Let {name} answer first"), continue on "Keep reading".
- Show per-paragraph provenance (cached / made in n s, characters, est. cost, watermark) and the chapter's last page at the end. The progress bar covers the whole chapter (or the preview), not one clip; the preview ends with "That was the preview".
- The owner's switch wins: a 403 `voice_off` (play or prefetch), a status re-check before each paragraph, or an event from the owner page in this browser stops playback and revokes every fetched blob.
- One player at a time: starting one announces itself and every other player on the page pauses (the compare page has two).
- Jumping to another paragraph pauses the current one first, and only the paragraph being played may advance the reader on `ended`.
- iOS: the first tap plays and pauses a moment of silence before any await, so the later `play()` (after a multi-second generation) is allowed; a refused play says "Tap play again to start."
- A provider that stays busy (429 `rate_limited`) shows "The voice service is busy. Retrying…" and retries the paragraph up to 3 times.

### 9.4 Owner page (`/voice-lab/owner#<token>`)

Shows the voice, its label, the consent record (text, when it was spoken and received, audio hash, and whether the record still matches its stored fingerprint) and which providers hold a voice. A large **off switch** (`PATCH { enabled }`) and **Delete everything**, behind a typed confirmation, which shows the returned receipt: per provider "voice deleted", "can't be deleted on request; its last copy expires at …" (fal), or "NOT confirmed deleted" with the HTTP status and a note that this machine keeps retrying; cached and local files removed; and the "pending the privacy lawyer's call" note.

### 9.5 Delete

`deleteVoiceEverywhere(storage, voice)` holds the voice's lock (`withVoiceLock`, the same lock every `voice.json` change takes) from start to finish:

1. **Tombstone first:** re-read the record, write it back with `enabled: false` and `deleting: <time>`. From here the engine refuses to play or generate, `GET /voices/:id` answers 404, and `addBinding` keeps nothing it makes.
2. For each binding (read from that fresh record, and once more just before wiping): `purgeHistory` and `deleteVoice` **each in its own try**, so a failed purge never skips the voice delete. ElevenLabs purge: `GET /v1/history?voice_id=&page_size=1000` with no cursor, delete every item (404 = gone), repeat until empty (at most 50 rounds). `deleteVoice` 404 counts as gone. fal has no delete for uploaded files: the adapter forgets the URL and returns `deleted: false` with `expiresAt` (1 h after it last sent anything).
3. Any row that failed (voice not confirmed gone and not merely expiring, or history not purged) is written to `pending-deletions/<id>.json` **before** local data goes. `retryPendingDeletions` retries it right after the delete, whenever `/voice-lab` opens (at most every 10 min) and from `npm run voice:purge-pending`, and updates the receipt when a retry succeeds.
4. `deletePrefix("cache/<id>/")` (plus a sweep of older flat `cache/<key>.*` files). A generation already in flight can't leave audio behind: it writes meta then audio under `cache/<id>/`, then re-reads the record and deletes both files if the voice is gone, tombstoned or off.
5. Delete `voices/<id>/` entirely (samples, consent audio, reference clip, records).
6. Write `deletions/<id>.json`: a text-only receipt with no audio. It keeps the consent record's text fields (script version, statement with the children's names replaced by "[the children's names]" plus the sha256 of the exact words, spokenAt, receivedAt, attestations, audio hash, `recordSha256` and whether it was intact), because the spec says both "delete removes everything" and "keep the consent record". Provider errors are stored as "HTTP <status>" only. Marked `placeholder: true` until the privacy lawyer decides (research open question 18).
7. The ledger keeps its rows (ids, counts, cost; no text, no audio).

Honest wording in the UI until vendor DPAs exist: "We delete everything we hold and instruct the voice provider to delete theirs" (research §4).

### 9.6 Compare (`/voice-lab/compare`)

Pick a voice that has two bindings, a chapter, and provider/model A and B. Two `ChapterPlayer`s side by side (same chapter, same paragraphs; only one plays at a time), each reporting `onStats`. A table below: paragraphs loaded, characters played, characters and dollars billed now (cache hits excluded), average generation latency, time-to-first-audio, the rate (the same `rates.ts` lookup the ledger uses), estimated cost for this chapter, and the per-family yearly estimate for the Light / Typical / Heavy scenarios (52 / 156 / 240 chapters at `charsPerChapter`) **against the $89 Heirloom price**: "$89.70 · 101% of $89 · over", with the same fits / tight / over rule as `npm run voice:cost` (margin guide $30, tight up to twice that; rates.json), coloured and worded. Totals come from `/api/voice/ledger?chapterId=&voiceId=` so reloads keep them.

---

## 10. Providers, verified against official docs

### 10.1 ElevenLabs (checked 27 Sep 2026)

| What | Official doc | Verified |
|---|---|---|
| Create IVC voice | https://elevenlabs.io/docs/api-reference/voices/ivc/create | `POST https://api.elevenlabs.io/v1/voices/add`, `multipart/form-data`: `name` (required), `files` (required, repeated), `remove_background_noise` (optional bool), `description`, `labels`. Response: `voice_id`, `requires_verification`. |
| Text to speech | https://elevenlabs.io/docs/api-reference/text-to-speech/convert | `POST /v1/text-to-speech/{voice_id}`; query `output_format` (default `mp3_44100_128`), `enable_logging` (default true; false = zero-retention mode, which research says is Enterprise-only and excludes cloning). Body: `text` (required), `model_id` (default `eleven_multilingual_v2`), `voice_settings`, `seed` (0–4294967295), `previous_text`, `next_text`, `previous_request_ids` (max 3), `next_request_ids` (max 3), `apply_text_normalization`. "In case both previous_text and previous_request_ids is send, previous_text will be ignored." Auth header `xi-api-key`. |
| Request stitching | https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/request-stitching | Not available on `eleven_v3`. Request ids no older than two hours; the earlier audio must have been read completely. Request id from response header `request-id`; header `character-cost` gives the generation's cost in characters. |
| Models and limits | https://elevenlabs.io/docs/overview/models | `eleven_v3` 5,000 chars/request; `eleven_multilingual_v2` 10,000; `eleven_flash_v2_5` 40,000. Turbo v2.5 deprecated in favour of Flash. |
| History | https://elevenlabs.io/docs/api-reference/history/list | `GET /v1/history`: `page_size` (max 1,000), `start_after_history_item_id`, `voice_id`, `model_id`, …; response `history[]`, `has_more`, `last_history_item_id`. **Each item includes the original text**, so personalized paragraphs (real names) sit in ElevenLabs history until purged. |
| Delete voice / history item | https://elevenlabs.io/docs/api-reference/voices/delete ; https://elevenlabs.io/docs/api-reference/history/delete | `DELETE /v1/voices/{voice_id}`; `DELETE /v1/history/{history_item_id}`. |

Every request goes through `providerFetch` (`providers/fetch-util.ts`): `redirect: "error"`, 429 and 503 retried twice with backoff (Retry-After honoured, 8 s cap), an exhausted 429 reported as status 429 (the engine answers `rate_limited`), and errors built from the status only, never the response body (ElevenLabs and FastAPI-style 422 bodies echo the request's text).

Adapter choices: Multilingual v2 is the default (`ELEVENLABS_MODEL` can pick `eleven_v3` or `eleven_flash_v2_5`); stitching sends `previous_request_ids` when available, otherwise `previous_text`, plus `next_text`; all stitching is dropped for v3. Output is MP3 44.1 kHz 128 kbps. `charactersBilled` comes from `character-cost` when present. Watermark is `provider-claimed` (research §2: a blog says SynthID is in every generation; the API docs do not confirm it for paid cloned voices). The adapter refuses a paragraph over the model's limit instead of chunking (chapter paragraphs are far shorter).

Legal gates before any real family (research §1): §9(r) under-13 bundling ban, OEM terms, §9(i) prior written authorization. Internal testing with Jon's own voice is the only use until ElevenLabs answers in writing.

### 10.2 Chatterbox on fal.ai (checked 27 Sep 2026)

| What | Source | Verified |
|---|---|---|
| Chatterbox TTS | https://fal.ai/models/fal-ai/chatterbox/text-to-speech/api | Endpoint `fal-ai/chatterbox/text-to-speech`. Input `text` (max 5,000), `audio_url` (**defaults to a stock demo voice if omitted**, so the adapter must always send ours), `exaggeration` (default 0.25), `temperature` (0.7), `cfg` (0.5), `seed`. Output `{ audio: { url } }`. |
| ChatterboxHD | https://fal.ai/models/resemble-ai/chatterboxhd/text-to-speech/api | Input `text`, `voice` (stock enum), `audio_url` (overrides `voice`), `exaggeration` (0.25–2.0, default 0.5), `cfg` (0.2–1.0), `high_quality_audio` (48 kHz), `seed`, `temperature` (0.8). Built-in watermarking. |
| Sync run + auth | fal REST convention | `POST https://fal.run/{endpoint}`, `Authorization: Key $FAL_KEY`. |
| Data retention | https://fal.ai/docs/documentation/model-apis/media-expiration | `X-Fal-Store-IO: 0` stops storing JSON payloads (default 30 days) but not CDN files. `X-Fal-Object-Lifecycle-Preference: {"expiration_duration_seconds": 3600}` on run requests sets generated-file expiry. |
| File upload | fal-js client source, `libs/client/src/storage.ts` (github.com/fal-ai/fal-js, main, read 27 Sep 2026) | `POST https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3` with JSON `{ content_type, file_name }` → `{ upload_url, file_url }`, then `PUT` the bytes. **The upload's expiry header is `X-Fal-Object-Lifecycle`** (JSON `{ expiration_duration_seconds, initial_acl? }`), not the `-Preference` header used on run requests. |

Adapter: uploads the reference clip once per hour (in-memory URL cache keyed by provider voice id; the upload-initiate call sends `X-Fal-Object-Lifecycle`), chunks each paragraph into sentence groups of 250–350 characters (`chunking.ts`: keeps closing quotes with their sentence, splits over-long sentences at commas then words; a piece under 125 characters joins its shorter neighbour, or the pair is re-split evenly at a sentence, clause or word boundary), fixed seed 1234 for every chunk, joins the WAV chunks with a 120 ms gap, watermark `perth-hosted`. Every URL fal returns (`upload_url`, `file_url`, `audio.url`) must be `https:` on `fal.media`, `fal.ai` or `fal.run` (or a subdomain), and no fetch follows redirects, so a tampered response can't make the server fetch an internal address or send the voice clip elsewhere. The reference clip URL is unauthenticated for its lifetime and fal can't delete it on request; the receipt says when it expires. The self-hosted server avoids this.

### 10.3 Self-hosted Chatterbox (`chatterbox-http`)

Model: https://github.com/resemble-ai/chatterbox (MIT; `pip install chatterbox-tts`; `ChatterboxTTS.from_pretrained(device="cuda")`, `model.generate(text, audio_prompt_path=…, exaggeration=0.5, cfg_weight=0.5)`, `model.sr`; Turbo via `chatterbox.tts_turbo.ChatterboxTurboTTS`; every output carries a PerTh watermark, detectable with `perth.PerthImplicitWatermarker().get_watermark(audio, sample_rate=sr)` → 0.0 or 1.0).

Contract for our small server (`scripts/chatterbox_server.py`; run on Modal or a rented L4 GPU per research §3):

```
POST {CHATTERBOX_URL}/tts            Authorization: Bearer $CHATTERBOX_TOKEN (required, ≥ 32 characters)
  multipart: text (≤ 350 chars), model ("chatterbox" | "chatterbox-turbo"), reference (WAV),
             exaggeration, cfg_weight, temperature, seed
  200 audio/wav (16-bit PCM, model.sr)
      X-Watermark: perth    only if the server re-detected PerTh on its own output (score ≥ 0.5)
GET  {CHATTERBOX_URL}/health  -> { ok, model, device }
```

The server writes the reference to a temp file for `audio_prompt_path`, deletes it in a `finally`, keeps nothing, and logs no text. It **fails closed**: with no token (or one under 32 characters) `/tts` answers 503 and logs an error at startup, so a missing Modal secret leaves a closed server rather than a free voice-cloning endpoint; tokenless mode exists only with `ALLOW_NO_TOKEN_LOCAL=1`, `HOST=127.0.0.1` and a loopback client. Model loading and generation run in a worker thread (`run_in_threadpool`), so `/health` stays responsive and `_gen_lock` serializes generations. The adapter marks audio `perth` only when the header says so, `none` otherwise, and treats `CHATTERBOX_URL` as configured only if it is `https:` or plain `http:` to 127.0.0.1 / ::1 / localhost, so the token and the reference clip never cross a network in cleartext.

### 10.4 Mock

No keys, no network. `createVoice` returns `mock-<hash>`; `synthesize` returns a 16 kHz WAV hum about 60 ms per character (0.4–6 s), pitched per voice. `VOICE_MOCK_DELAY_MS` adds latency to see loading states. Rate $0.

---

## 11. Security and privacy

- **Local only, and locked.** The lab runs only under `next dev`. `npm run voice:dev` (`next dev -H 127.0.0.1`) keeps it on this machine; plain `npm run dev` listens on every interface, so on a shared network prefer `voice:dev`. Either way the lab needs **`VOICE_LAB_SECRET`** (≥ 16 characters, in `.env.local`): typed once on `/voice-lab/unlock`, it sets an httpOnly, SameSite=Strict cookie holding an HMAC of the secret, compared with `timingSafeEqual` over sha256 digests. Every API route answers 404 without it and every page sends you to the unlock page (`lib/voice/lab-access.ts`, `lab-page.ts`). Without a secret configured the lab stays closed. (A Host-header check would not help: curl can send any Host.)
- **Spend guard.** `VOICE_MAX_USD_PER_DAY` (default $5): before a cache miss the audio route sums today's ledger and refuses with `spend_limit` (429) above it. Cached paragraphs always play.
- **Keys.** Only in `.env.local` (gitignored by `.env*`). Adapters read them at call time; they are never returned (a test checks `/providers`), logged, or placed in errors. Provider response bodies never reach an error message, a log, the browser or a file: errors carry the provider id and HTTP status only (tests check both adapters).
- **Owner token.** 32 random bytes, base64url, shown once; only its sha256 is stored; compared in constant time. Carried in the URL fragment and a header, never a path (section 7). Lost links: `npm run voice:owner-link -- <voiceId>` (dev machine, flag on) replaces the hash and prints a new link once.
- **Concurrency.** Every `voice.json` change runs under a per-voice lock (re-read, change, write), so the off switch can't overwrite a new binding, two bindings for one provider can't both land, and a delete (tombstone first) can't miss a provider voice made meanwhile: `addBinding` undoes it at the provider, or queues the undo for retry. Temp files for atomic writes have random names.
- **Names.** The provider sees `gg-<voiceId>`, never the owner's name. Children's real names reach providers only inside chapter text (the guided-reading passages keep the sample names, so the clone's training audio holds none). On our disk they appear only in the consent text and in the cached audio itself (cache metadata stores no text); the deletion receipt replaces them with a placeholder plus a hash. The family file is read at runtime and never logged; the repo stays on the sample family.
- **Child voices.** Attestations are the prototype's only control. Before launch: single-speaker check and speaker match between consent and samples (research §4, consent-record fields 7), plus the COPPA analysis.
- **Consent evidence.** Statement text is rebuilt server-side and must match exactly; the clip must be at least 6 s (the statement takes 8–10 s); the browser's `spokenAt` must fall within 30 minutes before to 2 minutes after the server's clock; `recordSha256` binds voice id, script version, text, spokenAt, receivedAt, audio hash, duration and attestations, and is kept in both consent.json and voice.json, so an edited record shows on the owner page and in the receipt. Not yet: a transcript and script-match check (speech-to-text), an e-signature and written notice naming the vendors (BIPA §15(b), §15(d)); all are pre-launch items for counsel, not prototype blockers.
- **No downloads.** Headers and player settings above, and the audio route serves only the player's `fetch()` (custom header, `Sec-Fetch-Dest: empty`), so opening the URL in a tab (the browser's media viewer has a Save control) gets 403. Documented everywhere as a deterrent, not DRM: anyone can record their speakers.
- **Provider retention.** ElevenLabs keeps history (with text) until we purge it, and may keep voice-derived data up to 3 years (research §4). fal keeps CDN files per the lifecycle header. Self-hosted keeps nothing. This is why the UI must not claim more than "we delete what we hold and instruct the provider to delete theirs" until DPAs exist.
- **Analytics.** The root layout mounts Vercel Analytics and Speed Insights; they do not send from `next dev`, and the lab never runs in production. Moving the owner token out of paths removes the remaining risk.
- **Build tracing.** `chapters.ts` builds paths from `process.cwd()` for `fs.readdir`, which makes Turbopack trace the whole project (the build's import traces show it). Mark those calls `/* turbopackIgnore: true */` or add `outputFileTracingExcludes`, so production bundles don't include `.voice-data/` or `docs/`.

---

## 12. Replacing local storage with Supabase Storage

The engine only talks to `VoiceStorage`, so the swap is one class and a factory change.

```ts
export class SupabaseVoiceStorage implements VoiceStorage {
  constructor(private client: SupabaseClient, private bucket = "voice", private familyId: string) {}
  // key "voices/<id>/consent.wav" -> object "<familyId>/voices/<id>/consent.wav"
  read(key)        { /* storage.from(bucket).download(path) -> Uint8Array | null on 404 */ }
  write(key, data) { /* upload(path, data, { upsert: true, contentType }) */ }
  list(prefix)     { /* storage list is one level deep: recurse into folders */ }
  deletePrefix(p)  { /* list then remove([...paths]) in batches of 1,000 */ }
  appendLine()     { /* not on object storage: ledger moves to a table (below) */ }
}
```

- **Bucket:** private `voice` bucket, service-role access from route handlers only; no public URLs, no signed URLs handed to the browser (audio still streams through our route so the off switch and headers apply).
- **Row-level security:** every object path starts with the family id; policies allow a signed-in parent to reach only their family's prefix.
- **Tables instead of JSON files:** `voice_voices` (VoiceRecord + family_id), `voice_consents` (ConsentRecord, with the audio path), `voice_bindings`, `voice_cache` (CacheMeta, unique on key), `voice_ledger` (LedgerEntry; replaces `appendLine`), `voice_deletions` (receipts). The cache audio stays in the bucket.
- **Encryption:** consent and sample audio encrypted at rest (Supabase default) and, per research, stored separately from the voice record.
- **Delete:** the same order as section 9.5, then a check that `list("<family>/voices/<id>/")` is empty; backups roll off within 30 days (state that in the retention schedule).
- **Owner auth:** the owner token becomes a Supabase auth identity for grandparents (magic link), so "switch it off from her own link" survives a lost link.

---

## 13. Test plan

`npm test` (vitest, Node environment, `lib/**/*.test.ts`, `scripts/**/*.test.ts`). Today: 17 files, 158 tests, all passing. The table below is the original plan; since then the suite also covers: every `/voice-lab` page 404ing with the flag off and redirecting to the unlock page without the lab cookie; every API route 404ing without the cookie; the unlock route; the audio route refusing navigations; the upload size cap; consent spokenAt window, record hash and edit detection; delete with a failing history purge (voice delete still runs), queued retries and the receipt update; fal honest expiry; delete races (binding made during a delete, off switch during a binding, two concurrent bindings, audio landing after the cache sweep); a request arriving while another job writes the cache; rate-limit retries and the `rate_limited` mapping; no provider body in any error; fal URL allowlist and plain-http self-hosted refusal; anti-aliasing in the resampler; short-chunk re-splitting; and GPU-time pricing in `voice:cost`.

| Area | File | Covers | Still to add |
|---|---|---|---|
| Flag | `flag.test.ts` | exactly "true"; off in production; off with `VERCEL_ENV=production` | pages: layout and every `/voice-lab` page call `notFound()` when off |
| Chapter loader | `chapters.test.ts` | front matter, paragraphs, Markdown stripping, pause marker (inline and bare), pause at end, content dir beats fixture, hash changes, bad ids, listing | a real `season-1` chapter once it exists |
| Personalization | `personalize.test.ts` | whole words, possessives, no double swap, child order, no-op, file load, malformed file, consent/label wording | |
| Cache keys | `cache.test.ts` | stable sha256, every input changes it, no boundary confusion | |
| Chunking | `chunking.test.ts` | quotes stay, short paragraphs whole, 250–350 groups, long sentence splits | property test: no chunk > 350, text preserved |
| WAV | `wav.test.ts` | round trip, float encode + downsample, non-WAV rejected, concat gap, trim + reference clip | |
| Consent record | `consent.test.ts` | exact text, ISO times, sha256, audio stored, attestations, token hash only, family names, mismatch/short/unknown refusals | receipt keeps consent text after delete |
| Delete | `delete.test.ts` | provider voice + history, samples, consent, reference, cache (other voice untouched), receipt with no audio, provider failure still deletes locally | |
| Mock end to end | `engine.test.ts` | consent → create → Chapter 1 paragraph by paragraph → cache hit; one generation under a race; per-family cache; off switch incl. cache; refusals | stitching context passed (previous ids < 2 h, neighbours); spend limit |
| Route guards | `routes.test.ts` | route inventory; every handler 404 with flag off; production 404; audio route GET-only; ignores `?text=`; full HTTP flow; Range; cross-site 403; keys not exposed | owner routes with header token |
| Adapters | `elevenlabs.test.ts`, `chatterbox.test.ts` | multipart create, `xi-api-key`, stitching body, v3 drops stitching, model allowlist, char limit, delete + history paging, key never in errors; fal upload once, chunking, headers, WAV join; http multipart + `X-Watermark` | fal **upload** sends `X-Fal-Object-Lifecycle`; fal always sends `audio_url` |
| Cost script | — | — | `scripts/voice-cost.test.ts`: scenario math matches research §3 tables; ledger averages |
| Registry / ledger | — | — | `defaultProviderId` fallback order; `estimateCostUsd` and unknown-model fallback |

Manual checks (first milestone): Chrome and Safari recording at 24 kHz; level meter; Safari playback of WAV via Range; prefetch hides generation time after paragraph 1; Pause & ask stops; the off switch stops playback mid-chapter.

---

## 14. First-milestone runbook

Goal (decisions.md): Jon records the consent statement and samples, a voice is created, and Jon hears Chapter 1 read in it.

1. **Install and check.** `npm install`, then `npm test` (all green), `npx tsc --noEmit`, `npm run build` (must pass with the flag unset; the lab must 404 in `next start`).
2. **`.env.local`** (never committed):
   ```
   VOICE_ENGINE_ENABLED=true
   VOICE_LAB_SECRET=…              # required: at least 16 characters, e.g. `openssl rand -hex 24`
   ELEVENLABS_API_KEY=…            # a Starter/Creator key is fine for internal testing with Jon's own voice
   # ELEVENLABS_MODEL=eleven_multilingual_v2   (or eleven_v3 / eleven_flash_v2_5)
   FAL_KEY=…                       # optional: hosted Chatterbox for the comparison
   # CHATTERBOX_URL=https://…      # optional: self-hosted server (https, or http://127.0.0.1:8000)
   # CHATTERBOX_TOKEN=…            # same token as the server, at least 32 characters
   # VOICE_FAMILY_FILE=/absolute/path/to/family-slots.json   (shape in section 6)
   # STORY_CONTENT_DIR=…           # default docs/redesign/story/season-1
   # VOICE_DATA_DIR=…              # default ./.voice-data
   # VOICE_DEFAULT_PROVIDER=elevenlabs
   # VOICE_MAX_USD_PER_DAY=5
   ```
3. **Chapter 1.** Put the real chapter at `docs/redesign/story/season-1/s1-ch01.md` in the section 6 format. Without it the lab reads the fixture (the canon §8 sample page, about 1,200 characters, not the full chapter).
4. **Dry run with the mock.** `npm run dev` (or `npm run voice:dev`, bound to 127.0.0.1, on a shared network), open `http://localhost:3000/voice-lab`, type the lab secret once, and go through every step choosing only "Mock". Confirm the hum plays paragraph by paragraph, the Pause & ask card appears, the owner link switches it off (playback refuses) and deletes it (receipt shown, `.voice-data/voices/` empty for that id).
5. **Jon's voice.** Quiet room, same mic throughout. Read the consent statement, then all six passages (about 3 minutes) within half an hour of the statement. "Save my recording", save the owner link and tick the box, then choose ElevenLabs (and Chatterbox on fal.ai).
6. **Preview, then Chapter 1.** Listen for drift, clicks at paragraph joins, and the kids' names. Replays should say "cached".
7. **Compare.** `/voice-lab/compare`: the same chapter in ElevenLabs and Chatterbox; note latency, characters and estimated cost.
8. **Cost.** `npm run voice:cost` prints the per-family yearly table from `rates.json` and, once `ledger.jsonl` exists, measured averages per provider and model; self-hosted Chatterbox is also priced from measured GPU time (`--gpu-rate`, default $0.80/h, idle time excluded).
9. **Clean up when done.** Delete test voices from their owner links (this also deletes the ElevenLabs voice and its history). If the receipt says a provider didn't confirm, `npm run voice:purge-pending` retries it (the lab also retries on its own). Keep `.voice-data/` out of git (already ignored).

---

## 15. Open items that are not code

- ElevenLabs written answers (research §5, Q1–7) before any real family.
- Privacy lawyer: what the deletion receipt may keep, consent wording (vendor naming, e-signature), retention schedule (research §4, Q15–22).
- Real Season 1 chapter files in the section 6 format.
