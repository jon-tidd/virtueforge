import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { costTable, fit, loadRates, measuredFromLedger, parseArgs, perChapterUsd } from "./voice-cost.mjs";

const rates = loadRates();
const defaults = () => parseArgs([], rates.defaults, {});
const row = (name: string, o = defaults()) => {
  const r = costTable(rates.scenarioRates, o).find((x) => x.name === name);
  if (!r) throw new Error(`no row ${name}`);
  return r;
};

describe("voice-cost: scenario table (provider-research.md §3)", () => {
  it("uses the research inputs by default", () => {
    const o = defaults();
    expect(o).toMatchObject({ charsPerChapter: 5750, heirloomPriceUsd: 89, marginGuideUsd: 30, tightUsd: 60, voices: 1 });
    expect(o.scenarios).toEqual({ Light: 52, Typical: 156, Heavy: 240 });
  });

  it.each([
    ["ElevenLabs v2/v3, list", 0.575, [29.9, 89.7, 138.0], ["yes", "no", "no"]],
    ["ElevenLabs Flash v2.5, list", 0.2875, [14.95, 44.85, 69.0], ["yes", "tight", "no"]],
    ["Chatterbox self-hosted, planning (L4)", 0.07, [3.64, 10.92, 16.8], ["yes", "yes", "yes"]],
    ["Chatterbox self-hosted, worst case (L40S)", 0.26, [13.52, 40.56, 62.4], ["yes", "tight", "no"]],
    ["Chatterbox on fal.ai / Replicate", 0.1438, [7.48, 22.43, 34.5], ["yes", "yes", "tight"]],
    ["ChatterboxHD on fal.ai / chatterbox-pro", 0.23, [11.96, 35.88, 55.2], ["yes", "tight", "tight"]],
    ["Azure personal voice (+$7.20/yr storage per voice)", 0.138, [14.38, 28.73, 40.32], ["yes", "yes", "tight"]],
    ["Speechify (Pro overage)", 0.046, [2.39, 7.18, 11.04], ["yes", "yes", "yes"]],
  ] as const)("%s matches the research table", (name, perChapter, years, fits) => {
    const r = row(name);
    expect(r.perChapterUsd).toBeCloseTo(perChapter, 3);
    expect([r.years.Light.usd, r.years.Typical.usd, r.years.Heavy.usd]).toEqual([...years]);
    expect([r.years.Light.fit, r.years.Typical.fit, r.years.Heavy.fit]).toEqual([...fits]);
  });

  it("flags scenarios that cost the whole Heirloom price", () => {
    const r = row("ElevenLabs v2/v3, list");
    expect(r.years.Light.lossMaking).toBe(false);
    expect(r.years.Typical.lossMaking).toBe(true); // $89.70 >= $89
    expect(r.years.Heavy.lossMaking).toBe(true);
  });

  it("takes CLI overrides: chars, a custom chapter count, price, margin, voices", () => {
    const o = parseArgs(["--chars", "2500", "--chapters=100", "--price", "119.88", "--margin", "20", "--voices", "3"], rates.defaults, {});
    expect(o).toMatchObject({ charsPerChapter: 2500, heirloomPriceUsd: 119.88, marginGuideUsd: 20, tightUsd: 40, voices: 3 });
    expect(o.scenarios.Custom).toBe(100);
    const el = row("ElevenLabs v2/v3, list", o);
    expect(el.perChapterUsd).toBe(0.25);
    expect(el.years.Custom).toEqual({ usd: 25, fit: "tight", lossMaking: false });
    // Per-voice storage scales with voices: 3 x $7.20.
    const az = row("Azure personal voice (+$7.20/yr storage per voice)", o);
    expect(az.years.Light.usd).toBeCloseTo(52 * 0.06 + 21.6, 2);
    // A per-chapter rate ignores the character count.
    expect(row("Chatterbox self-hosted, planning (L4)", o).perChapterUsd).toBe(0.07);
  });

  it("rejects bad options", () => {
    expect(() => parseArgs(["--chars", "lots"], rates.defaults, {})).toThrow(/--chars/);
    expect(() => parseArgs(["--price"], rates.defaults, {})).toThrow(/--price/);
    expect(() => parseArgs(["--frobnicate"], rates.defaults, {})).toThrow(/unknown option/);
    expect(() => perChapterUsd({ name: "empty" }, 1000)).toThrow(/neither/);
  });

  it("fit thresholds are inclusive", () => {
    const o = { marginGuideUsd: 30, tightUsd: 60 };
    expect(fit(30, o)).toBe("yes");
    expect(fit(30.01, o)).toBe("tight");
    expect(fit(60, o)).toBe("tight");
    expect(fit(60.01, o)).toBe("no");
  });

  it("reads the data dir from VOICE_DATA_DIR unless --data-dir is given", () => {
    expect(parseArgs([], rates.defaults, { VOICE_DATA_DIR: "/x/data" }).dataDir).toBe("/x/data");
    expect(parseArgs(["--data-dir", "/y"], rates.defaults, { VOICE_DATA_DIR: "/x/data" }).dataDir).toBe("/y");
  });
});

