"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildConsentStatement, firstName, voiceLabelPreview } from "@/lib/voice/consent-text";
import type { GuidedPassage } from "@/lib/voice/guided-reading";
import type { ProviderInfo } from "@/lib/voice/registry";
import type { ProviderBinding, ProviderId, VoiceRecord } from "@/lib/voice/types";
import { ownerPagePath } from "./api";
import { ChapterPlayer } from "./ChapterPlayer";
import { RecordPanel } from "./RecordPanel";
import { Button, Card, Check, ErrorNote, Eyebrow, fmtSeconds, Title } from "./ui";
import type { Recording } from "./useRecorder";

// The voice lab flow, matching the mockups (VoiceIntro -> VoiceCapture -> VoiceReady):
// 1 who is recording (adults only, own voice) · 2 consent read aloud ·
// 3 about 3 minutes of guided reading · 4 make the voice · 5 hear a preview,
// with the label · 6 Chapter 1, paragraph by paragraph.
//
// The owner link is the only way to switch the voice off or delete it, so the
// flow stops after the recording is saved until the person ticks "I've saved
// my owner link". (If it is lost anyway: scripts/voice-owner-link.mjs issues a
// new one on this machine.)

type PublicVoice = Omit<VoiceRecord, "ownerTokenHash">;
type Step = "who" | "consent" | "reading" | "create" | "preview" | "listen";
const STEPS: Step[] = ["who", "consent", "reading", "create", "preview", "listen"];
const TARGET_SECONDS = 180;

