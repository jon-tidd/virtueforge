#!/usr/bin/env node
// Family story voice: what a voice costs per Heirloom family per year.
//
//   npm run voice:cost
//   npm run voice:cost -- --chars 5750 --chapters 100 --price 89 --margin 30 --voices 2
//   npm run voice:cost -- --data-dir ./.voice-data --json
//   npm run voice:cost -- --gpu-rate 1.10
//
// Part 1 prices every scenario rate in lib/voice/rates.json (from
// docs/redesign/voice/provider-research.md, section 3) for the Light / Typical
// / Heavy usage scenarios, and says whether each fits the Heirloom price with
// room for margin. Part 2, when VOICE_DATA_DIR/ledger.jsonl exists, adds what
// the prototype actually measured per provider and model: characters per
// paragraph, generation latency and estimated cost, projected to a year. For
// the self-hosted adapter (chatterbox-http) the per-character figure is only
// the planning rate, so it is also priced from what self-hosting really costs:
// the measured generation time x a GPU $/hour (rates.json gpuUsdPerHour,
// --gpu-rate). That excludes idle and warm-up time.
//
// The ledger holds ids, counts and costs only (no text, no audio), and this
// script prints nothing else from it.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RATES_FILE = path.join(HERE, "..", "lib", "voice", "rates.json");

/**
 * @typedef {{ name: string, perThousandChars?: number, perChapterUsd?: number, perVoicePerYearUsd?: number }} ScenarioRate
 * @typedef {{ charsPerChapter: number, heirloomPriceUsd: number, marginGuideUsd: number, tightUsd: number,
 *             voices: number, scenarios: Record<string, number>, dataDir: string, json: boolean, help: boolean,
 *             gpuUsdPerHour: number }} Options
 * @typedef {"yes" | "tight" | "no"} Fit
 * @typedef {{ name: string, perChapterUsd: number, perVoicePerYearUsd: number,
 *             years: Record<string, { usd: number, fit: Fit, lossMaking: boolean }> }} CostRow
 * @typedef {{ provider: string, model: string, paragraphs: number, characters: number, charsPerParagraph: number,
 *             avgLatencyMs: number, maxLatencyMs: number, requests: number, estCostUsd: number,
 *             usdPerThousandChars: number, perChapterUsd: number, years: Record<string, number>,
 *             gpu?: { hours: number, usd: number, perChapterUsd: number, years: Record<string, number> } }} MeasuredRow
 */

/** @returns {{ perThousandChars: Record<string, Record<string, number>>, scenarioRates: ScenarioRate[], defaults: any, checkedOn?: string }} */
export function loadRates(file = RATES_FILE) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function num(flag, v) {
  const n = Number(v);
  if (v === undefined || v === "" || !Number.isFinite(n) || n < 0) throw new Error(`${flag} needs a non-negative number`);
  return n;
}

/**
 * CLI flags over rates.json defaults.
 * --chapters N adds a "Custom" scenario of N chapters a year.
 * @param {string[]} argv
 * @param {any} defaults rates.json "defaults"
 * @param {Record<string, string | undefined>} env
 * @returns {Options}
 */
