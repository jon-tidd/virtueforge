import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getParagraphAudio, waitForHistoryPurges } from "../engine";
import { loadChapter } from "../chapters";
import { EMPTY_FAMILY } from "../personalize";
import { createMockProvider } from "../providers/mock";
import { setProvidersForTesting } from "../registry";
import type { CacheMeta, TTSProvider } from "../types";
import { addBinding, createVoiceRecord, getVoice } from "../voices";
import { newVoiceInput, tempStorage } from "./helpers";

let t: ReturnType<typeof tempStorage>;
const env = { ...process.env };
beforeEach(() => (t = tempStorage()));
afterEach(async () => {
  await waitForHistoryPurges();
  process.env = { ...env };
  setProvidersForTesting(null);
  t.cleanup();
});

/** The mock, but claiming stitching support and returning request ids like ElevenLabs. */
function stitchingMock() {
  const mock = createMockProvider();
  let n = 0;
  const purged: string[] = [];
  const provider: TTSProvider = {
    ...mock,
    capabilities: { ...mock.capabilities, stitching: true },
    async synthesize(req) {
      const out = await mock.synthesize(req);
      return { ...out, requestId: `req-${n++}` };
    },
    async purgeHistory(id) {
      purged.push(id);
      return { deleted: 7 };
    },
  };
  return { mock, provider, purged };
}

async function makeVoice() {
  const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, EMPTY_FAMILY);
  await addBinding(t.storage, voice, "mock");
  return (await getVoice(t.storage, voice.id))!;
}

describe("engine request stitching", () => {
  it("passes neighbour text and up to 3 recent request ids of the preceding paragraphs", async () => {
    const { mock, provider } = stitchingMock();
    setProvidersForTesting([provider]);
    const voice = await makeVoice();
    const chapter = await loadChapter("s1-ch01");
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    const metas: CacheMeta[] = [];
    for (let i = 0; i < 5; i++) metas.push((await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: i }, deps)).meta);

    const ctx = mock.calls.synthesized.map((r) => r.context!);
    expect(ctx[0]).toEqual({ previousText: undefined, nextText: chapter.paragraphs[1], previousRequestIds: [] });
    expect(ctx[1]).toEqual({ previousText: chapter.paragraphs[0], nextText: chapter.paragraphs[2], previousRequestIds: ["req-0"] });
    expect(ctx[3].previousRequestIds).toEqual(["req-0", "req-1", "req-2"]);
    expect(ctx[4].previousRequestIds).toEqual(["req-1", "req-2", "req-3"]); // at most 3, nearest last
    expect(metas.map((m) => m.requestId)).toEqual(["req-0", "req-1", "req-2", "req-3", "req-4"]);
  });

  it("drops request ids older than two hours (and anything before them)", async () => {
    const { mock, provider } = stitchingMock();
    setProvidersForTesting([provider]);
    const voice = await makeVoice();
    const deps = { storage: t.storage, family: EMPTY_FAMILY };
    const metas: CacheMeta[] = [];
    for (let i = 0; i < 3; i++) metas.push((await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: i }, deps)).meta);
    // Paragraph 1 was made 2 h 1 min ago.
    const stale = { ...metas[1], createdAt: new Date(Date.now() - 121 * 60 * 1000).toISOString() };
    await t.storage.writeJson(`cache/${voice.id}/${stale.key}.json`, stale);

    await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 3 }, deps);
    // Only paragraph 2's id: the walk back stops at the stale one.
    expect(mock.calls.synthesized[3].context!.previousRequestIds).toEqual(["req-2"]);
  });

  it("sends no stitching context to providers without stitching", async () => {
    const mock = createMockProvider();
    setProvidersForTesting([mock]);
    const voice = await makeVoice();
    await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: 1 }, { storage: t.storage, family: EMPTY_FAMILY });
    expect(mock.calls.synthesized[0].context).toBeUndefined();
  });
});

describe("provider history purge (VOICE_PURGE_PROVIDER_HISTORY=after-chapter)", () => {
  async function readWholeChapter(voiceId: string, upTo?: number) {
    const chapter = await loadChapter("s1-ch01");
    const n = upTo ?? chapter.paragraphs.length;
    for (let i = 0; i < n; i++) {
      await getParagraphAudio({ voiceId, chapterId: "s1-ch01", paragraph: i }, { storage: t.storage, family: EMPTY_FAMILY });
    }
    return chapter;
  }

  it("purges the voice's provider history once, only when the whole chapter is cached", async () => {
    process.env.VOICE_PURGE_PROVIDER_HISTORY = "after-chapter";
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { provider, purged } = stitchingMock();
    setProvidersForTesting([provider]);
    const voice = await makeVoice();

    const chapter = await readWholeChapter(voice.id, 5);
    await waitForHistoryPurges();
    expect(purged).toEqual([]); // one paragraph still to go

    await getParagraphAudio({ voiceId: voice.id, chapterId: "s1-ch01", paragraph: chapter.paragraphs.length - 1 }, { storage: t.storage, family: EMPTY_FAMILY });
    await waitForHistoryPurges();
    expect(purged).toEqual([voice.bindings[0].providerVoiceId]);

    // Replays are cache hits: no further purges.
    await readWholeChapter(voice.id);
    await waitForHistoryPurges();
    expect(purged).toHaveLength(1);
  });

  it("does nothing when the option is off (the default)", async () => {
    const { provider, purged } = stitchingMock();
    setProvidersForTesting([provider]);
    const voice = await makeVoice();
    await readWholeChapter(voice.id);
    await waitForHistoryPurges();
    expect(purged).toEqual([]);
  });

  it("a failing purge never fails playback", async () => {
    process.env.VOICE_PURGE_PROVIDER_HISTORY = "after-chapter";
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { provider } = stitchingMock();
    setProvidersForTesting([{ ...provider, purgeHistory: async () => Promise.reject(new Error("history 500 for sk-secret")) }]);
    const voice = await makeVoice();
    await expect(readWholeChapter(voice.id)).resolves.toBeTruthy();
    await waitForHistoryPurges();
    expect(errors).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(errors.mock.calls)).not.toContain("sk-secret"); // error type only
  });
});
