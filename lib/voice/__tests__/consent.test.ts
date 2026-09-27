import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sha256Hex } from "../cache";
import { CONSENT_SCRIPT_VERSION, redactChildren, voiceLabelPreview } from "../consent-text";
import { parseFamily } from "../personalize";
import type { ConsentRecord, VoiceRecord } from "../types";
import { toneWav } from "../wav";
import { consentRecordSha256, createVoiceRecord, findVoiceByToken, readConsent, readConsentChecked, requireOwner } from "../voices";
import { newVoiceInput, tempStorage } from "./helpers";

let t: ReturnType<typeof tempStorage>;
beforeEach(() => (t = tempStorage()));
afterEach(() => t.cleanup());

const NO_FAMILY = parseFamily(null);

describe("consent record", () => {
  it("stores the exact statement, an ISO timestamp, the audio and its sha256", async () => {
    const input = newVoiceInput();
    const { voice, ownerToken } = await createVoiceRecord(input, t.storage, NO_FAMILY);
    const c = (await readConsent(t.storage, voice.id))!;
    expect(c.text).toBe(input.consent.text);
    expect(c.text).toContain("only for reading stories to my family");
    expect(c.scriptVersion).toBe(CONSENT_SCRIPT_VERSION);
    expect(c.spokenAt).toBe(input.consent.spokenAt);
    expect(new Date(c.receivedAt).toISOString()).toBe(c.receivedAt);
    expect(c.audioSha256).toBe(sha256Hex(input.consent.audio));
    expect(await t.storage.read(`voices/${voice.id}/consent.wav`)).toEqual(input.consent.audio);
    expect(c.attestations).toMatchObject({ adult: true, ownVoice: true, noChildVoice: true });
    // The raw token is never stored; only its hash.
    const onDisk = JSON.stringify(await t.storage.readJson(`voices/${voice.id}/voice.json`));
    expect(onDisk).not.toContain(ownerToken);
    expect((await findVoiceByToken(t.storage, ownerToken))?.id).toBe(voice.id);
    expect(voice.label).toBe("Made from Jon's recording, with their permission");
  });

  it("binds the record together with a hash kept in consent.json and voice.json, and notices edits", async () => {
    const { voice } = await createVoiceRecord(newVoiceInput(), t.storage, NO_FAMILY);
    const c = (await readConsent(t.storage, voice.id))!;
    expect(c.recordSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(c.recordSha256).toBe(consentRecordSha256(c));
    const stored = (await t.storage.readJson<VoiceRecord>(`voices/${voice.id}/voice.json`))!;
    expect(stored.consentSha256).toBe(c.recordSha256);
    expect((await readConsentChecked(t.storage, stored))?.intact).toBe(true);

    // Backdating the consent (or changing its words) in consent.json is detectable.
    for (const edit of [{ spokenAt: "2020-01-01T00:00:00.000Z" }, { text: c.text.replace("switch it off", "never switch it off") }]) {
      await t.storage.writeJson(`voices/${voice.id}/consent.json`, { ...c, ...edit } satisfies ConsentRecord);
      expect((await readConsentChecked(t.storage, stored))?.intact).toBe(false);
    }
    // So is rewriting the record's own hash to match: voice.json still holds the original.
    const forged = { ...c, spokenAt: "2020-01-01T00:00:00.000Z" };
    forged.recordSha256 = consentRecordSha256(forged);
    await t.storage.writeJson(`voices/${voice.id}/consent.json`, forged);
    expect((await readConsentChecked(t.storage, stored))?.intact).toBe(false);
  });

  it("only accepts a spokenAt close to the server's clock", async () => {
    const at = (ms: number) => {
      const input = newVoiceInput();
      input.consent.spokenAt = new Date(Date.now() + ms).toISOString();
      return createVoiceRecord(input, t.storage, NO_FAMILY);
    };
    await expect(at(-31 * 60_000)).rejects.toMatchObject({ code: "consent_stale" });
    await expect(at(5 * 60_000)).rejects.toMatchObject({ code: "bad_request" });
    await expect(at(-29 * 60_000)).resolves.toBeTruthy();
    await expect(at(60_000)).resolves.toBeTruthy();
  });

  it("uses the family's real names in the statement when there is a family file", async () => {
    const fam = parseFamily({ slots: { eldest: { sample: "Hugh", real: "Sam" }, youngest: { sample: "Clara", real: "Rosie" } } });
    const input = newVoiceInput({}, fam);
    const { voice } = await createVoiceRecord(input, t.storage, fam);
    expect((await readConsent(t.storage, voice.id))!.text).toContain("only for reading stories to Sam and Rosie.");
  });

  it("refuses without all three adult / own-voice / no-child attestations", async () => {
    for (const k of ["attestAdult", "attestOwnVoice", "attestNoChildVoice"] as const) {
      await expect(createVoiceRecord(newVoiceInput({ [k]: false }), t.storage, NO_FAMILY)).rejects.toMatchObject({
        code: "adult_own_voice_required",
      });
    }
    expect(await t.storage.list("voices")).toEqual([]);
  });

  it("refuses a statement that doesn't match the script", async () => {
    const input = newVoiceInput();
    input.consent.text = input.consent.text.replace("switch it off", "never switch it off");
    await expect(createVoiceRecord(input, t.storage, NO_FAMILY)).rejects.toMatchObject({ code: "consent_text_mismatch" });
  });

  it("refuses too little audio (including a consent clip too short to be the statement), non-WAV audio, and unknown passages", async () => {
    const short = newVoiceInput();
    short.samples = short.samples.slice(0, 2);
    await expect(createVoiceRecord(short, t.storage, NO_FAMILY)).rejects.toMatchObject({ code: "not_enough_audio" });
    const quick = newVoiceInput();
    quick.consent.audio = toneWav(4, 16000, 200); // the ~30-word statement takes 8-10 s
    await expect(createVoiceRecord(quick, t.storage, NO_FAMILY)).rejects.toMatchObject({ code: "not_enough_audio" });
    const bad = newVoiceInput();
    bad.consent.audio = new Uint8Array([1, 2, 3]);
    await expect(createVoiceRecord(bad, t.storage, NO_FAMILY)).rejects.toMatchObject({ code: "bad_audio" });
    const unknown = newVoiceInput();
    unknown.samples[0] = { ...unknown.samples[0], passageId: "free-text" };
    await expect(createVoiceRecord(unknown, t.storage, NO_FAMILY)).rejects.toMatchObject({ code: "bad_request" });
  });

  it("checks the owner token", async () => {
    const { voice, ownerToken } = await createVoiceRecord(newVoiceInput(), t.storage, NO_FAMILY);
    await expect(requireOwner(t.storage, voice.id, "x".repeat(43))).rejects.toMatchObject({ code: "unauthorized" });
    await expect(requireOwner(t.storage, voice.id, ownerToken)).resolves.toMatchObject({ id: voice.id });
  });
});

describe("consent text helpers", () => {
  it("never shows \"your's\" before a name is typed", () => {
    expect(voiceLabelPreview("")).toBe("Made from [your name]'s recording, with their permission");
    expect(voiceLabelPreview("  ")).toBe("Made from [your name]'s recording, with their permission");
    expect(voiceLabelPreview("Jon Tidd")).toBe("Made from Jon's recording, with their permission");
  });

  it("redacts the children's names from a statement", () => {
    const s = "I'm Jon, and I'd like Grit & Grace to make my story voice, only for reading stories to Sam and Rosie. I can switch it off whenever I want.";
    expect(redactChildren(s)).toBe(
      "I'm Jon, and I'd like Grit & Grace to make my story voice, only for reading stories to [the children's names]. I can switch it off whenever I want.",
    );
    expect(redactChildren("something else")).toBeNull();
  });
});