export function VoiceLab(props: {
  childrenPhrase: string;
  consentScriptVersion: string;
  passages: GuidedPassage[];
  providers: ProviderInfo[];
  defaultProvider: ProviderId;
  voices: PublicVoice[];
  chapterId: string;
  minSampleSeconds: number;
  minConsentSeconds: number;
}) {
  const [step, setStep] = useState<Step>("who");
  const [ownerName, setOwnerName] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [adult, setAdult] = useState(false);
  const [ownVoice, setOwnVoice] = useState(false);
  const [noChild, setNoChild] = useState(false);
  const [consent, setConsent] = useState<Recording | null>(null);
  const [samples, setSamples] = useState<Record<string, Recording>>({});
  const [passageIdx, setPassageIdx] = useState(0);
  const [chosen, setChosen] = useState<Set<ProviderId>>(() => new Set([props.defaultProvider]));
  const [created, setCreated] = useState<{ voiceId: string; ownerPath: string; ownerToken: string; label: string } | null>(null);
  const [bindings, setBindings] = useState<Partial<Record<ProviderId, ProviderBinding | string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playProvider, setPlayProvider] = useState<ProviderId | null>(null);
  const [linkSaved, setLinkSaved] = useState(false);
  /** After re-recording a stale consent, go straight back to making the voice. */
  const [consentReturnTo, setConsentReturnTo] = useState<Step | null>(null);
  const [consentNote, setConsentNote] = useState<string | null>(null);

  const statement = useMemo(() => buildConsentStatement(ownerName || "…", props.childrenPhrase), [ownerName, props.childrenPhrase]);
  const recordedSeconds = Object.values(samples).reduce((n, r) => n + r.seconds, 0);
  const whoReady = ownerName.trim().length > 0 && relationship.trim().length > 0 && adult && ownVoice && noChild;
  const boundOk = Object.entries(bindings).filter(([, b]) => typeof b === "object") as Array<[ProviderId, ProviderBinding]>;
  // "About 3 minutes": the main path is every passage, or the full target time.
  const readingDone = Object.keys(samples).length === props.passages.length || recordedSeconds >= TARGET_SECONDS;

  /** Step 4a: store the consent and the samples (no provider call yet) and get the owner link. */
  async function saveRecording() {
    if (!consent || created) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("ownerName", ownerName.trim());
      form.set("relationship", relationship.trim());
      form.set("attestAdult", String(adult));
      form.set("attestOwnVoice", String(ownVoice));
      form.set("attestNoChildVoice", String(noChild));
      form.set("consentText", buildConsentStatement(ownerName.trim(), props.childrenPhrase));
      form.set("consentScriptVersion", props.consentScriptVersion);
      form.set("consentSpokenAt", consent.startedAt);
      form.set("consentAudio", new Blob([consent.wav as BlobPart], { type: "audio/wav" }), "consent.wav");
      for (const [id, rec] of Object.entries(samples)) {
        form.set(`sample:${id}`, new Blob([rec.wav as BlobPart], { type: "audio/wav" }), `${id}.wav`);
      }
      const res = await fetch("/api/voice/voices", { method: "POST", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (body?.error === "consent_stale") {
          // Too long since the statement was read: read it again, then come straight back here.
          setConsent(null);
          setConsentReturnTo("create");
          setConsentNote(body.message);
          setStep("consent");
          return;
        }
        throw new Error(body?.message ?? `Saving failed (${res.status})`);
      }
      // The owner page takes the token in the URL fragment, never in a path.
      setCreated({ voiceId: body.voice.id, ownerPath: ownerPagePath(body.ownerToken), ownerToken: body.ownerToken, label: body.voice.label });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  /** Step 4b: make the provider voice(s), only once the owner link is saved. */
  async function makeVoices() {
    if (!created || !linkSaved) return;
    setBusy(true);
    setError(null);
    try {
      const results: Partial<Record<ProviderId, ProviderBinding | string>> = { ...bindings };
      for (const p of chosen) {
        if (typeof results[p] === "object") continue;
        const res = await fetch(`/api/voice/voices/${created.voiceId}/bindings`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-voice-owner-token": created.ownerToken },
          body: JSON.stringify({ provider: p }),
        });
        const body = await res.json().catch(() => null);
        results[p] = res.ok ? (body.binding as ProviderBinding) : (body?.message ?? `failed (${res.status})`);
        setBindings({ ...results });
      }
      const firstOk = (Object.entries(results).find(([, b]) => typeof b === "object")?.[0] ?? null) as ProviderId | null;
      if (firstOk) {
        setPlayProvider(firstOk);
        setStep("preview");
      } else {
        setError("No provider could make the voice. See the messages above.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const dots = (
    <div className="mt-2 flex gap-1.5" aria-hidden="true">
      {STEPS.map((s, i) => (
        <span key={s} className="h-2 flex-1 rounded" style={{ background: i <= STEPS.indexOf(step) ? "#E9A23B" : "#2F3E62" }} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {dots}

      {step === "who" && (
        <>
          <div>
            <Eyebrow>Heirloom · family story voice · prototype</Eyebrow>
            <Title>Make a story voice from your own recording.</Title>
            <p className="mt-2 text-[14.5px] leading-normal text-[#B8AE9A]">
              About 3 minutes of guided reading, once. We make a story voice you hear first, labeled “
              {voiceLabelPreview(ownerName)}”. It reads only our chapters, can&apos;t be downloaded, and you can switch it off or
              delete it all from your own link.
            </p>
          </div>
          <Card>
            <label className="block text-[13px] font-bold text-[#B8AE9A]" htmlFor="owner-name">
              Your name (the person recording)
            </label>
            <input
              id="owner-name"
              value={ownerName}
              onChange={(e) => {
                // The consent recording names the speaker: a new first name needs a new recording.
                if (consent && firstName(e.target.value) !== firstName(ownerName)) setConsent(null);
                setOwnerName(e.target.value);
              }}
              maxLength={60}
              autoComplete="name"
              className="mt-1.5 w-full rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 py-3 text-[16px] text-[#FBF3E2] outline-none focus:border-[#E9A23B]"
            />
            <label className="mt-4 block text-[13px] font-bold text-[#B8AE9A]" htmlFor="relationship">
              You are the children&apos;s…
            </label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 py-3 text-[16px] text-[#FBF3E2]"
            >
              {["Parent", "Grandparent", "Aunt or uncle", "Godparent", "Other grown-up"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <div className="mt-4 border-t border-[#2F3E62] pt-2">
              <Check checked={adult} onChange={setAdult}>
                <b>I am 18 or older.</b>
              </Check>
              <Check checked={ownVoice} onChange={setOwnVoice}>
                <b>This is my own voice,</b> and I&apos;m the one recording. Nobody can make a voice for someone else.
              </Check>
              <Check checked={noChild} onChange={setNoChild}>
                <b>No child&apos;s voice</b> will be in these recordings. Kids are never recorded to make a voice.
              </Check>
            </div>
          </Card>
          <Button disabled={!whoReady} onClick={() => setStep("consent")}>
            Next: your permission
          </Button>
          <ExistingVoices voices={props.voices} />
        </>
      )}

      {step === "consent" && (
        <>
          {consentNote && (
            <div role="status" className="rounded-2xl border border-[#E9A23B] bg-[#131B31] px-4 py-3 text-[14px] leading-normal text-[#F4E9D2]">
              {consentNote} Your reading is kept; only this statement needs doing again.
            </div>
          )}
          <RecordPanel
            eyebrow="Before we start · your permission"
            title="First, please read this out loud."
            help="This shows it's really you. We keep it with the time you said yes."
            script={`“${statement}”`}
            maxSeconds={60}
            minSeconds={props.minConsentSeconds}
            accepted={consent}
            onAccept={(r) => {
              setConsent(r);
              setConsentNote(null);
              setStep(consentReturnTo ?? "reading");
              setConsentReturnTo(null);
            }}
          />
          <Button variant="ghost" onClick={() => setStep("who")}>
            Back
          </Button>
        </>
      )}

      {step === "reading" && (
        <>
          <div className="flex items-center justify-between text-[13px] font-bold text-[#B8AE9A]">
            <span>
              Passage {passageIdx + 1} of {props.passages.length}
            </span>
            <span>
              {fmtSeconds(recordedSeconds)} of about {fmtSeconds(TARGET_SECONDS)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-[#2F3E62]">
            <div className="h-full bg-[#E9A23B]" style={{ width: `${Math.min(100, (recordedSeconds / TARGET_SECONDS) * 100)}%` }} />
          </div>
          {props.passages.map((p, i) =>
            i === passageIdx ? (
              <RecordPanel
                key={p.id}
                eyebrow={`Step ${i + 1} of ${props.passages.length} · ${p.title}`}
                title={i === 0 ? "Now a little story, nice and slow." : p.title}
                help={p.help}
                script={p.text}
                maxSeconds={120}
                minSeconds={5}
                accepted={samples[p.id] ?? null}
                onAccept={(r) => {
                  setSamples((s) => ({ ...s, [p.id]: r }));
                  if (i + 1 < props.passages.length) setPassageIdx(i + 1);
                }}
              />
            ) : null,
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => (passageIdx > 0 ? setPassageIdx(passageIdx - 1) : setStep("consent"))}>
              Back
            </Button>
            {passageIdx + 1 < props.passages.length && samples[props.passages[passageIdx].id] && (
              <Button variant="ghost" onClick={() => setPassageIdx(passageIdx + 1)}>
                Next passage
              </Button>
            )}
            <Button
              variant={readingDone ? "primary" : "ghost"}
              disabled={recordedSeconds < props.minSampleSeconds}
              onClick={() => setStep("create")}
              title={recordedSeconds < props.minSampleSeconds ? `At least ${props.minSampleSeconds} s of reading` : undefined}
            >
              {readingDone ? "All done. Make my voice" : "Make my voice now (shorter reading, may sound less like you)"}
            </Button>
          </div>
        </>
      )}

      {step === "create" && (
        <>
          <div>
            <Eyebrow>All done · {fmtSeconds(recordedSeconds)}</Eyebrow>
            <Title>Thank you, {ownerName.trim().split(/\s+/)[0]}.</Title>
            <p className="mt-2 text-[14.5px] text-[#B8AE9A]">
              Pick who makes the voice. For the comparison, make it with two. Your recordings stay on this machine; the provider gets
              only the reading samples (never your consent recording or your name).
            </p>
            {!readingDone && (
              <p className="mt-2 text-[13.5px] font-bold text-[#F2C46B]">
                {fmtSeconds(recordedSeconds)} of about {fmtSeconds(TARGET_SECONDS)} recorded: the voice may sound less like you. You can
                go back and read more first.
              </p>
            )}
          </div>
          <Card>
            {props.providers.map((p) => {
              const b = bindings[p.id];
              return (
                <label key={p.id} className={`flex items-start gap-3 py-2 ${p.configured ? "cursor-pointer" : "opacity-50"}`}>
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-[#E9A23B]"
                    disabled={!p.configured || typeof b === "object"}
                    checked={chosen.has(p.id)}
                    onChange={(e) =>
                      setChosen((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(p.id);
                        else n.delete(p.id);
                        return n;
                      })
                    }
                  />
                  <span className="flex-1">
                    <span className="block font-bold">{p.label}</span>
                    <span className="block text-[12.5px] text-[#A99F8C]">
                      {p.configured ? `default model ${p.defaultModel}` : "not configured in .env.local"}
                      {p.watermark ? " · watermark" : ""}
                      {p.configured ? ` · from ${fmtSeconds(recordedSeconds)} of reading` : ""}
                    </span>
                    {typeof b === "object" && (
                      <span className="block text-[12.5px] font-bold text-[#B9D3A6]">
                        Made ✓{b.requiresVerification ? " (the provider asks for extra verification; see its dashboard)" : ""}
                      </span>
                    )}
                    {typeof b === "string" && <span className="block text-[12.5px] font-bold text-[#F4C9BD]">{b}</span>}
                  </span>
                </label>
              );
            })}
          </Card>
          {created && (
            <>
              <OwnerLink path={created.ownerPath} />
              <div className="rounded-2xl border border-[#3A4A70] px-4">
                <Check checked={linkSaved} onChange={setLinkSaved}>
                  <b>I&apos;ve saved my owner link</b> somewhere safe. Without it I can&apos;t switch this voice off or delete it.
                </Check>
              </div>
            </>
          )}
          <ErrorNote>{error}</ErrorNote>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setStep("reading")} disabled={busy || Boolean(created)}>
              Back
            </Button>
            {!created ? (
              <Button onClick={() => void saveRecording()} disabled={busy || chosen.size === 0}>
                {busy ? "Saving your recording…" : "Save my recording"}
              </Button>
            ) : (
              <Button onClick={() => void makeVoices()} disabled={busy || chosen.size === 0 || !linkSaved}>
                {busy ? "Making your voice…" : boundOk.length ? "Make it with the checked providers" : "Make my story voice"}
              </Button>
            )}
            {boundOk.length > 0 && (
              <Button variant="ghost" onClick={() => setStep("preview")}>
                Go to preview
              </Button>
            )}
          </div>
        </>
      )}

      {(step === "preview" || step === "listen") && created && playProvider && (
        <>
          <div className="flex flex-col items-center text-center">
            <div className="font-display flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#6C8FB0] text-[38px] font-semibold text-[#FBF3E2] shadow-[0_0_0_10px_rgba(233,162,59,.18),0_0_0_22px_rgba(233,162,59,.08)]">
              {ownerName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="mt-5">
              <Eyebrow>{step === "preview" ? "Hear it first" : "Ready for tonight"}</Eyebrow>
            </div>
            <Title>{ownerName.trim().split(/\s+/)[0]}&apos;s story voice</Title>
          </div>
          {boundOk.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {boundOk.map(([id]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlayProvider(id)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-bold ${playProvider === id ? "border-[#E9A23B] text-[#E9A23B]" : "border-[#3A4A70] text-[#B8AE9A]"}`}
                >
                  {props.providers.find((p) => p.id === id)?.label ?? id}
                </button>
              ))}
            </div>
          )}
          <ChapterPlayer
            key={`${step}-${playProvider}`}
            voiceId={created.voiceId}
            label={created.label}
            provider={playProvider}
            chapterId={props.chapterId}
            previewOnly={step === "preview"}
          />
          <OwnerLink path={created.ownerPath} />
          <div className="flex flex-wrap gap-2">
            {step === "preview" ? (
              <Button onClick={() => setStep("listen")}>Sounds like me. Read Chapter 1</Button>
            ) : (
              <Button variant="ghost" onClick={() => setStep("preview")}>
                Back to the preview
              </Button>
            )}
            <Link href="/voice-lab/compare" className="inline-flex min-h-[52px] items-center px-4 font-bold">
              Compare providers →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function OwnerLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const url = `${origin}${path}`;
  return (
    <div className="rounded-2xl bg-[#131B31] px-4 py-3 text-[13.5px] leading-normal text-[#B8AE9A]">
      <b className="text-[#F4E9D2]">Your owner link.</b> It&apos;s the only way to switch this voice off or delete it. Save it now; it
      isn&apos;t shown again.
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="break-all rounded-lg bg-[#0E1426] px-2 py-1 text-[12px] text-[#DCD2BE]">{url}</code>
        <button
          type="button"
          className="rounded-full border border-[#3A4A70] px-3 py-1 text-[12.5px] font-bold text-[#DCD2BE]"
          onClick={() => void navigator.clipboard?.writeText(url).then(() => setCopied(true))}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <a href={path} target="_blank" rel="noreferrer noopener" className="text-[12.5px] font-bold">
          Open
        </a>
      </div>
    </div>
  );
}

function ExistingVoices({ voices }: { voices: PublicVoice[] }) {
  if (voices.length === 0) return null;
  return (
    <div className="mt-4">
      <Eyebrow tone="muted">Voices already made on this machine</Eyebrow>
      <div className="mt-2 flex flex-col gap-2">
        {voices.map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-2xl border border-[#2F3E62] px-4 py-3 text-[14px]">
            <span>
              <b>{v.ownerName}</b> <span className="text-[#A99F8C]">· {v.relationship}</span>
              <span className="block text-[12px] text-[#8E99B5]">
                {v.bindings.map((b) => b.provider).join(", ") || "no provider voice yet"}
                {v.enabled ? "" : " · switched off"}
              </span>
            </span>
            {v.bindings.length > 0 && v.enabled && <Link href={`/voice-lab/listen/${v.id}`}>Listen</Link>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] leading-normal text-[#8E99B5]">
        Lost an owner link? On this machine, run <code>npm run voice:owner-link -- &lt;voice id&gt;</code> for a new one (the old link
        stops working). Voice ids: {voices.map((v) => v.id).join(", ")}.
      </p>
    </div>
  );
}