describe("voice-cost: measured averages from ledger.jsonl", () => {
  const line = (o: Record<string, unknown>) =>
    JSON.stringify({
      ts: "2026-09-27T20:00:00Z",
      provider: "elevenlabs",
      model: "eleven_multilingual_v2",
      voiceId: "v_x",
      chapterId: "s1-ch01",
      paragraph: 0,
      characters: 400,
      latencyMs: 2000,
      estCostUsd: 0.04,
      requests: 1,
      watermark: "provider-claimed",
      ...o,
    });

  it("averages per provider and model, skips junk, projects a year", () => {
    const text = [
      line({}),
      line({ paragraph: 1, characters: 600, latencyMs: 4000, estCostUsd: 0.06 }),
      "not json",
      "",
      JSON.stringify({ provider: "mock" }), // no characters: skipped
      line({ provider: "chatterbox-fal", model: "fal-ai/chatterbox/text-to-speech", characters: 1000, latencyMs: 9000, estCostUsd: 0.025, requests: 4 }),
    ].join("\n");
    const rows = measuredFromLedger(text, defaults());
    expect(rows.map((r) => `${r.provider}/${r.model}`)).toEqual(["chatterbox-fal/fal-ai/chatterbox/text-to-speech", "elevenlabs/eleven_multilingual_v2"]);
    const el = rows[1];
    expect(el).toMatchObject({ paragraphs: 2, characters: 1000, charsPerParagraph: 500, avgLatencyMs: 3000, maxLatencyMs: 4000, requests: 2, estCostUsd: 0.1 });
    expect(el.usdPerThousandChars).toBeCloseTo(0.1, 6);
    expect(el.perChapterUsd).toBeCloseTo(0.575, 4);
    expect(el.years).toEqual({ Light: 29.9, Typical: 89.7, Heavy: 138 });
    expect(rows[0]).toMatchObject({ requests: 4, usdPerThousandChars: 0.025 });
  });

  it("prices self-hosted rows from measured GPU time, not only the per-character planning rate", () => {
    const text = [
      line({ provider: "chatterbox-http", model: "chatterbox", characters: 575, latencyMs: 90_000, estCostUsd: 0.007 }),
      line({ provider: "chatterbox-http", model: "chatterbox", characters: 575, latencyMs: 90_000, estCostUsd: 0.007 }),
    ].join("\n");
    const o = parseArgs(["--gpu-rate", "0.8"], rates.defaults, {});
    const [row] = measuredFromLedger(text, o);
    // 180 s of GPU = 0.05 h x $0.80 = $0.04 for 1,150 chars -> $0.20 per 5,750-char chapter.
    expect(row.gpu).toMatchObject({ hours: 0.05, usd: 0.04, perChapterUsd: 0.2 });
    expect(row.gpu!.years).toEqual({ Light: 10.4, Typical: 31.2, Heavy: 48 });
    expect(measuredFromLedger(line({}), o)[0].gpu).toBeUndefined(); // hosted rows keep per-character pricing
    expect(parseArgs([], rates.defaults, {}).gpuUsdPerHour).toBe(0.8);
  });

  it("the CLI prints the table, and measured rows when a ledger exists", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gg-voice-cost-"));
    try {
      const script = path.join(process.cwd(), "scripts", "voice-cost.mjs");
      const run = (...args: string[]) => execFileSync(process.execPath, [script, "--data-dir", dir, ...args], { encoding: "utf8" });
      const before = run();
      expect(before).toMatch(/ElevenLabs v2\/v3, list\s+\$0\.575\s+\$29\.90 yes\s+\$89\.70 no\*\s+\$138\.00 no\*/);
      expect(before).toMatch(/Measured: no ledger/);
      writeFileSync(path.join(dir, "ledger.jsonl"), line({}) + "\n");
      const after = run("--chapters", "10");
      expect(after).toMatch(/elevenlabs \/ eleven_multilingual_v2\s+1\s+400\s+2\.0 s/);
      expect(after).toMatch(/Custom/);
      const json = JSON.parse(run("--json"));
      expect(json.measured[0]).toMatchObject({ provider: "elevenlabs", paragraphs: 1 });
      expect(json.estimates).toHaveLength(rates.scenarioRates.length);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
