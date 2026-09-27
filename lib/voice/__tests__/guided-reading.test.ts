import { describe, expect, it } from "vitest";
import { GUIDED_PASSAGES, getPassage, passageWordCount } from "../guided-reading";

describe("guided reading", () => {
  it("is about 3 minutes at bedtime pace (430–480 words, ~150 wpm)", () => {
    const words = passageWordCount();
    expect(words).toBeGreaterThanOrEqual(430);
    expect(words).toBeLessThanOrEqual(480);
    expect(words / 150).toBeGreaterThan(2.8);
  });

  it("has six passages with unique ids, each findable", () => {
    expect(GUIDED_PASSAGES).toHaveLength(6);
    expect(new Set(GUIDED_PASSAGES.map((p) => p.id)).size).toBe(6);
    for (const p of GUIDED_PASSAGES) expect(getPassage(p.id)).toBe(p);
    expect(getPassage("nope")).toBeUndefined();
  });

  it("covers dialogue, questions, a loud line and uses only the sample family", () => {
    const all = GUIDED_PASSAGES.map((p) => p.text).join(" ");
    expect(all).toMatch(/“/);
    expect((all.match(/\?/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(all).toMatch(/LITTLE/);
    for (const name of ["Hugh", "Alfie", "Clara"]) expect(all).toContain(name);
  });
});
