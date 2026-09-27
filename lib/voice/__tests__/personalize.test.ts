import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildConsentStatement, voiceLabel } from "../consent-text";
import { childrenPhrase, EMPTY_FAMILY, loadFamily, parseFamily, personalize } from "../personalize";

const FAMILY = parseFamily({
  slots: {
    youngest: { sample: "Clara", real: "Rosie" },
    eldest: { sample: "Hugh", real: "Sam" },
    middle: { sample: "Alfie", real: "Hugh" }, // a real name equal to another sample name
    grandparent: { sample: "Ruth", real: "Nana Jo" },
  },
});

describe("personalization", () => {
  it("swaps whole words only, including possessives", () => {
    expect(personalize("Hugh's lantern. Hughes stayed. Clara, Alfie!", FAMILY)).toBe("Sam's lantern. Hughes stayed. Rosie, Hugh!");
  });

  it("never swaps twice when a real name equals a sample name", () => {
    expect(personalize("Alfie looked at Hugh.", FAMILY)).toBe("Hugh looked at Sam.");
  });

  it("orders children eldest, middle, youngest and leaves out grown-ups", () => {
    expect(FAMILY.childNames).toEqual(["Sam", "Hugh", "Rosie"]);
    expect(childrenPhrase(FAMILY)).toBe("Sam, Hugh and Rosie");
  });

  it("is a no-op with no family file", async () => {
    expect(personalize("Hugh and Clara", EMPTY_FAMILY)).toBe("Hugh and Clara");
    expect(await loadFamily(null)).toEqual(EMPTY_FAMILY);
    expect(await loadFamily("/definitely/not/here.json")).toEqual(EMPTY_FAMILY);
    expect(childrenPhrase(EMPTY_FAMILY)).toBe("my family");
  });

  it("loads a family file from a path", async () => {
    const d = mkdtempSync(path.join(os.tmpdir(), "gg-fam-"));
    const f = path.join(d, "family.json");
    writeFileSync(f, JSON.stringify({ slots: { eldest: { sample: "Hugh", real: "Ben" } } }));
    try {
      const fam = await loadFamily(f);
      expect(personalize("Hugh", fam)).toBe("Ben");
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it("ignores malformed family files", () => {
    expect(parseFamily(null)).toEqual(EMPTY_FAMILY);
    expect(parseFamily({ slots: { eldest: { sample: 3 } } }).swaps).toEqual([]);
  });

  it("builds the consent statement and label from the mockup wording", () => {
    expect(buildConsentStatement("Ruth Smith", "Hugh, Alfie and Clara")).toBe(
      "I'm Ruth, and I'd like Grit & Grace to make my story voice, only for reading stories to Hugh, Alfie and Clara. I can switch it off whenever I want.",
    );
    expect(voiceLabel("Jon Tidd")).toBe("Made from Jon's recording, with their permission");
  });
});