export function parseArgs(argv, defaults, env = process.env) {
  const margin = defaults.marginGuideUsd;
  /** @type {Options} */
  const o = {
    charsPerChapter: defaults.charsPerChapter,
    heirloomPriceUsd: defaults.heirloomPriceUsd,
    marginGuideUsd: margin,
    tightUsd: NaN,
    voices: 1,
    scenarios: { Light: defaults.scenarios.light, Typical: defaults.scenarios.typical, Heavy: defaults.scenarios.heavy },
    dataDir: env.VOICE_DATA_DIR || path.join(process.cwd(), ".voice-data"),
    json: false,
    help: false,
    gpuUsdPerHour: typeof defaults.gpuUsdPerHour === "number" ? defaults.gpuUsdPerHour : 0.8,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [flag, inline] = a.includes("=") ? a.split(/=(.*)/s) : [a, undefined];
    const val = () => (inline !== undefined ? inline : argv[++i]);
    switch (flag) {
      case "--chars":
        o.charsPerChapter = num(flag, val());
        break;
      case "--chapters":
        o.scenarios.Custom = num(flag, val());
        break;
      case "--price":
        o.heirloomPriceUsd = num(flag, val());
        break;
      case "--margin":
        o.marginGuideUsd = num(flag, val());
        break;
      case "--tight":
        o.tightUsd = num(flag, val());
        break;
      case "--voices":
        o.voices = Math.max(1, Math.round(num(flag, val())));
        break;
      case "--gpu-rate":
        o.gpuUsdPerHour = num(flag, val());
        break;
      case "--data-dir":
        o.dataDir = String(val() ?? "");
        break;
      case "--json":
        o.json = true;
        break;
      case "-h":
      case "--help":
        o.help = true;
        break;
      default:
        throw new Error(`unknown option: ${a} (try --help)`);
    }
  }
  // "Tight" = over the margin guide but under twice it (rates.json
  // tightMultipleOfMargin; the compare page uses the same rule). This
  // reproduces the research doc's verdicts ($45 tight, $69 no).
  if (!Number.isFinite(o.tightUsd)) o.tightUsd = (defaults.tightMultipleOfMargin ?? 2) * o.marginGuideUsd;
  return o;
}

/** @param {number} usd @param {Pick<Options, "marginGuideUsd" | "tightUsd">} o @returns {Fit} */
export function fit(usd, o) {
  if (usd <= o.marginGuideUsd + 1e-9) return "yes";
  if (usd <= o.tightUsd + 1e-9) return "tight";
  return "no";
}

/** @param {ScenarioRate} r @param {number} charsPerChapter */
export function perChapterUsd(r, charsPerChapter) {
  if (typeof r.perChapterUsd === "number") return r.perChapterUsd;
  if (typeof r.perThousandChars === "number") return (charsPerChapter / 1000) * r.perThousandChars;
  throw new Error(`scenario rate "${r.name}" has neither perThousandChars nor perChapterUsd`);
}

/**
 * @param {ScenarioRate[]} scenarioRates
 * @param {Options} o
 * @returns {CostRow[]}
 */
export function costTable(scenarioRates, o) {
  return scenarioRates.map((r) => {
    const chapter = perChapterUsd(r, o.charsPerChapter);
    const perVoice = (r.perVoicePerYearUsd ?? 0) * o.voices;
    /** @type {CostRow["years"]} */
    const years = {};
    for (const [name, chapters] of Object.entries(o.scenarios)) {
      const usd = round2(chapter * chapters + perVoice);
      years[name] = { usd, fit: fit(usd, o), lossMaking: usd >= o.heirloomPriceUsd };
    }
    return { name: r.name, perChapterUsd: round4(chapter), perVoicePerYearUsd: perVoice, years };
  });
}

/**
 * Measured averages from ledger.jsonl lines (one LedgerEntry per generated paragraph).
 * Bad lines are skipped. Projections use the measured $ per 1,000 characters.
 * @param {string} text
 * @param {Options} o
 * @returns {MeasuredRow[]}
 */
