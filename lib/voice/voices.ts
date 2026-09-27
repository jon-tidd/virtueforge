import { randomBytes, timingSafeEqual } from "node:crypto";
import { cacheDir, sha256Hex } from "./cache";
import { buildConsentStatement, CONSENT_SCRIPT_VERSION, redactChildren, voiceLabel } from "./consent-text";
import { minConsentSeconds, minSampleSeconds, SPOKEN_AT_MAX_AGE_MS, SPOKEN_AT_MAX_AHEAD_MS } from "./config";
import { VoiceError } from "./errors";
import { getPassage } from "./guided-reading";
import { childrenPhrase, type Family } from "./personalize";
import { safeStatus } from "./providers/fetch-util";
import { getProvider } from "./registry";
import type { VoiceStorage } from "./storage";
import { decodeWav, durationSeconds, pickReferenceClip } from "./wav";
import type {
  CacheMeta,
  ConsentRecord,
  DeletionConsent,
  DeletionReceipt,
  PendingDeletion,
  ProviderBinding,
  ProviderDeletionRow,
  ProviderId,
  SampleRecord,
  VoiceRecord,
} from "./types";
import { VoiceProviderError } from "./types";

// The voice record: who recorded, their consent, their samples, and the
// provider voices made from them. See engine-design.md, "Data model on disk".
//
// Concurrency: every change to voice.json happens inside withVoiceLock(id),
// which re-reads the record, changes it and writes it back, so an off switch
// can't overwrite a binding being added and two bindings can't race. A delete
// holds the lock from start to finish and writes a tombstone (`deleting`)
// first; addBinding checks the record under the same lock after its provider
// call and undoes the new provider voice if the record is gone or tombstoned.
// The engine (which never takes the lock) refuses tombstoned voices and
// re-checks after writing to the cache (engine.ts). One dev-server process is
// assumed; a Supabase version would use a row lock instead.

export const VOICE_ID_RE = /^v_[A-Za-z0-9_-]{12}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const MAX_CONSENT_BYTES = 10 * 1024 * 1024;
const MAX_SAMPLE_BYTES = 25 * 1024 * 1024;

export const DELETION_PLACEHOLDER_NOTE =
  "PLACEHOLDER, pending the privacy lawyer's call. What (if anything) we keep after a " +
  "delete is not decided: decisions.md says both 'delete removes everything' and 'keep " +
  "the consent record'. This receipt keeps no audio: only who, when, the consent " +
  "statement's text, script version, timestamps and attestations, and audio hashes " +
  "(provider-research.md, open question 18).";

const voiceKey = (id: string) => `voices/${id}/voice.json`;
const pendingKey = (id: string) => `pending-deletions/${id}.json`;

// ---------------------------------------------------------------------------
// Per-voice lock
// ---------------------------------------------------------------------------

const locks = new Map<string, Promise<void>>();

/** Runs fn with this voice's lock held. Calls for one voice run one at a time, in order. */
export async function withVoiceLock<T>(voiceId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(voiceId) ?? Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((r) => (release = r));
  const tail = prev.then(() => mine);
  locks.set(voiceId, tail);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(voiceId) === tail) locks.delete(voiceId);
  }
}

// ---------------------------------------------------------------------------
// Consent record integrity
// ---------------------------------------------------------------------------

type HashedConsentFields = Pick<
  ConsentRecord,
  "voiceId" | "scriptVersion" | "text" | "spokenAt" | "receivedAt" | "audioSha256" | "audioSeconds" | "attestations"
>;

/** sha256 of the canonical JSON of the consent fields that matter (fixed order, no whitespace). */
export function consentRecordSha256(c: HashedConsentFields): string {
  const a = c.attestations;
  return sha256Hex(
    JSON.stringify([
      "gg-consent-record-v1",
      c.voiceId,
      c.scriptVersion,
      c.text,
      c.spokenAt,
      c.receivedAt,
      c.audioSha256,
      c.audioSeconds,
      [a.adult, a.ownVoice, a.noChildVoice, a.attestedAt],
    ]),
  );
}

