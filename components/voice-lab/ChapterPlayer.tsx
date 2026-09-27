"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { encodeWav } from "@/lib/voice/wav";
import {
  announcePlayerStart,
  ApiError,
  apiError,
  PLAYER_HEADER,
  subscribePlayerStart,
  subscribeVoiceEvents,
  voiceStatus,
  type VoiceStatus,
} from "./api";
import { Button, Card, ErrorNote, Eyebrow, fmtUsd, VoiceLabel } from "./ui";

// Plays a chapter paragraph by paragraph in a family voice. Each paragraph is
// fetched from /api/voice/audio/... (generated once, cached after). While one
// paragraph plays, the next is fetched. A Pause & ask stop halts playback and
// shows the question. There is no download link: audio plays from memory,
// the element has controlsList="nodownload", and the context menu is off.
// (A deterrent only, not DRM: anyone can record their speakers.)
//
// The owner's off switch wins over anything already in memory: a 403
// voice_off (from a play or a prefetch), a status re-check before each
// paragraph, or an event from the owner page in this browser stops playback
// and revokes every fetched paragraph.
//
// Only one player plays at a time (the compare page has two): starting one
// pauses the others. iOS Safari only lets a media element start inside a tap,
// but a paragraph can take seconds to generate, so the first tap "unlocks" the
// element with a moment of silence before any await.

export type ManifestItem =
  | { type: "paragraph"; index: number; text: string }
  | { type: "pause"; question: string; answersFirst?: string };

export interface Manifest {
  meta: { id: string; title: string; chapter: number; tag: string };
  items: ManifestItem[];
  paragraphCount: number;
  characters: number;
  lastPage: string;
  source: string;
}

export interface ParagraphStats {
  paragraph: number;
  cache: string;
  provider: string;
  model: string;
  characters: number;
  latencyMs: number;
  /** Time for this browser to get the audio (cache hits are fast). */
  fetchMs: number;
  estCostUsd: number;
  watermark: string;
}

interface Loaded {
  url: string;
  stats: ParagraphStats;
}

type OffReason = Exclude<VoiceStatus, "on">;

/** How many times a paragraph is retried when the provider is busy (429 rate_limited). */
const BUSY_RETRIES = 3;
const BUSY_RETRY_MS = 4000;

let silentUrl: string | null = null;
/** A 50 ms silent WAV, to unlock the audio element inside the tap (iOS). */
function silence(): string {
  if (!silentUrl) silentUrl = URL.createObjectURL(new Blob([encodeWav(new Int16Array(400), 8000) as BlobPart], { type: "audio/wav" }));
  return silentUrl;
}

export async function fetchManifest(chapterId: string): Promise<Manifest> {
  const res = await fetch(`/api/voice/chapters/${encodeURIComponent(chapterId)}`, { cache: "no-store" });
  if (!res.ok) throw await apiError(res, "Chapter failed");
  return res.json();
}

export function audioPath(voiceId: string, chapterId: string, i: number, provider?: string, model?: string) {
  const q = new URLSearchParams();
  if (provider) q.set("provider", provider);
  if (model) q.set("model", model);
  const qs = q.toString();
  return `/api/voice/audio/${encodeURIComponent(voiceId)}/${encodeURIComponent(chapterId)}/${i}${qs ? `?${qs}` : ""}`;
}

export async function fetchParagraph(
  voiceId: string,
  chapterId: string,
  i: number,
  provider?: string,
  model?: string,
): Promise<Loaded> {
  const t0 = performance.now();
  const res = await fetch(audioPath(voiceId, chapterId, i, provider, model), { cache: "no-store", headers: { [PLAYER_HEADER]: "1" } });
  if (!res.ok) throw await apiError(res, "Audio failed");
  const blob = await res.blob();
  const h = res.headers;
  return {
    url: URL.createObjectURL(blob),
    stats: {
      paragraph: i,
      cache: h.get("x-voice-cache") ?? "?",
      provider: h.get("x-voice-provider") ?? provider ?? "?",
      model: h.get("x-voice-model") ?? model ?? "?",
      characters: Number(h.get("x-voice-characters")) || 0,
      latencyMs: Number(h.get("x-voice-latency-ms")) || 0,
      fetchMs: Math.round(performance.now() - t0),
      estCostUsd: Number(h.get("x-voice-est-cost-usd")) || 0,
      watermark: h.get("x-voice-watermark") ?? "?",
    },
  };
}

