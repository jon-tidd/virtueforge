"use client";

import { Button, fmtSeconds } from "./ui";
import { useRecorder, type Recording } from "./useRecorder";

// One thing to read aloud: the script card (cream, like the VoiceCapture
// mockup), a level meter, a timer, and the big record button.

export function RecordPanel({
  eyebrow,
  title,
  help,
  script,
  maxSeconds,
  minSeconds,
  accepted,
  onAccept,
}: {
  eyebrow: string;
  title: string;
  help: string;
  script: string;
  maxSeconds: number;
  minSeconds: number;
  accepted?: Recording | null;
  onAccept: (r: Recording) => void;
}) {
  const rec = useRecorder(maxSeconds);
  const recording = rec.recording ?? accepted ?? null;
  const live = rec.state === "recording";
  const bars = Array.from({ length: 36 }, (_, i) => rec.history[i] ?? 0);
  const tooShort = recording ? recording.seconds < minSeconds : false;
  // For screen readers: state changes only. The ticking timer and the level
  // hint stay out of the live region, so nothing is read aloud (and recorded)
  // while the person is reading the card.
  const announcement = live
    ? "Recording started. Read the card out loud."
    : recording
      ? `Recording stopped at ${fmtSeconds(recording.seconds)}.${tooShort ? " That was short. Please read the whole card." : ""}`
      : rec.state === "requesting"
        ? "Asking for the microphone."
        : "";

  return (
    <div className="rounded-[26px] bg-[#F7F1E5] p-5 text-[#1F1A14] sm:p-6">
      <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8A5212]">{eyebrow}</div>
      <h2 className="font-display mt-1.5 text-[26px] font-semibold leading-[1.1]">{title}</h2>
      <p className="mt-2 text-[15px] leading-normal text-[#4A4034]">{help}</p>
      <div className="mt-4 rounded-[22px] border-2 border-[#E9A23B] bg-[#FFFCF5] px-5 py-4">
        <p className="font-story text-[19px] leading-[1.6] sm:text-[21px]">{script}</p>
      </div>

      <div className="mt-5 flex h-[50px] items-center justify-center gap-[4px]" aria-hidden="true">
        {bars.map((v, i) => (
          <span
            key={i}
            className="block w-[4px] rounded-[2px]"
            style={{ height: `${Math.max(4, v * 46)}px`, background: live && v > 0.02 ? "#D9573A" : "#E2D5BC" }}
          />
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      <div className="mt-1 text-center text-[13px] font-bold text-[#6A5D4B]" aria-hidden={live ? true : undefined}>
        {live
          ? `Recording · ${fmtSeconds(rec.seconds)}${rec.level < 0.02 ? " · we can't hear you yet" : ""}`
          : recording
            ? `Recorded ${fmtSeconds(recording.seconds)}`
            : rec.state === "requesting"
              ? "Asking for the microphone…"
              : "Tap the button, then read the card out loud"}
      </div>

      <div className="mt-3 flex flex-col items-center">
        <button
          type="button"
          onClick={live ? rec.stop : rec.start}
          disabled={rec.state === "requesting"}
          aria-label={live ? "Stop recording" : "Start recording"}
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-[6px] border-[#F3DDB1] bg-[#D9573A] disabled:opacity-50"
        >
          {live ? (
            <span className="block h-7 w-7 rounded-md bg-white" />
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          )}
        </button>
        <div className="mt-2 text-[14px] font-bold text-[#4A4034]">{live ? "Tap to stop" : recording ? "Tap to record again" : "Tap and read"}</div>
      </div>

      {rec.error && (
        <p role="alert" className="mt-3 text-center text-[14px] font-semibold text-[#A3321A]">
          {rec.error}
        </p>
      )}

      {recording && !live && (
        <div className="mt-4 flex flex-col gap-3">
          {/* Your own recording, for checking. No download link. */}
          <audio src={recording.url} controls controlsList="nodownload" className="w-full" onContextMenu={(e) => e.preventDefault()} />
          {tooShort && (
            <p className="text-center text-[13.5px] text-[#A3321A]">That was short. Please read the whole card.</p>
          )}
          <Button type="button" disabled={tooShort} onClick={() => onAccept(recording)}>
            {accepted && accepted.url === recording.url ? "Saved. Next" : "Sounds right, use this"}
          </Button>
        </div>
      )}
    </div>
  );
}