export interface NewVoiceInput {
  ownerName: string;
  relationship: string;
  attestAdult: boolean;
  attestOwnVoice: boolean;
  attestNoChildVoice: boolean;
  consent: { text: string; scriptVersion: string; spokenAt: string; audio: Uint8Array };
  samples: Array<{ passageId: string; audio: Uint8Array }>;
  userAgent?: string;
}

export type PublicVoice = Omit<VoiceRecord, "ownerTokenHash">;

export function toPublic(v: VoiceRecord): PublicVoice {
  const { ownerTokenHash: _omit, ...rest } = v;
  void _omit;
  return rest;
}

function cleanName(s: unknown, max: number, field: string): string {
  if (typeof s !== "string") throw new VoiceError("bad_request", `${field} is required`);
  const t = s.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (!t || t.length > max) throw new VoiceError("bad_request", `${field} must be 1–${max} characters`);
  return t;
}

function checkWav(bytes: Uint8Array, what: string, maxBytes: number): number {
  if (bytes.length > maxBytes) throw new VoiceError("bad_audio", `${what} is too large`);
  const pcm = decodeWav(bytes);
  if (!pcm) throw new VoiceError("bad_audio", `${what} is not a 16-bit PCM WAV`);
  if (pcm.channels !== 1) throw new VoiceError("bad_audio", `${what} must be mono`);
  return durationSeconds(pcm);
}

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(s) && !Number.isNaN(Date.parse(s));
}

async function writeVoice(storage: VoiceStorage, v: VoiceRecord): Promise<void> {
  await storage.writeJson(voiceKey(v.id), v);
}