function offReasonOf(e: unknown): OffReason | null {
  if (!(e instanceof ApiError)) return null;
  if (e.code === "voice_off") return "off";
  if (e.code === "voice_not_found") return "deleted";
  return null;
}

export function ChapterPlayer({
  voiceId,
  label,
  provider,
  model,
  chapterId,
  previewOnly = false,
  heading,
  onStats,
}: {
  voiceId: string;
  label: string;
  provider?: string;
  model?: string;
  chapterId: string;
  /** Just the first paragraph (the "hear it first" preview). */
  previewOnly?: boolean;
  heading?: string;
  onStats?: (s: ParagraphStats) => void;
}) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pausedAt, setPausedAt] = useState<ManifestItem | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<Record<number, ParagraphStats>>({});
  const [offReason, setOffReason] = useState<OffReason | null>(null);
  const [busy, setBusy] = useState(false);

  const playerId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  /** The object URL the element is playing for posRef.current; "ended" from anything else is ignored. */
  const playingUrlRef = useRef<string | null>(null);
  /** Bumped by every playAt: an older call that finishes loading late gives up. */
  const playTokenRef = useRef(0);
  const unlockedRef = useRef(false);
  const busyTriesRef = useRef(0);
  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef(new Map<number, Promise<Loaded>>());
  /** Bumped whenever fetched audio is thrown away; late responses from an older generation are revoked. */
  const genRef = useRef(0);
  const posRef = useRef(0);
  const onStatsRef = useRef(onStats);
  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);

  useEffect(() => {
    let alive = true;
    fetchManifest(chapterId)
      .then((m) => alive && setManifest(m))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [chapterId]);

  /** Revoke every fetched paragraph (played, playing or prefetched) and forget it. */
  const dropFetched = useCallback(() => {
    genRef.current++;
    const cache = cacheRef.current;
    cache.forEach((p) => p.then((l) => URL.revokeObjectURL(l.url)).catch(() => undefined));
    cache.clear();
  }, []);

  // Start over (and drop fetched audio) when the voice, provider, model or chapter changes.
  useEffect(() => dropFetched, [voiceId, provider, model, chapterId, dropFetched]);

  const clearBusy = useCallback(() => {
    if (busyTimerRef.current) clearTimeout(busyTimerRef.current);
    busyTimerRef.current = null;
    setBusy(false);
  }, []);
  useEffect(() => clearBusy, [clearBusy]);

  /** The owner switched the voice off (or deleted it): stop now and keep nothing in memory. */
  const shutOff = useCallback(
    (reason: OffReason) => {
      posRef.current = -1; // any playAt still awaiting audio gives up
      playTokenRef.current++;
      playingUrlRef.current = null;
      clearBusy();
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
      dropFetched();
      setPlaying(false);
      setLoading(false);
      setPausedAt(null);
      setProgress(0);
      setError(null);
      setOffReason(reason);
    },
    [dropFetched, clearBusy],
  );

  // Another player on this page started: pause this one.
  useEffect(
    () =>
      subscribePlayerStart((id) => {
        if (id === playerId) return;
        const el = audioRef.current;
        if (el && !el.paused) el.pause();
        setPlaying(false);
      }),
    [playerId],
  );

  /** Call first thing in a tap handler, before any await: lets iOS start this element later. */
  const unlockAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el || unlockedRef.current) return;
    unlockedRef.current = true;
    el.src = silence();
    const p = el.play();
    el.pause();
    p?.catch(() => undefined);
  }, []);

  // The owner page in this browser (any tab) announces off / on / deleted.
  useEffect(
    () =>
      subscribeVoiceEvents((ev) => {
        if (ev.voiceId !== voiceId) return;
        if (ev.type === "voice-off") shutOff("off");
        else if (ev.type === "voice-deleted") shutOff("deleted");
        else if (ev.type === "voice-on") setOffReason((r) => (r === "off" ? null : r));
      }),
    [voiceId, shutOff],
  );

  const items = useMemo<ManifestItem[]>(
    () => (manifest ? (previewOnly ? manifest.items.filter((it) => it.type === "paragraph").slice(0, 1) : manifest.items) : []),
    [manifest, previewOnly],
  );

  const load = useCallback(
    (i: number) => {
      let p = cacheRef.current.get(i);
      if (!p) {
        const gen = genRef.current;
        p = fetchParagraph(voiceId, chapterId, i, provider, model).then((l) => {
          if (gen !== genRef.current) {
            URL.revokeObjectURL(l.url);
            throw new ApiError("stale", "This paragraph is no longer needed", 0);
          }
          setStats((s) => ({ ...s, [i]: l.stats }));
          onStatsRef.current?.(l.stats);
          return l;
        });
        p.catch((e: unknown) => {
          if (cacheRef.current.get(i) === p) cacheRef.current.delete(i);
          const off = offReasonOf(e);
          if (off) shutOff(off); // a prefetch that meets the off switch stops the current paragraph too
        });
        cacheRef.current.set(i, p);
      }
      return p;
    },
    [voiceId, chapterId, provider, model, shutOff],
  );

  const nextParagraphAfter = useCallback(
    (itemPos: number): number | null => {
      for (let j = itemPos + 1; j < items.length; j++) {
        const it = items[j];
        if (it.type === "paragraph") return it.index;
      }
      return null;
    },
    [items],
  );

  const playAt = useCallback(
    async (itemPos: number, isRetry = false) => {
      const token = ++playTokenRef.current;
      const el = audioRef.current;
      // Stop the old paragraph now, so it can't fire "ended" while this one loads.
      playingUrlRef.current = null;
      if (el && !el.paused) el.pause();
      if (!isRetry) {
        busyTriesRef.current = 0;
        clearBusy();
      }
      setError(null);
      setFinished(false);
      setPausedAt(null);
      setProgress(0);
      posRef.current = itemPos;
      setPos(itemPos);
      const it = items[itemPos];
      if (!it) {
        setPlaying(false);
        setFinished(true);
        return;
      }
      if (it.type === "pause") {
        setPlaying(false);
        setPausedAt(it);
        return;
      }
      setLoading(true);
      try {
        // Re-check the owner's switch before every paragraph, alongside the fetch.
        const [loaded, status] = await Promise.all([load(it.index), voiceStatus(voiceId)]);
        if (status !== "on") {
          shutOff(status);
          return;
        }
        if (token !== playTokenRef.current || posRef.current !== itemPos) return; // user jumped elsewhere meanwhile
        setOffReason(null);
        clearBusy();
        const next = nextParagraphAfter(itemPos);
        if (next !== null) void load(next).catch(() => undefined); // prefetch
        if (!el) return;
        playingUrlRef.current = loaded.url;
        el.src = loaded.url;
        announcePlayerStart(playerId);
        await el.play();
        if (token === playTokenRef.current) setPlaying(true);
      } catch (e) {
        if (token !== playTokenRef.current) return;
        const off = offReasonOf(e);
        if (off) {
          shutOff(off);
        } else if (e instanceof ApiError && e.code === "stale") {
          // thrown-away prefetch; nothing to say
        } else if (e instanceof ApiError && e.code === "rate_limited" && busyTriesRef.current < BUSY_RETRIES) {
          // The provider is busy (429): say so and try again shortly.
          busyTriesRef.current++;
          setPlaying(false);
          setBusy(true);
          busyTimerRef.current = setTimeout(() => {
            busyTimerRef.current = null;
            if (token === playTokenRef.current) void playAt(itemPos, true);
          }, BUSY_RETRY_MS);
        } else if (e instanceof DOMException && e.name === "AbortError") {
          // play() interrupted by a newer tap
        } else {
          setPlaying(false);
          clearBusy();
          setError(
            e instanceof DOMException && e.name === "NotAllowedError"
              ? "Tap play again to start."
              : e instanceof Error
                ? e.message
                : "Couldn't play this paragraph",
          );
        }
      } finally {
        if (token === playTokenRef.current) setLoading(false);
      }
    },
    [items, load, nextParagraphAfter, shutOff, voiceId, playerId, clearBusy],
  );

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    unlockAudio();
    const resumable = playingUrlRef.current !== null && el.src === playingUrlRef.current && !el.ended && el.currentTime > 0;
    if (resumable && !pausedAt && !offReason) {
      announcePlayerStart(playerId);
      const resumed = el.play(); // inside the tap
      const status = await voiceStatus(voiceId);
      if (status !== "on") return shutOff(status);
      await resumed
        .then(() => setPlaying(true))
        .catch((e: unknown) =>
          setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Tap play again to start." : "Couldn't resume. Tap a paragraph to start there."),
        );
      return;
    }
    void playAt(offReason ? pos : pausedAt ? pos + 1 : finished ? 0 : pos);
  };

  const onEnded = (e: SyntheticEvent<HTMLAudioElement>) => {
    // Only the paragraph we are on may advance the reader: never the unlock
    // silence, and never a paragraph the listener already tapped away from.
    if (!playingUrlRef.current || e.currentTarget.src !== playingUrlRef.current) return;
    playingUrlRef.current = null;
    setPlaying(false);
    if (posRef.current >= 0) void playAt(posRef.current + 1);
  };

  // Progress through the whole chapter (or the preview), not just the current clip.
  const paragraphCount = items.filter((it) => it.type === "paragraph").length;
  const paragraphsBefore = items.slice(0, pos).filter((it) => it.type === "paragraph").length;
  const chapterProgress = finished
    ? 1
    : paragraphCount === 0
      ? 0
      : Math.min(1, (paragraphsBefore + (items[pos]?.type === "paragraph" ? progress : 0)) / paragraphCount);

  const chars = previewOnly ? ((items[0] as { text?: string })?.text?.length ?? 0) : (manifest?.characters ?? 0);
  const totals = Object.values(stats);
  const totalCost = totals.reduce((n, s) => n + s.estCostUsd, 0);
  const deleted = offReason === "deleted";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          {heading ?? (manifest ? `${previewOnly ? "Preview · " : ""}Ch. ${manifest.meta.chapter} · ${manifest.meta.title}` : "Loading chapter…")}
        </Eyebrow>
        <VoiceLabel label={label} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={!manifest || (loading && !busy) || deleted}
          aria-label={playing ? "Pause" : offReason ? "Check again and play" : "Play"}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#E9A23B] disabled:opacity-50"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-[#16203A] border-t-transparent" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#16203A" aria-hidden="true">
              <path d={playing ? "M7 5h4v14H7zM13 5h4v14h-4z" : "M8 5l11 7-11 7z"} />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="text-[14px] font-bold" aria-live="polite">
            {offReason
              ? deleted
                ? "Deleted by its owner"
                : "Switched off by its owner"
              : busy
                ? "The voice service is busy. Retrying…"
                : loading
                  ? "Getting the next page ready…"
                  : playing
                    ? "Reading"
                    : finished
                      ? previewOnly
                        ? "That was the preview"
                        : "The end of the chapter"
                      : pausedAt
                        ? "Paused to ask"
                        : "Ready"}
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded bg-[#2F3E62]"
            role="progressbar"
            aria-label={previewOnly ? "Preview progress" : "Chapter progress"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(chapterProgress * 100)}
          >
            <div className="h-full bg-[#E9A23B] transition-[width]" style={{ width: `${Math.round(chapterProgress * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* The only audio element. No controls, no download, no context menu. */}
      <audio
        ref={audioRef}
        controlsList="nodownload noplaybackrate"
        preload="auto"
        onContextMenu={(e) => e.preventDefault()}
        onEnded={onEnded}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.src !== playingUrlRef.current) return;
          setProgress(el.duration ? el.currentTime / el.duration : 0);
        }}
        className="hidden"
      />

      {offReason && (
        <div role="status" className="mt-4 rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 py-3 text-[14px] leading-normal text-[#DCD2BE]">
          {deleted ? (
            <>
              <b className="text-[#FBF3E2]">This voice was deleted by its owner.</b> Nothing of it is kept on this page.
            </>
          ) : (
            <>
              <b className="text-[#FBF3E2]">This voice was switched off by its owner.</b> Nothing plays until they switch it back on.
              Pages already fetched were cleared from this page.
            </>
          )}
        </div>
      )}

      <ErrorNote>{error}</ErrorNote>

      {pausedAt && pausedAt.type === "pause" && (
        <div className="mt-4 rounded-2xl border-2 border-[#E9A23B] bg-[#131B31] p-4">
          <Eyebrow>Pause &amp; ask</Eyebrow>
          <p className="font-story mt-2 text-[18px] leading-[1.55] text-[#FBF3E2]">{pausedAt.question}</p>
          {pausedAt.answersFirst && <p className="mt-2 text-[13px] text-[#B8AE9A]">Let {pausedAt.answersFirst} answer first.</p>}
          <Button
            type="button"
            className="mt-3"
            onClick={() => {
              unlockAudio();
              void playAt(pos + 1);
            }}
          >
            Keep reading
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {items.map((it, k) =>
          it.type === "paragraph" ? (
            <button
              key={k}
              type="button"
              disabled={deleted}
              onClick={() => {
                unlockAudio();
                void playAt(k);
              }}
              className={`font-story min-h-[44px] rounded-[10px] px-2.5 py-1.5 text-left text-[17px] leading-[1.6] transition disabled:cursor-default ${
                k === pos && (playing || loading) ? "bg-[#2A2012] text-[#FBF0DA]" : "text-[#9C9280] hover:text-[#DCD2BE]"
              }`}
            >
              {it.text}
              {stats[it.index] && (
                <span className="font-ui mt-1 block text-[11.5px] text-[#8E99B5]">
                  {stats[it.index].cache === "hit" ? "cached" : `made in ${(stats[it.index].latencyMs / 1000).toFixed(1)} s`}
                  {" · "}
                  {stats[it.index].characters} chars · {fmtUsd(stats[it.index].estCostUsd)} · watermark: {stats[it.index].watermark}
                </span>
              )}
            </button>
          ) : (
            <div key={k} className="px-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#E9A23B]">
              · Pause &amp; ask ·
            </div>
          ),
        )}
      </div>

      {manifest && (
        <div className="mt-3 border-t border-[#2F3E62] pt-3 text-[12.5px] text-[#8E99B5]">
          {chars.toLocaleString()} characters{previewOnly ? " in this preview" : " in this chapter"}
          {totals.length > 0 && ` · ${totals.length} paragraph${totals.length === 1 ? "" : "s"} loaded · est. ${fmtUsd(totalCost)}`}
          {manifest.source === "fixture" && !previewOnly && " · fixture text (canon §8 sample page)"}
        </div>
      )}
      {finished && manifest?.lastPage && !previewOnly && (
        <p className="font-story mt-3 text-[15px] italic text-[#DCD2BE]">{manifest.lastPage}</p>
      )}
    </Card>
  );
}
