import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getParagraphAudio } from "../engine";
import { CONSENT_SCRIPT_VERSION } from "../consent-text";
import { EMPTY_FAMILY, parseFamily } from "../personalize";
import { createMockProvider } from "../providers/mock";
import { setProvidersForTesting } from "../registry";
import { VoiceProviderError, type DeletionReceipt, type PendingDeletion, type TTSProvider } from "../types";
import {
  addBinding,
  createVoiceRecord,
  deleteVoiceEverywhere,
  findVoiceByToken,
  getVoice,
  retryPendingDeletions,
  setEnabled,
} from "../voices";
import { newVoiceInput, tempStorage } from "./helpers";

let t: ReturnType<typeof tempStorage>;
beforeEach(() => (t = tempStorage()));
afterEach(() => {
  setProvidersForTesting(null);
  t.cleanup();
});

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("delete removes everything", () => {
  it("removes provider voice + history, samples, consent audio, reference and cached audio; keeps an audio-free receipt", async () => {
    const mock = createMockProvider();
    let purged = "";
    const withHistory: TTSProvider = { ...mock, purgeHistory: async (id) => ((purged = id), { deleted: 3 }) };
    setProvidersForTesting([withHistory]);
    const fam = parseFamily({ slots: { eldest: { sample: "Hugh", real: "Samwise" }, youngest: { sample: "Clara", real: "Rosalind" } } });

    // A second voice whose cache must survive.
    const other = await createVoiceRecord(newVoiceInput({ ownerName: "Other Adult" }), t.storage, EMPTY_FAMILY);
    await addBinding(t.storage, other.voice, "mock");

    const input = newVoiceInput({}, fam);
    const { voice, ownerToken } = await createVoiceRecord(input, t.storage, fam);
    await addBinding(t.storage, voice, "mock");
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    for (const id of [voice.id, other.voice.id]) {
      await getParagraphAudio({ voiceId: id, chapterId: "s1-ch01", paragraph: 0 }, deps);
      await getParagraphAudio({ voiceId: id, chapterId: "s1-ch01", paragraph: 1 }, deps);
    }
    const bound = (await getVoice(t.storage, voice.id))!;
    const cacheBefore = await t.storage.list("cache");
    expect(cacheBefore).toHaveLength(8);
    expect(cacheBefore.filter((k) => k.startsWith(`cache/${voice.id}/`))).toHaveLength(4);

    const receipt = await deleteVoiceEverywhere(t.storage, bound);

    expect(mock.calls.deleted).toEqual([bound.bindings[0].providerVoiceId]);
    expect(purged).toBe(bound.bindings[0].providerVoiceId);
    expect(await t.storage.list(`voices/${voice.id}`)).toEqual([]);
    expect(await getVoice(t.storage, voice.id)).toBeNull();
    expect(await findVoiceByToken(t.storage, ownerToken)).toBeNull();
    expect(await t.storage.list("cache")).toHaveLength(4); // only the other voice's
    expect(receipt.cachedFilesDeleted).toBe(4);
    expect(receipt.providerDeletions[0]).toMatchObject({ provider: "mock", voiceDeleted: true, historyItemsDeleted: 3 });
    expect(await t.storage.list("pending-deletions")).toEqual([]);

    const saved = (await t.storage.readJson<DeletionReceipt>(`deletions/${voice.id}.json`))!;
    expect(saved.placeholder).toBe(true);
    expect(saved.placeholderNote).toMatch(/PLACEHOLDER/);
    expect(saved.ownerName).toBe("Jon Tester");
    expect(saved.consentedAt).toBe(input.consent.spokenAt);
    expect(saved.audioHashes.consent).toMatch(/^[0-9a-f]{64}$/);
    expect(saved.audioHashes.samples).toHaveLength(6);
    // "Keep the consent record": its text fields survive, never its audio, and
    // never the children's names (a placeholder plus a hash of the exact words).
    expect(saved.consent).toMatchObject({
      scriptVersion: CONSENT_SCRIPT_VERSION,
      text: "I'm Jon, and I'd like Grit & Grace to make my story voice, only for reading stories to [the children's names]. I can switch it off whenever I want.",
      textSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      spokenAt: input.consent.spokenAt,
      receivedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      audioSha256: saved.audioHashes.consent,
      attestations: { adult: true, ownVoice: true, noChildVoice: true },
      recordSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      recordIntact: true,
    });
    expect(saved.consent!.recordSha256).toBe(bound.consentSha256);
    expect(JSON.stringify(saved)).not.toMatch(/Samwise|Rosalind/);
    expect(JSON.stringify(saved)).not.toMatch(/consent\.wav|RIFF|"audio"\s*:/);
    // Nothing but the receipt is left for this voice anywhere on disk.
    const everything = [
      ...(await t.storage.list("voices")),
      ...(await t.storage.list("cache")),
      ...(await t.storage.list("deletions")),
      ...(await t.storage.list("pending-deletions")),
    ];
    expect(everything.filter((k) => k.includes(voice.id))).toEqual([`deletions/${voice.id}.json`]);
    expect(everything.some((k) => k.startsWith("deletions/") && k.endsWith(".wav"))).toBe(false);
  });

  it("still deletes the provider voice when the history purge fails, and queues the purge for retry", async () => {
    const mock = createMockProvider();
    let purgeCalls = 0;
    setProvidersForTesting([
      {
        ...mock,
        purgeHistory: async () => {
          purgeCalls++;
          if (purgeCalls === 1) throw new VoiceProviderError("mock", "history list failed (429)", 429);
          return { deleted: 5 };
        },
      },
    ]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    const b = await addBinding(t.storage, voice, "mock");
    const receipt = await deleteVoiceEverywhere(t.storage, voice);

    expect(mock.calls.deleted).toEqual([b.providerVoiceId]); // the voice delete still ran
    expect(receipt.providerDeletions[0]).toMatchObject({ voiceDeleted: true, historyError: "HTTP 429", retryPending: true });
    expect(await t.storage.list(`voices/${voice.id}`)).toEqual([]);
    const pending = (await t.storage.readJson<PendingDeletion>(`pending-deletions/${voice.id}.json`))!;
    expect(pending.rows).toMatchObject([{ provider: "mock", providerVoiceId: b.providerVoiceId, attempts: 1, lastError: "HTTP 429" }]);

    expect(await retryPendingDeletions(t.storage)).toEqual({ voices: 1, confirmed: 1, stillPending: 0 });
    expect(await t.storage.list("pending-deletions")).toEqual([]);
    const saved = (await t.storage.readJson<DeletionReceipt>(`deletions/${voice.id}.json`))!;
    expect(saved.providerDeletions[0]).toMatchObject({ voiceDeleted: true, historyItemsDeleted: 5, retryPending: false });
    expect(saved.providerDeletions[0].historyError).toBeUndefined();
  });

  it("queues a failed provider voice delete (status only, no provider body) and confirms it on retry", async () => {
    const mock = createMockProvider();
    let fail = true;
    setProvidersForTesting([
      {
        ...mock,
        deleteVoice: async (id) => {
          if (fail) throw new VoiceProviderError("mock", "voice delete failed (500)", 500);
          return mock.deleteVoice(id);
        },
      },
    ]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    const b = await addBinding(t.storage, voice, "mock");
    const receipt = await deleteVoiceEverywhere(t.storage, (await getVoice(t.storage, voice.id))!);
    expect(receipt.providerDeletions[0]).toMatchObject({ voiceDeleted: false, error: "HTTP 500", retryPending: true });
    expect(await t.storage.list(`voices/${voice.id}`)).toEqual([]);
    expect(await t.storage.exists(`pending-deletions/${voice.id}.json`)).toBe(true);

    expect(await retryPendingDeletions(t.storage)).toEqual({ voices: 1, confirmed: 0, stillPending: 1 });
    expect((await t.storage.readJson<PendingDeletion>(`pending-deletions/${voice.id}.json`))!.rows[0].attempts).toBe(2);
    fail = false;
    expect(await retryPendingDeletions(t.storage)).toEqual({ voices: 1, confirmed: 1, stillPending: 0 });
    expect(mock.calls.deleted).toEqual([b.providerVoiceId]);
    const saved = (await t.storage.readJson<DeletionReceipt>(`deletions/${voice.id}.json`))!;
    expect(saved.providerDeletions[0]).toMatchObject({ voiceDeleted: true, retryPending: false, retriedAt: expect.any(String) });
  });

  it("reports a provider copy that only expires (fal) honestly, without queueing it", async () => {
    const mock = createMockProvider();
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();
    setProvidersForTesting([{ ...mock, deleteVoice: async () => ({ deleted: false, expiresAt, detail: "expires on its own" }) }]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    await addBinding(t.storage, voice, "mock");
    const receipt = await deleteVoiceEverywhere(t.storage, voice);
    expect(receipt.providerDeletions[0]).toMatchObject({ voiceDeleted: false, expiresAt });
    expect(receipt.providerDeletions[0].retryPending).toBeUndefined();
    expect(await t.storage.list("pending-deletions")).toEqual([]);
  });
});

describe("delete races", () => {
  it("a provider voice made while a delete runs is rolled back, never orphaned", async () => {
    const mock = createMockProvider();
    const creating = deferred();
    const release = deferred();
    setProvidersForTesting([
      {
        ...mock,
        async createVoice(input) {
          creating.resolve();
          await release.promise;
          return mock.createVoice(input);
        },
      },
    ]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    const binding = addBinding(t.storage, voice, "mock");
    await creating.promise; // createVoice is in flight at the provider
    const receipt = await deleteVoiceEverywhere(t.storage, voice);
    expect(receipt.providerDeletions).toEqual([]); // nothing was bound yet
    release.resolve();
    await expect(binding).rejects.toMatchObject({ code: "voice_not_found" });
    // The clone made meanwhile was deleted at the provider, and no record came back.
    expect(mock.calls.created).toHaveLength(1);
    expect(mock.calls.deleted).toHaveLength(1);
    expect(await getVoice(t.storage, voice.id)).toBeNull();
    expect(await t.storage.list(`voices/${voice.id}`)).toEqual([]);
  });

  it("the off switch during addBinding doesn't lose the binding", async () => {
    const mock = createMockProvider();
    const creating = deferred();
    const release = deferred();
    setProvidersForTesting([
      {
        ...mock,
        async createVoice(input) {
          creating.resolve();
          await release.promise;
          return mock.createVoice(input);
        },
      },
    ]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    const binding = addBinding(t.storage, voice, "mock");
    await creating.promise;
    await setEnabled(t.storage, voice, false); // uses a stale copy with no bindings
    release.resolve();
    await binding;
    const after = (await getVoice(t.storage, voice.id))!;
    expect(after.enabled).toBe(false);
    expect(after.bindings).toHaveLength(1);
    // And a delete now reaches that provider voice.
    await deleteVoiceEverywhere(t.storage, voice);
    expect(mock.calls.deleted).toEqual([after.bindings[0].providerVoiceId]);
  });

  it("two concurrent bindings for one provider make one binding", async () => {
    const mock = createMockProvider();
    setProvidersForTesting([mock]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    const results = await Promise.allSettled([addBinding(t.storage, voice, "mock"), addBinding(t.storage, voice, "mock")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({ reason: { code: "already_bound" } });
    expect((await getVoice(t.storage, voice.id))!.bindings).toHaveLength(1);
    expect(mock.calls.created.length - mock.calls.deleted.length).toBe(1); // no orphan
  });

  it("audio generated while a delete runs never stays in the cache", async () => {
    const mock = createMockProvider();
    const synthesizing = deferred();
    const release = deferred();
    setProvidersForTesting([
      {
        ...mock,
        async synthesize(req) {
          synthesizing.resolve();
          await release.promise;
          return mock.synthesize(req);
        },
      },
    ]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    await addBinding(t.storage, voice, "mock");
    const gen = getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, { storage: t.storage, family: EMPTY_FAMILY });
    await synthesizing.promise;
    await deleteVoiceEverywhere(t.storage, voice);
    release.resolve();
    await expect(gen).rejects.toMatchObject({ code: "voice_not_found" });
    expect(await t.storage.list("cache")).toEqual([]);
    // The spend is still on the ledger: the provider billed it.
    expect((await t.storage.read("ledger.jsonl"))?.length).toBeGreaterThan(0);
  });

  it("cache files that land after the delete's sweep are removed by the generation itself", async () => {
    const mock = createMockProvider();
    setProvidersForTesting([mock]);
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
    await addBinding(t.storage, voice, "mock");
    // Hold the generation right at its first cache write, run the whole delete, then let it write.
    const atWrite = deferred();
    const release = deferred();
    const storage = Object.create(t.storage) as typeof t.storage;
    storage.writeJson = async (key, value) => {
      if (key.startsWith("cache/")) {
        atWrite.resolve();
        await release.promise;
      }
      return t.storage.writeJson(key, value);
    };
    const gen = getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 0 }, { storage, family: EMPTY_FAMILY });
    await atWrite.promise;
    await deleteVoiceEverywhere(t.storage, voice);
    release.resolve();
    await expect(gen).rejects.toMatchObject({ code: "voice_not_found" });
    expect(await t.storage.list("cache")).toEqual([]);
  });
});