export function measuredFromLedger(text, o) {
  /** @type {Map<string, MeasuredRow>} */
  const rows = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (!e || typeof e.provider !== "string" || typeof e.model !== "string" || !Number.isFinite(e.characters)) continue;
    const k = `${e.provider}|${e.model}`;
    const r = rows.get(k) ?? {
      provider: e.provider,
      model: e.model,
      paragraphs: 0,
      characters: 0,
      charsPerParagraph: 0,
      avgLatencyMs: 0,
      maxLatencyMs: 0,
      requests: 0,
      estCostUsd: 0,
      usdPerThousandChars: 0,
      perChapterUsd: 0,
      years: {},
      _latency: 0,
    };
    r.paragraphs++;
    r.characters += e.characters;
    r._latency += Number(e.latencyMs) || 0;
    r.maxLatencyMs = Math.max(r.maxLatencyMs, Number(e.latencyMs) || 0);
    r.requests += Number(e.requests) || 1;
    r.estCostUsd += Number(e.estCostUsd) || 0;
    rows.set(k, r);
  }
  return [...rows.values()]
    .map((r) => {
      const { _latency, ...rest } = /** @type {MeasuredRow & { _latency: number }} */ (r);
      const perK = rest.characters ? (rest.estCostUsd / rest.characters) * 1000 : 0;
      const chapter = (o.charsPerChapter / 1000) * perK;
      /** @type {Record<string, number>} */
      const years = {};
      for (const [name, chapters] of Object.entries(o.scenarios)) years[name] = round2(chapter * chapters);
      /** @type {MeasuredRow} */
      const out = {
        ...rest,
        charsPerParagraph: Math.round(rest.characters / rest.paragraphs),
        avgLatencyMs: Math.round(_latency / rest.paragraphs),
        estCostUsd: round4(rest.estCostUsd),
        usdPerThousandChars: round4(perK),
        perChapterUsd: round4(chapter),
        years,
      };
      if (SELF_HOSTED.has(rest.provider)) {
        // What self-hosting actually costs: GPU time, not characters.
        const hours = _latency / 3_600_000;
        const usdGpu = hours * o.gpuUsdPerHour;
        const gpuChapter = rest.characters ? (usdGpu / rest.characters) * o.charsPerChapter : 0;
        /** @type {Record<string, number>} */
        const gpuYears = {};
        for (const [name, chapters] of Object.entries(o.scenarios)) gpuYears[name] = round2(gpuChapter * chapters);
        out.gpu = { hours: round4(hours), usd: round4(usdGpu), perChapterUsd: round4(gpuChapter), years: gpuYears };
      }
      return out;
    })
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
}

/** Providers we run ourselves: billed by GPU time, not per character. */
export const SELF_HOSTED = new Set(["chatterbox-http"]);

function round2(n) {
  return Math.round(n * 100) / 100;
}
function round4(n) {
  return Math.round(n * 10000) / 10000;
}
const usd = (n, dp = 2) => `$${n.toFixed(dp)}`;

/** Plain-text table with right-aligned numbers. */
function table(head, rows) {
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const fmt = (cells) => cells.map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i]))).join("  ");
  return [fmt(head), widths.map((w) => "-".repeat(w)).join("  "), ...rows.map(fmt)].join("\n");
}

