"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChapterMeta } from "@/lib/voice/chapters";
import type { LedgerSummaryRow } from "@/lib/voice/ledger";
import { fitFor, rateInfo, type Fit, type FitThresholds } from "@/lib/voice/rates";
import type { ProviderInfo } from "@/lib/voice/registry";
import type { ProviderId } from "@/lib/voice/types";
import type { PublicVoice } from "@/lib/voice/voices";
import { getJson } from "./api";
import { ChapterPlayer, fetchManifest, type ParagraphStats } from "./ChapterPlayer";
import { Card, Eyebrow, fmtUsd, Title } from "./ui";

// The same chapter in two providers (or two models), side by side. Each player
// reports every paragraph it loads; the table adds this session's numbers to
// the all-time totals from /api/voice/ledger, so a reload keeps them. Rates
// come from lib/voice/rates.ts / rates.json (the same lookup the ledger uses,
// and the same file and fit rule scripts/voice-cost.mjs uses). Only one
// player plays at a time (ChapterPlayer announces itself when it starts).

type Scenarios = { light: number; typical: number; heavy: number };
interface Choice {
  provider: ProviderId;
  model: string;
}
interface SideStats {
  byParagraph: Record<number, ParagraphStats>;
  /** fetchMs of the first paragraph this player loaded: what a listener waits before hearing anything. */
  firstAudioMs: number | null;
}

const EMPTY: SideStats = { byParagraph: {}, firstAudioMs: null };
const selectClass =
  "mt-1.5 min-h-[48px] w-full rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 text-[16px] text-[#FBF3E2] outline-none focus:border-[#E9A23B]";

const key = (c: Choice) => `${c.provider}|${c.model}`;
const fromKey = (k: string): Choice => {
  const [provider, ...rest] = k.split("|");
  return { provider: provider as ProviderId, model: rest.join("|") };
};

function choicesFor(voice: PublicVoice | undefined, providers: ProviderInfo[]): Choice[] {
  if (!voice) return [];
  return voice.bindings.flatMap((b) => {
    const info = providers.find((p) => p.id === b.provider);
    if (!info) return [];
    const models = [info.defaultModel, ...info.models.filter((m) => m !== info.defaultModel)];
    return models.map((model) => ({ provider: info.id, model }));
  });
}

function defaultPair(choices: Choice[]): [Choice | null, Choice | null] {
  const a = choices[0] ?? null;
  if (!a) return [null, null];
  const b = choices.find((c) => c.provider !== a.provider) ?? choices.find((c) => key(c) !== key(a)) ?? a;
  return [a, b];
}

