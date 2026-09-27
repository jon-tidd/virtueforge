"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChapterMeta } from "@/lib/voice/chapters";
import type { ProviderInfo } from "@/lib/voice/registry";
import type { ProviderId } from "@/lib/voice/types";
import type { PublicVoice } from "@/lib/voice/voices";
import { subscribeVoiceEvents, type VoiceStatus } from "./api";
import { ChapterPlayer } from "./ChapterPlayer";
import { Eyebrow, Title } from "./ui";

// Listen to a voice made earlier: "Who reads tonight" (after the Voices
// mockup), a chapter picker, the providers this voice was made with and each
// provider's allowed models, then the chapter paragraph by paragraph.

const selectClass =
  "mt-1.5 min-h-[48px] w-full rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 text-[16px] text-[#FBF3E2] outline-none focus:border-[#E9A23B]";

export function ListenPanel({
  voice,
  providers,
  chapters,
}: {
  voice: PublicVoice;
  providers: ProviderInfo[];
  chapters: ChapterMeta[];
}) {
  const first = voice.ownerName.split(/\s+/)[0];
  const bound = useMemo(
    () =>
      voice.bindings
        .map((b) => ({ binding: b, info: providers.find((p) => p.id === b.provider) }))
        .filter((x): x is { binding: (typeof voice.bindings)[number]; info: ProviderInfo } => Boolean(x.info)),
    [voice, providers],
  );

  const [chapterId, setChapterId] = useState(() => chapters.find((c) => c.id === "s1-ch01")?.id ?? chapters[0]?.id ?? "s1-ch01");
  const [provider, setProvider] = useState<ProviderId | null>(bound[0]?.info.id ?? null);
  const info = bound.find((b) => b.info.id === provider)?.info ?? null;
  const [model, setModel] = useState<string>(info?.defaultModel ?? "");
  const [status, setStatus] = useState<VoiceStatus>(voice.enabled ? "on" : "off");

  // The owner page in this browser can switch the voice off, or delete it, while this page is open.
  useEffect(
    () =>
      subscribeVoiceEvents((ev) => {
        if (ev.voiceId !== voice.id) return;
        if (ev.type === "voice-deleted") setStatus("deleted");
        else if (ev.type === "voice-off") setStatus((s) => (s === "deleted" ? s : "off"));
        else setStatus((s) => (s === "deleted" ? s : "on"));
      }),
    [voice.id],
  );

  const chapter = chapters.find((c) => c.id === chapterId);

  function pickProvider(id: ProviderId) {
    setProvider(id);
    setModel(providers.find((p) => p.id === id)?.defaultModel ?? "");
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <Eyebrow>{chapter ? `Chapter ${chapter.chapter} · ${chapter.tag}` : "Tonight's chapter"}</Eyebrow>
        <Title>Who reads tonight?</Title>
      </div>

      <div
        className="flex w-full items-center gap-3.5 rounded-[20px] border-2 border-[#E9A23B] bg-[#1F2B48] px-4 py-3.5"
        aria-label={`${first}'s story voice`}
      >
        <span
          aria-hidden="true"
          className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#A7869E] text-[20px] font-semibold text-[#FBF3E2]"
        >
          {first.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold text-[#F4E9D2]">{first}&apos;s story voice</span>
          <span className="block text-[13px] leading-snug text-[#B8AE9A]">Reads any chapter. {voice.label}.</span>
        </span>
        <span aria-hidden="true" className="box-border block h-[22px] w-[22px] shrink-0 rounded-full border-[7px] border-[#E9A23B]" />
      </div>
      <p className="-mt-2 text-[13px] leading-normal text-[#8E99B5]">
        Your own voice is best. A story voice is for nights you&apos;re away, or too tired to read.{" "}
        <Link href="/voice-lab">All voices</Link>
      </p>

      {status === "deleted" ? (
        <div role="status" className="rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 py-3 text-[14px] leading-normal text-[#DCD2BE]">
          <b className="text-[#FBF3E2]">{first} deleted this story voice.</b> Nothing of it is kept.{" "}
          <Link href="/voice-lab">Back to the voice lab</Link>
        </div>
      ) : status === "off" ? (
        <div role="status" className="rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 py-3 text-[14px] leading-normal text-[#DCD2BE]">
          <b className="text-[#FBF3E2]">{first} has switched this voice off.</b> It won&apos;t read until {first} switches it back on
          from their own link.
        </div>
      ) : bound.length === 0 ? (
        <div role="status" className="rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 py-3 text-[14px] text-[#DCD2BE]">
          No provider has made this voice yet. Finish it on the <Link href="/voice-lab">Record</Link> page.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="listen-chapter" className="block text-[13px] font-bold text-[#B8AE9A]">
                Chapter
              </label>
              <select id="listen-chapter" value={chapterId} onChange={(e) => setChapterId(e.target.value)} className={selectClass}>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch. {c.chapter} · {c.title}
                  </option>
                ))}
              </select>
            </div>

            {bound.length > 1 && (
              <fieldset>
                <legend className="text-[13px] font-bold text-[#B8AE9A]">Made with</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {bound.map(({ info: p }) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={provider === p.id}
                      onClick={() => pickProvider(p.id)}
                      className={`min-h-[44px] rounded-full border-[1.5px] px-4 text-[14px] font-bold ${
                        provider === p.id ? "border-[#E9A23B] text-[#E9A23B]" : "border-[#3A4A70] text-[#B8AE9A] hover:border-[#E9A23B]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {info && (
              <div className={bound.length > 1 ? "" : "sm:col-span-2"}>
                <label htmlFor="listen-model" className="block text-[13px] font-bold text-[#B8AE9A]">
                  {bound.length > 1 ? "Model" : `Model · ${info.label}`}
                </label>
                <select id="listen-model" value={model} onChange={(e) => setModel(e.target.value)} className={selectClass}>
                  {info.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                      {m === info.defaultModel ? " (default)" : ""}
                    </option>
                  ))}
                </select>
                {!info.configured && (
                  <p className="mt-1.5 text-[12.5px] text-[#F4C9BD]">
                    {info.label} isn&apos;t configured in .env.local: only chapters already made will play.
                  </p>
                )}
              </div>
            )}
          </div>

          {provider && (
            <ChapterPlayer
              key={`${voice.id}-${chapterId}-${provider}-${model}`}
              voiceId={voice.id}
              label={voice.label}
              provider={provider}
              model={model || undefined}
              chapterId={chapterId}
            />
          )}
        </>
      )}
    </div>
  );
}