/** @param {ReturnType<typeof loadRates>} rates @param {Options} o @param {MeasuredRow[] | null} measured @param {string | null} ledgerPath */
export function render(rates, o, measured, ledgerPath) {
  const names = Object.keys(o.scenarios);
  const rows = costTable(rates.scenarioRates, o);
  const out = [];
  out.push(`Family story voice: cost per Heirloom family per year`);
  out.push(
    `Rates: lib/voice/rates.json${rates.checkedOn ? ` (checked ${rates.checkedOn})` : ""}. ` +
      `${o.charsPerChapter.toLocaleString("en-US")} characters a chapter; ` +
      names.map((n) => `${n} ${o.scenarios[n]}`).join(", ") +
      ` chapters a year; ${o.voices} voice${o.voices === 1 ? "" : "s"} per family.`,
  );
  out.push(
    `Fit: yes = at or under the ${usd(o.marginGuideUsd, 0)} margin guide; tight = under ${usd(o.tightUsd, 0)}; ` +
      `no = over that; * = at or over the ${usd(o.heirloomPriceUsd, 0)} Heirloom price (loses money).`,
  );
  out.push("");
  out.push(
    table(
      ["Option", "Per chapter", ...names],
      rows.map((r) => [
        r.name,
        usd(r.perChapterUsd, 3),
        ...names.map((n) => `${usd(r.years[n].usd)} ${r.years[n].fit}${r.years[n].lossMaking ? "*" : ""}`),
      ]),
    ),
  );
  out.push("");
  out.push("Plan fees are not included (ElevenLabs Scale $2,990/yr, Speechify Pro $99/mo, a warm GPU at bedtime ~$876/yr): see provider-research.md §3.");

  out.push("");
  if (!measured) {
    out.push(`Measured: no ledger at ${ledgerPath}. Generate some paragraphs in /voice-lab, then run this again.`);
  } else if (measured.length === 0) {
    out.push(`Measured: ${ledgerPath} has no usable rows yet.`);
  } else {
    out.push(`Measured in the prototype (${ledgerPath}); projected with the measured $ per 1,000 characters:`);
    out.push("");
    out.push(
      table(
        ["Provider / model", "Paragraphs", "Chars/para", "Avg latency", "Max latency", "Requests", "Est. cost", "$/1K chars", "Per chapter", ...names],
        measured.map((m) => [
          `${m.provider} / ${m.model}`,
          m.paragraphs,
          m.charsPerParagraph,
          `${(m.avgLatencyMs / 1000).toFixed(1)} s`,
          `${(m.maxLatencyMs / 1000).toFixed(1)} s`,
          m.requests,
          usd(m.estCostUsd, 4),
          usd(m.usdPerThousandChars, 4),
          usd(m.perChapterUsd, 3),
          ...names.map((n) => `${usd(m.years[n])} ${fit(m.years[n], o)}`),
        ]),
      ),
    );
    out.push("");
    out.push("Estimated cost = billed characters x the rates.json list rate (the ledger does not see invoices).");
    const gpu = measured.filter((m) => m.gpu);
    if (gpu.length) {
      out.push("");
      out.push(
        `Self-hosted, priced from measured generation time at ${usd(o.gpuUsdPerHour)}/GPU-hour (--gpu-rate). ` +
          "Excludes idle and warm-up time (a warm GPU at bedtime is ~$876/yr, research §3):",
      );
      out.push("");
      out.push(
        table(
          ["Provider / model", "GPU time", "GPU cost", "Per chapter", "vs per-char est.", ...names],
          gpu.map((m) => [
            `${m.provider} / ${m.model}`,
            `${(m.gpu.hours * 60).toFixed(1)} min`,
            usd(m.gpu.usd, 4),
            usd(m.gpu.perChapterUsd, 3),
            usd(m.perChapterUsd, 3),
            ...names.map((n) => `${usd(m.gpu.years[n])} ${fit(m.gpu.years[n], o)}`),
          ]),
        ),
      );
    }
  }
  return out.join("\n");
}

const HELP = `Usage: npm run voice:cost -- [options]

  --chars N       characters per chapter (default: rates.json, 5,750)
  --chapters N    add a Custom scenario of N chapters a year
  --price USD     Heirloom price per family per year (default 89)
  --margin USD    margin guide: most the voice should cost per family per year (default 30)
  --tight USD     upper bound for "tight" (default: twice the margin guide)
  --voices N      voices per family (adds per-voice storage fees, e.g. Azure)
  --gpu-rate USD  GPU $ per hour for self-hosted rows (default: rates.json, 0.80 for an L4)
  --data-dir DIR  where ledger.jsonl lives (default: VOICE_DATA_DIR or ./.voice-data)
  --json          machine-readable output
`;

/** @param {string[]} argv */
export function main(argv = process.argv.slice(2)) {
  const rates = loadRates();
  const o = parseArgs(argv, rates.defaults);
  if (o.help) {
    process.stdout.write(HELP);
    return;
  }
  const ledgerPath = path.join(o.dataDir, "ledger.jsonl");
  const measured = existsSync(ledgerPath) ? measuredFromLedger(readFileSync(ledgerPath, "utf8"), o) : null;
  if (o.json) {
    process.stdout.write(
      JSON.stringify({ options: { ...o, help: undefined, json: undefined }, estimates: costTable(rates.scenarioRates, o), measured }, null, 2) + "\n",
    );
    return;
  }
  process.stdout.write(render(rates, o, measured, ledgerPath) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`voice-cost: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  }
}