export function ComparePanel({
  voices,
  providers,
  chapters,
  charsPerChapter,
  scenarios,
  thresholds,
}: {
  voices: PublicVoice[];
  providers: ProviderInfo[];
  chapters: ChapterMeta[];
  charsPerChapter: number;
  scenarios: Scenarios;
  thresholds: FitThresholds;
}) {
  const initialVoice =
    voices.find((v) => v.enabled && new Set(v.bindings.map((b) => b.provider)).size >= 2) ?? voices.find((v) => v.enabled) ?? voices[0];
  const [voiceId, setVoiceId] = useState(initialVoice?.id ?? "");
  const voice = voices.find((v) => v.id === voiceId);
  const choices = useMemo(() => choicesFor(voice, providers), [voice, providers]);
  const [chapterId, setChapterId] = useState(() => chapters.find((c) => c.id === "s1-ch01")?.id ?? chapters[0]?.id ?? "s1-ch01");
  const [pair, setPair] = useState<[Choice | null, Choice | null]>(() => defaultPair(choicesFor(initialVoice, providers)));
  const [a, b] = pair;

  // A fresh comparison whenever the voice, chapter or either side changes: stats are
  // tagged with the comparison they belong to, and anything from an older one reads as empty.
  const resetKey = `${voiceId}|${chapterId}|${a ? key(a) : ""}|${b ? key(b) : ""}`;
  const [taggedA, setTaggedA] = useState<{ k: string; s: SideStats }>({ k: "", s: EMPTY });
  const [taggedB, setTaggedB] = useState<{ k: string; s: SideStats }>({ k: "", s: EMPTY });
  const statsA = taggedA.k === resetKey ? taggedA.s : EMPTY;
  const statsB = taggedB.k === resetKey ? taggedB.s : EMPTY;

  const [manifestChars, setManifestChars] = useState<{ id: string; chars: number } | null>(null);
  const chapterChars = manifestChars?.id === chapterId ? manifestChars.chars : null;
  useEffect(() => {
    let alive = true;
    fetchManifest(chapterId)
      .then((m) => alive && setManifestChars({ id: chapterId, chars: m.characters }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [chapterId]);

  // All-time totals from the ledger; `ledgerTick` asks for a refresh after new generations.
  const [ledger, setLedger] = useState<LedgerSummaryRow[]>([]);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerTick, setLedgerTick] = useState(0);
  useEffect(() => {
    if (!voiceId) return;
    let alive = true;
    const q = new URLSearchParams({ chapterId, voiceId });
    getJson<{ rows: LedgerSummaryRow[] }>(`/api/voice/ledger?${q}`, undefined, "Ledger failed")
      .then((body) => {
        if (!alive) return;
        setLedger(body.rows);
        setLedgerError(null);
      })
      .catch((e: unknown) => alive && setLedgerError(e instanceof Error ? e.message : "Ledger failed"));
    return () => {
      alive = false;
    };
  }, [voiceId, chapterId, ledgerTick]);

  // Debounced: a burst of paragraphs (play + prefetch, two players) triggers one refresh.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleLedger = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => setLedgerTick((t) => t + 1), 800);
  }, []);
  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const record = useCallback(
    (set: typeof setTaggedA) => (s: ParagraphStats) => {
      set((prev) => {
        const base = prev.k === resetKey ? prev.s : EMPTY;
        return {
          k: resetKey,
          s: { byParagraph: { ...base.byParagraph, [s.paragraph]: s }, firstAudioMs: base.firstAudioMs ?? s.fetchMs },
        };
      });
      if (s.cache !== "hit") scheduleLedger();
    },
    [resetKey, scheduleLedger],
  );
  const onStatsA = useMemo(() => record(setTaggedA), [record]);
  const onStatsB = useMemo(() => record(setTaggedB), [record]);

  function pickVoice(id: string) {
    setVoiceId(id);
    setPair(defaultPair(choicesFor(voices.find((v) => v.id === id), providers)));
  }

  const labelOf = (c: Choice) => `${providers.find((p) => p.id === c.provider)?.label ?? c.provider} · ${c.model}`;
  const distinctProviders = new Set(voice?.bindings.map((x) => x.provider) ?? []).size;

  if (voices.length === 0) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <Heading />
        <Card>
          <p className="text-[14.5px] leading-normal text-[#DCD2BE]">
            No voice has been made with a provider yet. Make one on the <Link href="/voice-lab">Record</Link> page, ticking two
            providers (for example ElevenLabs and Chatterbox), then come back.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Heading />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cmp-voice" className="block text-[13px] font-bold text-[#B8AE9A]">
              Voice
            </label>
            <select id="cmp-voice" value={voiceId} onChange={(e) => pickVoice(e.target.value)} className={selectClass}>
              {voices.map((v) => {
                const n = new Set(v.bindings.map((x) => x.provider)).size;
                return (
                  <option key={v.id} value={v.id}>
                    {v.ownerName} · {n} provider{n === 1 ? "" : "s"}
                    {v.enabled ? "" : " · switched off"}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="cmp-chapter" className="block text-[13px] font-bold text-[#B8AE9A]">
              Chapter
            </label>
            <select id="cmp-chapter" value={chapterId} onChange={(e) => setChapterId(e.target.value)} className={selectClass}>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Ch. {c.chapter} · {c.title}
                </option>
              ))}
            </select>
          </div>
          {(["A", "B"] as const).map((side, i) => {
            const cur = pair[i];
            return (
              <div key={side}>
                <label htmlFor={`cmp-${side}`} className="block text-[13px] font-bold text-[#B8AE9A]">
                  {side}: provider and model
                </label>
                <select
                  id={`cmp-${side}`}
                  value={cur ? key(cur) : ""}
                  onChange={(e) => {
                    const next = fromKey(e.target.value);
                    setPair((p) => (i === 0 ? [next, p[1]] : [p[0], next]));
                  }}
                  className={selectClass}
                  disabled={choices.length === 0}
                >
                  {choices.map((c) => (
                    <option key={key(c)} value={key(c)}>
                      {labelOf(c)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        {voice && distinctProviders < 2 && (
          <p className="mt-3 text-[13px] leading-normal text-[#B8AE9A]">
            This voice was made with one provider, so A and B can only differ by model. For a provider comparison, make a voice with
            two providers ticked on the <Link href="/voice-lab">Record</Link> page.
          </p>
        )}
        {voice && !voice.enabled && (
          <p role="status" className="mt-3 text-[13.5px] font-bold text-[#F4C9BD]">
            This voice is switched off by its owner, so nothing will play.
          </p>
        )}
      </Card>

      {voice && a && b && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChapterPlayer
            key={`A|${resetKey}`}
            voiceId={voice.id}
            label={voice.label}
            provider={a.provider}
            model={a.model}
            chapterId={chapterId}
            heading={`A · ${labelOf(a)}`}
            onStats={onStatsA}
          />
          <ChapterPlayer
            key={`B|${resetKey}`}
            voiceId={voice.id}
            label={voice.label}
            provider={b.provider}
            model={b.model}
            chapterId={chapterId}
            heading={`B · ${labelOf(b)}`}
            onStats={onStatsB}
          />
        </div>
      )}

      {a && b && (
        <CompareTable
          a={a}
          b={b}
          statsA={statsA}
          statsB={statsB}
          ledgerA={ledger.find((r) => r.provider === a.provider && r.model === a.model)}
          ledgerB={ledger.find((r) => r.provider === b.provider && r.model === b.model)}
          watermarkA={providers.find((p) => p.id === a.provider)?.watermark ?? false}
          watermarkB={providers.find((p) => p.id === b.provider)?.watermark ?? false}
          chapterChars={chapterChars}
          charsPerChapter={charsPerChapter}
          scenarios={scenarios}
          thresholds={thresholds}
          labelOf={labelOf}
        />
      )}
      {ledgerError && <p className="text-[12.5px] text-[#F4C9BD]">Totals from the ledger couldn&apos;t load: {ledgerError}</p>}
    </div>
  );
}

function Heading() {
  return (
    <div>
      <Eyebrow>Voice lab · compare</Eyebrow>
      <Title>Same chapter, two voices.</Title>
      <p className="mt-2 text-[14.5px] leading-normal text-[#B8AE9A]">
        Play each side and listen for drift, clicks between paragraphs and how the children&apos;s names land. Each paragraph is made
        once and cached, so replays are free.
      </p>
    </div>
  );
}

function summarize(s: SideStats) {
  const rows = Object.values(s.byParagraph);
  // Cache hits cost nothing this session: only paragraphs made now are billed.
  const made = rows.filter((r) => r.cache !== "hit");
  const watermark = rows.find((r) => r.watermark && r.watermark !== "?")?.watermark ?? null;
  return {
    loaded: rows.length,
    made: made.length,
    charactersPlayed: rows.reduce((n, r) => n + r.characters, 0),
    charactersBilled: made.reduce((n, r) => n + r.characters, 0),
    costNow: made.reduce((n, r) => n + r.estCostUsd, 0),
    avgLatencyMs: rows.length ? Math.round(rows.reduce((n, r) => n + r.latencyMs, 0) / rows.length) : null,
    watermark,
    firstAudioMs: s.firstAudioMs,
  };
}

const FIT_STYLE: Record<Fit, string> = {
  yes: "text-[#B9D3A6]",
  tight: "text-[#F2C46B]",
  no: "text-[#F4B3A2]",
};
const FIT_WORD: Record<Fit, string> = { yes: "fits", tight: "tight", no: "over" };

/** "$89.70 · 101% of $89 · over", coloured and worded (never colour alone). */
function YearCost({ usd, t }: { usd: number | null; t: FitThresholds }) {
  if (usd === null) return <>—</>;
  const f = fitFor(usd, t);
  const pct = Math.round((usd / t.heirloomPriceUsd) * 100);
  return (
    <span className={FIT_STYLE[f]}>
      {fmtUsd(usd)} · {pct}% of ${t.heirloomPriceUsd} · <b>{FIT_WORD[f]}</b>
      {usd >= t.heirloomPriceUsd ? " (loses money)" : ""}
    </span>
  );
}

const secs = (ms: number | null | undefined) =>
  ms === null || ms === undefined ? "—" : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;

function CompareTable({
  a,
  b,
  statsA,
  statsB,
  ledgerA,
  ledgerB,
  watermarkA,
  watermarkB,
  chapterChars,
  charsPerChapter,
  scenarios,
  thresholds,
  labelOf,
}: {
  a: Choice;
  b: Choice;
  statsA: SideStats;
  statsB: SideStats;
  ledgerA?: LedgerSummaryRow;
  ledgerB?: LedgerSummaryRow;
  watermarkA: boolean;
  watermarkB: boolean;
  chapterChars: number | null;
  charsPerChapter: number;
  scenarios: Scenarios;
  thresholds: FitThresholds;
  labelOf: (c: Choice) => string;
}) {
  const sa = summarize(statsA);
  const sb = summarize(statsB);
  // The same lookup the ledger uses, so the per-paragraph costs and these rows always agree.
  const ria = rateInfo(a.provider, a.model);
  const rib = rateInfo(b.provider, b.model);
  const ra = ria.usdPerThousand;
  const rb = rib.usdPerThousand;
  const perChapter = (rate: number, chars: number | null) => (chars === null ? "—" : fmtUsd((chars / 1000) * rate));
  const yearly = (rate: number, chapters: number) => <YearCost usd={(charsPerChapter / 1000) * rate * chapters} t={thresholds} />;
  const wm = (s: ReturnType<typeof summarize>, supported: boolean) => s.watermark ?? (supported ? "supported (not seen yet)" : "none");
  const rateText = (r: typeof ria) => `$${r.usdPerThousand}${r.exact ? "" : " (provider's planning rate)"}`;

  const rows: Array<{ label: string; hint?: string; a: ReactNode; b: ReactNode; group?: boolean }> = [
    { label: "This session", group: true, a: "", b: "" },
    { label: "Paragraphs loaded", a: `${sa.loaded} (${sa.made} made now)`, b: `${sb.loaded} (${sb.made} made now)` },
    { label: "Characters played", hint: "cache hits included", a: sa.charactersPlayed.toLocaleString(), b: sb.charactersPlayed.toLocaleString() },
    {
      label: "Billed now",
      hint: "paragraphs made this session; replays are free",
      a: `${sa.charactersBilled.toLocaleString()} chars · ${fmtUsd(sa.costNow)}`,
      b: `${sb.charactersBilled.toLocaleString()} chars · ${fmtUsd(sb.costNow)}`,
    },
    { label: "Avg generation latency", hint: "per paragraph, when it was made", a: secs(sa.avgLatencyMs), b: secs(sb.avgLatencyMs) },
    { label: "Time to first audio", hint: "first paragraph, in this browser", a: secs(sa.firstAudioMs), b: secs(sb.firstAudioMs) },
    { label: "Watermark", a: wm(sa, watermarkA), b: wm(sb, watermarkB) },
    { label: "All time (ledger)", group: true, a: "", b: "" },
    { label: "Paragraphs generated", a: String(ledgerA?.paragraphs ?? 0), b: String(ledgerB?.paragraphs ?? 0) },
    { label: "Characters billed", a: (ledgerA?.characters ?? 0).toLocaleString(), b: (ledgerB?.characters ?? 0).toLocaleString() },
    { label: "Avg generation latency", a: secs(ledgerA?.avgLatencyMs ?? null), b: secs(ledgerB?.avgLatencyMs ?? null) },
    { label: "Spent so far (est.)", a: fmtUsd(ledgerA?.estCostUsd ?? 0), b: fmtUsd(ledgerB?.estCostUsd ?? 0) },
    { label: "Cost", group: true, a: "", b: "" },
    {
      label: "Rate",
      hint: "USD per 1,000 characters, list price",
      a: rateText(ria),
      b: rateText(rib),
    },
    {
      label: "This chapter, once",
      hint: chapterChars === null ? undefined : `${chapterChars.toLocaleString()} characters`,
      a: perChapter(ra, chapterChars),
      b: perChapter(rb, chapterChars),
    },
    { label: "A full chapter", hint: `about ${charsPerChapter.toLocaleString()} characters`, a: perChapter(ra, charsPerChapter), b: perChapter(rb, charsPerChapter) },
    { label: `Per family per year, against the $${thresholds.heirloomPriceUsd} Heirloom price`, group: true, a: "", b: "" },
    { label: "Light", hint: `${scenarios.light} chapters`, a: yearly(ra, scenarios.light), b: yearly(rb, scenarios.light) },
    { label: "Typical", hint: `${scenarios.typical} chapters`, a: yearly(ra, scenarios.typical), b: yearly(rb, scenarios.typical) },
    { label: "Heavy", hint: `${scenarios.heavy} chapters`, a: yearly(ra, scenarios.heavy), b: yearly(rb, scenarios.heavy) },
  ];

  return (
    <Card className="px-0 py-3">
      <div className="overflow-x-auto px-4">
        <table className="w-full min-w-[320px] border-collapse text-left text-[13.5px]">
          <caption className="sr-only">Comparison of A and B</caption>
          <thead>
            <tr className="border-b border-[#2F3E62] text-[12px] text-[#A99F8C]">
              <th scope="col" className="py-2 pr-2 font-bold">
                Measure
              </th>
              <th scope="col" className="py-2 pr-2 font-bold text-[#E9A23B]">
                A · {labelOf(a)}
              </th>
              <th scope="col" className="py-2 font-bold text-[#E9A23B]">
                B · {labelOf(b)}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              r.group ? (
                <tr key={i}>
                  <th scope="colgroup" colSpan={3} className="pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8E99B5]">
                    {r.label}
                  </th>
                </tr>
              ) : (
                <tr key={i} className="border-b border-[#26345A] align-top">
                  <th scope="row" className="py-2 pr-2 font-semibold text-[#DCD2BE]">
                    {r.label}
                    {r.hint && <span className="block text-[11.5px] font-normal text-[#8E99B5]">{r.hint}</span>}
                  </th>
                  <td className="py-2 pr-2 tabular-nums text-[#FBF3E2]">{r.a}</td>
                  <td className="py-2 tabular-nums text-[#FBF3E2]">{r.b}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 px-4 text-[12px] leading-normal text-[#8E99B5]">
        Estimates use list prices from lib/voice/rates.json. Fit: <b>fits</b> = at or under the ${thresholds.marginGuideUsd} margin
        guide; <b>tight</b> = under ${thresholds.tightUsd}; <b>over</b> = more than that. Self-hosted Chatterbox is billed per GPU
        hour, not per character; its rate here is the research doc&apos;s planning figure, and <code>npm run voice:cost</code> also
        prices it from the measured GPU time.
      </p>
    </Card>
  );
}