/** Step 1–3 of the flow: stores who, their spoken consent and their samples. No provider calls. */
export async function createVoiceRecord(
  input: NewVoiceInput,
  storage: VoiceStorage,
  family: Family,
): Promise<{ voice: VoiceRecord; ownerToken: string }> {
  const ownerName = cleanName(input.ownerName, 60, "ownerName");
  const relationship = cleanName(input.relationship, 40, "relationship");
  if (input.attestAdult !== true || input.attestOwnVoice !== true || input.attestNoChildVoice !== true) {
    throw new VoiceError(
      "adult_own_voice_required",
      "Only an adult can make a story voice, only from their own voice, and never from a child's voice.",
    );
  }

  const expected = buildConsentStatement(ownerName, childrenPhrase(family));
  if (input.consent.scriptVersion !== CONSENT_SCRIPT_VERSION || input.consent.text !== expected) {
    throw new VoiceError("consent_text_mismatch", "The consent statement doesn't match the current script.");
  }
  if (!isIsoDate(input.consent.spokenAt)) throw new VoiceError("bad_request", "spokenAt must be an ISO date");
  // spokenAt comes from the browser's clock: accept it only close to ours.
  const receivedMs = Date.now();
  const spokenMs = Date.parse(input.consent.spokenAt);
  if (spokenMs > receivedMs + SPOKEN_AT_MAX_AHEAD_MS) {
    throw new VoiceError("bad_request", "The consent time is in the future. Check this device's clock and record it again.");
  }
  if (spokenMs < receivedMs - SPOKEN_AT_MAX_AGE_MS) {
    throw new VoiceError(
      "consent_stale",
      "Your permission recording is more than 30 minutes old. Please read the statement again, then make the voice.",
    );
  }
  const consentSeconds = checkWav(input.consent.audio, "consent recording", MAX_CONSENT_BYTES);
  if (consentSeconds < minConsentSeconds()) {
    throw new VoiceError("not_enough_audio", "The consent recording is too short. Please read the whole statement.");
  }

  if (input.samples.length === 0) throw new VoiceError("not_enough_audio", "No guided-reading samples");
  const seen = new Set<string>();
  let total = 0;
  const sampleSeconds: number[] = [];
  for (const s of input.samples) {
    if (!getPassage(s.passageId)) throw new VoiceError("bad_request", `unknown passage: ${s.passageId}`);
    if (seen.has(s.passageId)) throw new VoiceError("bad_request", `duplicate passage: ${s.passageId}`);
    seen.add(s.passageId);
    const secs = checkWav(s.audio, `sample ${s.passageId}`, MAX_SAMPLE_BYTES);
    sampleSeconds.push(secs);
    total += secs;
  }
  if (total < minSampleSeconds()) {
    throw new VoiceError(
      "not_enough_audio",
      `We need at least ${Math.round(minSampleSeconds())} seconds of reading (got ${Math.round(total)}).`,
    );
  }

  const id = `v_${randomBytes(9).toString("base64url")}`;
  const ownerToken = randomBytes(32).toString("base64url");
  const now = new Date(receivedMs).toISOString();
  const dir = `voices/${id}`;

  await storage.write(`${dir}/consent.wav`, input.consent.audio);
  const fields: HashedConsentFields = {
    voiceId: id,
    scriptVersion: CONSENT_SCRIPT_VERSION,
    text: expected,
    spokenAt: input.consent.spokenAt,
    receivedAt: now,
    audioSha256: sha256Hex(input.consent.audio),
    audioSeconds: Math.round(consentSeconds * 10) / 10,
    attestations: { adult: true, ownVoice: true, noChildVoice: true, attestedAt: now },
  };
  const recordSha256 = consentRecordSha256(fields);
  const consent: ConsentRecord = {
    ...fields,
    audioFile: "consent.wav",
    userAgent: input.userAgent?.slice(0, 300),
    recordSha256,
  };
  await storage.writeJson(`${dir}/consent.json`, consent);

  const samples: SampleRecord[] = [];
  for (const [i, s] of input.samples.entries()) {
    const file = `samples/${s.passageId}.wav`;
    await storage.write(`${dir}/${file}`, s.audio);
    samples.push({ passageId: s.passageId, file, sha256: sha256Hex(s.audio), seconds: Math.round(sampleSeconds[i] * 10) / 10 });
  }
  await storage.writeJson(`${dir}/samples.json`, samples);
  await storage.write(`${dir}/reference.wav`, pickReferenceClip(input.samples.map((s) => s.audio)));

  const voice: VoiceRecord = {
    id,
    ownerName,
    relationship,
    label: voiceLabel(ownerName),
    enabled: true,
    ownerTokenHash: sha256Hex(ownerToken),
    bindings: [],
    consentSha256: recordSha256,
    createdAt: now,
    updatedAt: now,
  };
  await writeVoice(storage, voice);
  return { voice, ownerToken };
}

export async function getVoice(storage: VoiceStorage, id: string): Promise<VoiceRecord | null> {
  if (!VOICE_ID_RE.test(id)) return null;
  return storage.readJson<VoiceRecord>(voiceKey(id));
}

