import { describe, expect, it } from "vitest";
import { chunkText, splitSentences } from "../chunking";

const PARA =
  "Clara pulled back the curtain. On the sill sat a red fox, wet to the ears, with a leaf stuck to one of them. " +
  '"Good evening," said the fox. "I\'m so sorry to bother you." Hugh came to stand beside her. ' +
  'Alfie pushed his glasses up his nose. "Foxes don\'t talk," he said. "This one does," said the fox. "And she is very cold." ' +
  "Clara looked back. \"Grandma, she's cold!\" Grandma was already smiling at the fox, and she nodded. " +
  '"Come in, fox," said Clara. Hugh lifted the latch, and in she came, and shook herself dry all over the hearth-rug, and all over Alfie.';

describe("chunking for Chatterbox", () => {
  it("keeps closing quotes with their sentence", () => {
    expect(splitSentences('"Foxes don\'t talk," he said. "This one does." Yes!')).toEqual([
      '"Foxes don\'t talk," he said.',
      '"This one does."',
      "Yes!",
    ]);
  });

  it("returns short paragraphs whole", () => {
    expect(chunkText("A short line.")).toEqual(["A short line."]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("splits long paragraphs into 250–350 character sentence groups", () => {
    const chunks = chunkText(PARA);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(350);
    for (const c of chunks.slice(0, -1)) expect(c.length).toBeGreaterThanOrEqual(200);
    expect(chunks[chunks.length - 1].length).toBeGreaterThanOrEqual(125);
    expect(chunks.join(" ")).toBe(PARA.replace(/\s+/g, " "));
    for (const c of chunks) expect(c).toMatch(/[.!?"]$/);
  });

  it("breaks a single over-long sentence at commas, then words", () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(", ") + ".";
    const chunks = chunkText(long);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(350);
    expect(chunks.join(" ")).toBe(long);
    const noCommas = Array.from({ length: 120 }, (_, i) => `w${i}`).join(" ");
    for (const c of chunkText(noCommas)) expect(c.length).toBeLessThanOrEqual(350);
  });

  it("never leaves a short fragment next to a long sentence", () => {
    const longSentence = (n: number) => {
      const words: string[] = [];
      while (words.join(" ").length < n - 12) words.push(words.length % 7 === 6 ? "lantern," : "fox");
      return words.join(" ").replace(/,$/, "") + " by the fire.";
    };
    const s349 = longSentence(349);
    const s340 = longSentence(340);
    expect(s349.length).toBeGreaterThan(330);
    expect(s349.length).toBeLessThanOrEqual(350);
    const cases = [
      `“Wait!” said Clara. ${s349} Then the fox sat down and looked at all of them, one by one.`,
      `${s340} Then she laughed.`,
      `Oh! ${s340} ${s349} No.`,
    ];
    for (const text of cases) {
      const chunks = chunkText(text);
      expect(chunks.join(" ")).toBe(text.replace(/\s+/g, " "));
      for (const c of chunks) {
        expect(c.length, JSON.stringify(chunks.map((x) => x.length))).toBeLessThanOrEqual(350);
        expect(c.length, JSON.stringify(chunks.map((x) => x.length))).toBeGreaterThanOrEqual(125);
      }
    }
  });
});