/** Voices on this machine, newest first. Voices being deleted are left out unless asked for. */
export async function listVoices(storage: VoiceStorage, opts: { includeDeleting?: boolean } = {}): Promise<VoiceRecord[]> {
  const keys = (await storage.list("voices")).filter((k) => /^voices\/[^/]+\/voice\.json$/.test(k));
  const out: VoiceRecord[] = [];
  for (const k of keys) {
    const v = await storage.readJson<VoiceRecord>(k);
    if (v && (opts.includeDeleting || !v.deleting)) out.push(v);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function tokenMatches(token: string, hash: string): boolean {
  if (!TOKEN_RE.test(token)) return false;
  const a = Buffer.from(sha256Hex(token), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function findVoiceByToken(storage: VoiceStorage, token: string): Promise<VoiceRecord | null> {
  if (!TOKEN_RE.test(token)) return null;
  // A voice whose delete was interrupted still opens, so its owner can finish the delete.
  for (const v of await listVoices(storage, { includeDeleting: true })) if (tokenMatches(token, v.ownerTokenHash)) return v;
  return null;
}

export async function requireOwner(storage: VoiceStorage, voiceId: string, token: string): Promise<VoiceRecord> {
  const v = await getVoice(storage, voiceId);
  if (!v) throw new VoiceError("voice_not_found", "No such voice");
  if (!tokenMatches(token, v.ownerTokenHash)) throw new VoiceError("unauthorized", "Owner link required");
  return v;
}

export async function readConsent(storage: VoiceStorage, voiceId: string): Promise<ConsentRecord | null> {
  return storage.readJson<ConsentRecord>(`voices/${voiceId}/consent.json`);
}

/**
 * The consent record plus whether it is still what was stored: its own hash
 * must match its fields, and voice.json must hold the same hash.
 */
export async function readConsentChecked(
  storage: VoiceStorage,
  voice: Pick<VoiceRecord, "id" | "consentSha256">,
): Promise<{ record: ConsentRecord; intact: boolean } | null> {
  const record = await readConsent(storage, voice.id);
  if (!record) return null;
  let intact = false;
  try {
    intact =
      typeof record.recordSha256 === "string" &&
      record.voiceId === voice.id &&
      consentRecordSha256(record) === record.recordSha256 &&
      voice.consentSha256 === record.recordSha256;
  } catch {
    intact = false;
  }
  return { record, intact };
}

// ---------------------------------------------------------------------------
// Provider voices
// ---------------------------------------------------------------------------

const bindingInFlight = new Set<string>();

/**
 * Undo a provider voice we just made but can't keep (the record was deleted,
 * tombstoned, or already has one). If the provider delete fails it goes to the
 * pending-deletions retry queue, so it is never silently orphaned.
 */
async function discardProviderVoice(storage: VoiceStorage, voiceId: string, provider: ProviderId, providerVoiceId: string) {
  const row = await deleteAtProvider({ provider, providerVoiceId, createdAt: "" });
  if (!row.voiceDeleted && !row.expiresAt) await queuePendingDeletion(storage, voiceId, [row]);
}

/** Step 4: makes the provider voice from the stored samples. */
export async function addBinding(
  storage: VoiceStorage,
  voice: Pick<VoiceRecord, "id">,
  providerId: ProviderId,
): Promise<ProviderBinding> {
  const provider = getProvider(providerId);
  if (!provider.isConfigured()) throw new VoiceError("provider_not_configured", `${provider.label} has no key/URL in .env.local`);
  const current = await getVoice(storage, voice.id);
  if (!current || current.deleting) throw new VoiceError("voice_not_found", "No such voice");
  if (current.bindings.some((b) => b.provider === providerId)) {
    throw new VoiceError("already_bound", `This voice already has a ${provider.label} version`);
  }
  const flight = `${voice.id}|${providerId}`;
  if (bindingInFlight.has(flight)) throw new VoiceError("already_bound", `A ${provider.label} version is being made right now`);
  bindingInFlight.add(flight);
  try {
    const dir = `voices/${voice.id}`;
    const samples = (await storage.readJson<SampleRecord[]>(`${dir}/samples.json`)) ?? [];
    const sampleAudio = [];
    for (const s of samples) {
      const data = await storage.read(`${dir}/${s.file}`);
      if (data) sampleAudio.push({ filename: `${s.passageId}.wav`, contentType: "audio/wav", data });
    }
    const reference = await storage.read(`${dir}/reference.wav`);
    if (!reference || sampleAudio.length === 0) throw new VoiceError("bad_audio", "Stored samples are missing");

    let created;
    try {
      created = await provider.createVoice({
        // Neutral name: the owner's real name never goes to the provider.
        name: `gg-${voice.id}`,
        description: "Grit & Grace prototype story voice. Consent recorded and stored by Grit & Grace.",
        samples: sampleAudio,
        referenceClip: { filename: "reference.wav", contentType: "audio/wav", data: reference },
      });
    } catch (e) {
      throw providerErrorToVoiceError(e, providerId, "voice create failed");
    }
    const binding: ProviderBinding = {
      provider: providerId,
      providerVoiceId: created.providerVoiceId,
      createdAt: new Date().toISOString(),
      ...(created.requiresVerification ? { requiresVerification: true } : {}),
    };

    // Under the lock: re-read, and keep the new provider voice only if the
    // record is still there, not being deleted, and has no binding for it yet.
    const outcome = await withVoiceLock(voice.id, async () => {
      const fresh = await getVoice(storage, voice.id);
      if (!fresh || fresh.deleting) return "gone" as const;
      if (fresh.bindings.some((b) => b.provider === providerId)) return "duplicate" as const;
      fresh.bindings.push(binding);
      fresh.updatedAt = binding.createdAt;
      await writeVoice(storage, fresh);
      return "kept" as const;
    });
    if (outcome !== "kept") {
      await discardProviderVoice(storage, voice.id, providerId, created.providerVoiceId);
      if (outcome === "gone") throw new VoiceError("voice_not_found", "The voice was deleted while it was being made");
      throw new VoiceError("already_bound", `This voice already has a ${provider.label} version`);
    }
    return binding;
  } finally {
    bindingInFlight.delete(flight);
  }
}

/** A provider failure as a VoiceError the API can show: provider id and status only. */
export function providerErrorToVoiceError(e: unknown, providerId: ProviderId, fallback: string): VoiceError {
  if (e instanceof VoiceError) return e;
  if (e instanceof VoiceProviderError && e.status === 429) {
    return new VoiceError("rate_limited", `${providerId}: busy right now (429). Try again in a moment.`);
  }
  return new VoiceError("provider_error", e instanceof VoiceProviderError ? e.message : `${providerId}: ${fallback}`);
}

/** The owner's off switch. Off stops all playback, cached audio included. */
export async function setEnabled(storage: VoiceStorage, voice: Pick<VoiceRecord, "id">, enabled: boolean): Promise<VoiceRecord> {
  return withVoiceLock(voice.id, async () => {
    const fresh = await getVoice(storage, voice.id);
    if (!fresh || fresh.deleting) throw new VoiceError("voice_not_found", "No such voice");
    const updated = { ...fresh, enabled, updatedAt: new Date().toISOString() };
    await writeVoice(storage, updated);
    return updated;
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * History purge and voice delete, each in its own try: a failed purge (a 429,
 * a key without history permission) never stops the voice delete. Errors are
 * stored as "HTTP <status>" only.
 */
async function deleteAtProvider(b: ProviderBinding): Promise<ProviderDeletionRow> {
  const row: ProviderDeletionRow = { provider: b.provider, providerVoiceId: b.providerVoiceId, voiceDeleted: false };
  let p;
  try {
    p = getProvider(b.provider);
  } catch {
    row.error = "unknown provider";
    return row;
  }
  if (p.purgeHistory) {
    try {
      row.historyItemsDeleted = (await p.purgeHistory(b.providerVoiceId)).deleted;
    } catch (e) {
      row.historyError = safeStatus(e);
    }
  }
  try {
    const r = await p.deleteVoice(b.providerVoiceId);
    row.voiceDeleted = r.deleted;
    if (r.expiresAt) row.expiresAt = r.expiresAt;
    if (r.detail) row.detail = r.detail;
  } catch (e) {
    row.error = safeStatus(e);
  }
  return row;
}

/** A row still needs work: the voice isn't confirmed gone (and won't expire by itself), or history wasn't purged. */
function needsRetry(r: ProviderDeletionRow): boolean {
  return (!r.voiceDeleted && !r.expiresAt) || Boolean(r.historyError);
}

async function queuePendingDeletion(storage: VoiceStorage, voiceId: string, rows: ProviderDeletionRow[]): Promise<void> {
  const now = new Date().toISOString();
  const existing = await storage.readJson<PendingDeletion>(pendingKey(voiceId));
  const out: PendingDeletion = existing ?? { voiceId, since: now, rows: [] };
  for (const r of rows) {
    const lastError = r.error ?? r.historyError;
    const prev = out.rows.find((x) => x.provider === r.provider && x.providerVoiceId === r.providerVoiceId);
    if (prev) Object.assign(prev, { attempts: prev.attempts + 1, lastTriedAt: now, lastError });
    else out.rows.push({ provider: r.provider, providerVoiceId: r.providerVoiceId, attempts: 1, lastTriedAt: now, lastError });
  }
  await storage.writeJson(pendingKey(voiceId), out);
}

/**
 * Delete removes everything: every provider voice (and its provider history),
 * the samples, the consent audio, the reference clip, and every cached
 * paragraph made in this voice. Only a text receipt with no audio (and no
 * children's names) is kept, a placeholder until the privacy lawyer decides.
 * Provider deletes that fail are queued in pending-deletions/ and retried
 * (retryPendingDeletions) before local data goes, so nothing is orphaned.
 */
export async function deleteVoiceEverywhere(storage: VoiceStorage, voiceRef: Pick<VoiceRecord, "id">): Promise<DeletionReceipt> {
  const id = voiceRef.id;
  return withVoiceLock(id, async () => {
    const current = await getVoice(storage, id);
    if (!current) throw new VoiceError("voice_not_found", "No such voice");
    const dir = `voices/${id}`;

    // Tombstone first: from here nothing plays, is generated, cached or bound.
    const startedAt = new Date().toISOString();
    const tomb: VoiceRecord = { ...current, enabled: false, deleting: current.deleting ?? startedAt, updatedAt: startedAt };
    await writeVoice(storage, tomb);

    const checked = await readConsentChecked(storage, tomb);
    const samples = (await storage.readJson<SampleRecord[]>(`${dir}/samples.json`)) ?? [];
    const reference = await storage.read(`${dir}/reference.wav`);

    const providerDeletions: ProviderDeletionRow[] = [];
    const done = new Set<string>();
    const deleteBindings = async (bindings: ProviderBinding[]) => {
      for (const b of bindings) {
        const k = `${b.provider}|${b.providerVoiceId}`;
        if (done.has(k)) continue;
        done.add(k);
        providerDeletions.push(await deleteAtProvider(b));
      }
    };
    await deleteBindings(tomb.bindings);
    // Read the record once more right before wiping, in case anything was
    // added outside this process's lock.
    const again = await getVoice(storage, id);
    if (again) await deleteBindings(again.bindings);

    const failed = providerDeletions.filter(needsRetry);
    if (failed.length) {
      await queuePendingDeletion(storage, id, failed);
      for (const r of failed) r.retryPending = true;
    }

    let cachedFilesDeleted = await storage.deletePrefix(cacheDir(id));
    // Older builds kept the cache flat (cache/<key>.*): sweep those too.
    for (const k of (await storage.list("cache")).filter((k) => /^cache\/[^/]+\.json$/.test(k))) {
      const meta = await storage.readJson<CacheMeta>(k);
      if (!meta || meta.voiceId !== id) continue;
      if (await storage.delete(`cache/${meta.key}.${meta.ext}`)) cachedFilesDeleted++;
      if (await storage.delete(k)) cachedFilesDeleted++;
    }

    const localFilesDeleted = await storage.deletePrefix(`${dir}/`);

    const consent = checked?.record ?? null;
    let receiptConsent: DeletionConsent | null = null;
    if (consent) {
      receiptConsent = {
        scriptVersion: consent.scriptVersion,
        text: redactChildren(consent.text) ?? "[statement withheld: it didn't match the script's shape]",
        textSha256: sha256Hex(consent.text),
        spokenAt: consent.spokenAt,
        receivedAt: consent.receivedAt,
        audioSha256: consent.audioSha256,
        audioSeconds: consent.audioSeconds,
        attestations: consent.attestations,
        recordSha256: typeof consent.recordSha256 === "string" ? consent.recordSha256 : null,
        recordIntact: checked?.intact ?? false,
      };
    }

    const receipt: DeletionReceipt = {
      placeholder: true,
      placeholderNote: DELETION_PLACEHOLDER_NOTE,
      voiceId: id,
      ownerName: current.ownerName,
      consentedAt: consent?.spokenAt ?? null,
      consent: receiptConsent,
      deletedAt: new Date().toISOString(),
      audioHashes: {
        consent: consent?.audioSha256 ?? null,
        samples: samples.map((s) => s.sha256),
        reference: reference ? sha256Hex(reference) : null,
      },
      providerDeletions,
      cachedFilesDeleted,
      localFilesDeleted,
    };
    await storage.writeJson(`deletions/${id}.json`, receipt);
    return receipt;
  });
}

// ---------------------------------------------------------------------------
// Pending provider deletions (retry queue)
// ---------------------------------------------------------------------------

export interface RetrySummary {
  voices: number;
  confirmed: number;
  stillPending: number;
}

/**
 * Retries every queued provider delete (history purge and voice delete). Rows
 * that succeed leave the queue, and the deletion receipt is updated. Runs from
 * the lab (at most every 10 minutes, see retryPendingDeletionsSoon) and from
 * `npm run voice:purge-pending`.
 */
export async function retryPendingDeletions(storage: VoiceStorage): Promise<RetrySummary> {
  const summary: RetrySummary = { voices: 0, confirmed: 0, stillPending: 0 };
  const files = (await storage.list("pending-deletions")).filter((k) => /^pending-deletions\/v_[A-Za-z0-9_-]{12}\.json$/.test(k));
  for (const file of files) {
    const pending = await storage.readJson<PendingDeletion>(file);
    if (!pending?.rows?.length) {
      await storage.delete(file);
      continue;
    }
    summary.voices++;
    const receiptKey = `deletions/${pending.voiceId}.json`;
    const receipt = await storage.readJson<DeletionReceipt>(receiptKey);
    const left: PendingDeletion["rows"] = [];
    for (const r of pending.rows) {
      const row = await deleteAtProvider({ provider: r.provider, providerVoiceId: r.providerVoiceId, createdAt: "" });
      const now = new Date().toISOString();
      const rr = receipt?.providerDeletions.find((x) => x.provider === r.provider && x.providerVoiceId === r.providerVoiceId);
      if (needsRetry(row)) {
        left.push({ ...r, attempts: r.attempts + 1, lastTriedAt: now, lastError: row.error ?? row.historyError });
        summary.stillPending++;
      } else {
        summary.confirmed++;
        if (rr) {
          Object.assign(rr, { voiceDeleted: row.voiceDeleted, retriedAt: now, retryPending: false });
          if (row.expiresAt) rr.expiresAt = row.expiresAt;
          if (typeof row.historyItemsDeleted === "number") rr.historyItemsDeleted = (rr.historyItemsDeleted ?? 0) + row.historyItemsDeleted;
          delete rr.error;
          delete rr.historyError;
        }
      }
    }
    if (left.length) await storage.writeJson(file, { ...pending, rows: left });
    else await storage.delete(file);
    if (receipt) await storage.writeJson(receiptKey, receipt);
  }
  return summary;
}

let lastRetryAt = 0;
let retryRunning: Promise<RetrySummary> | null = null;

/** Fire-and-forget retry, at most every 10 minutes per process. Never throws. */
export function retryPendingDeletionsSoon(storage: VoiceStorage, minIntervalMs = 10 * 60 * 1000): void {
  if (retryRunning || Date.now() - lastRetryAt < minIntervalMs) return;
  lastRetryAt = Date.now();
  retryRunning = retryPendingDeletions(storage)
    .catch((e) => {
      console.error("[voice] pending provider deletions retry failed:", e instanceof Error ? e.name : typeof e);
      return { voices: 0, confirmed: 0, stillPending: 0 };
    })
    .finally(() => {
      retryRunning = null;
    });
}
