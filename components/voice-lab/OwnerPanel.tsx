"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { PublicVoice } from "@/lib/voice/voices";
import type { DeletionReceipt } from "@/lib/voice/types";
import { announceVoiceEvent, ApiError, getJson, OWNER_HEADER } from "./api";
import { Button, Card, ErrorNote, Eyebrow, Title, VoiceLabel } from "./ui";

// The voice owner's own page, /voice-lab/owner#<token>. The token lives in the
// URL fragment (never sent in a request line, never in a server log) and goes
// to /api/voice/owner in the x-voice-owner-token header. From here the owner
// sees the consent record, flips the off switch, and deletes everything.

interface OwnerConsent {
  text: string;
  spokenAt: string;
  receivedAt: string;
  audioSha256: string;
  scriptVersion: string;
  recordSha256: string | null;
  /** False when the stored record no longer matches its hash (it was edited). */
  intact: boolean;
}

type View =
  | { kind: "loading" }
  | { kind: "no-token" }
  | { kind: "not-found" }
  | { kind: "error"; message: string }
  | { kind: "ready"; voice: PublicVoice; consent: OwnerConsent | null }
  | { kind: "deleted"; receipt: DeletionReceipt };

const PROVIDER_NAMES: Record<string, string> = {
  elevenlabs: "ElevenLabs",
  "chatterbox-fal": "Chatterbox (fal.ai)",
  "chatterbox-http": "Chatterbox (self-hosted)",
  mock: "Mock (this machine only)",
};
const providerName = (id: string) => PROVIDER_NAMES[id] ?? id;

function readToken(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function when(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function OwnerPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The fragment only exists in the browser; read it after mount, and again if it changes.
  useEffect(() => {
    const sync = () => setToken(readToken());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const load = useCallback(async (t: string) => {
    setView({ kind: "loading" });
    try {
      const body = await getJson<{ voice: PublicVoice; consent: OwnerConsent | null }>(
        "/api/voice/owner",
        { headers: { [OWNER_HEADER]: t } },
        "Couldn't open this owner link",
      );
      setView({ kind: "ready", voice: body.voice, consent: body.consent });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setView({ kind: "not-found" });
      else setView({ kind: "error", message: e instanceof Error ? e.message : "Couldn't open this owner link" });
    }
  }, []);

  useEffect(() => {
    if (token === null) return;
    if (!token) {
      setView({ kind: "no-token" });
      return;
    }
    void load(token);
  }, [token, load]);

  async function setEnabled(enabled: boolean) {
    if (!token || view.kind !== "ready") return;
    setBusy(true);
    setError(null);
    try {
      const body = await getJson<{ voice: PublicVoice }>(
        "/api/voice/owner",
        {
          method: "PATCH",
          headers: { "content-type": "application/json", [OWNER_HEADER]: token },
          body: JSON.stringify({ enabled }),
        },
        "Couldn't change the switch",
      );
      setView({ ...view, voice: body.voice });
      announceVoiceEvent({ type: body.voice.enabled ? "voice-on" : "voice-off", voiceId: body.voice.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't change the switch");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEverything() {
    if (!token || view.kind !== "ready") return;
    const voiceId = view.voice.id;
    setBusy(true);
    setError(null);
    // Stop anything playing in this browser straight away; the server switches it off first too.
    announceVoiceEvent({ type: "voice-off", voiceId });
    try {
      const body = await getJson<{ receipt: DeletionReceipt }>(
        "/api/voice/owner",
        { method: "DELETE", headers: { [OWNER_HEADER]: token } },
        "Couldn't delete the voice",
      );
      setView({ kind: "deleted", receipt: body.receipt });
      announceVoiceEvent({ type: "voice-deleted", voiceId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete the voice");
      void load(token);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      {view.kind === "loading" && (
        <p className="py-10 text-center text-[15px] text-[#B8AE9A]" aria-live="polite">
          Opening your owner link…
        </p>
      )}

      {view.kind === "no-token" && (
        <Notice title="This owner link is incomplete.">
          The owner link ends with a long code after a <code>#</code>. Open the full link you saved when the voice was made.
        </Notice>
      )}

      {view.kind === "not-found" && (
        <Notice title="This owner link doesn't open a voice.">
          Either the link isn&apos;t complete, or the voice it belonged to has already been deleted. If you deleted it, there is
          nothing more to do.
        </Notice>
      )}

      {view.kind === "error" && <Notice title="Something went wrong.">{view.message}</Notice>}

      {view.kind === "ready" && (
        <>
          <VoiceHeader voice={view.voice} />
          <OffSwitch enabled={view.voice.enabled} busy={busy} onChange={(v) => void setEnabled(v)} firstName={view.voice.ownerName.split(/\s+/)[0]} />
          <ErrorNote>{error}</ErrorNote>
          <ConsentCard consent={view.consent} />
          <HeldBy voice={view.voice} />
          <DeleteCard ownerName={view.voice.ownerName} busy={busy} onConfirm={() => void deleteEverything()} />
        </>
      )}

      {view.kind === "deleted" && <ReceiptView receipt={view.receipt} />}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mt-4">
      <Eyebrow>Your story voice</Eyebrow>
      <Title as="h2">{title}</Title>
      <p className="mt-2 text-[14.5px] leading-normal text-[#B8AE9A]">{children}</p>
    </Card>
  );
}

function VoiceHeader({ voice }: { voice: PublicVoice }) {
  const first = voice.ownerName.split(/\s+/)[0];
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div
        aria-hidden="true"
        className="font-display flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#A7869E] text-[38px] font-semibold text-[#FBF3E2] shadow-[0_0_0_10px_rgba(233,162,59,.18),0_0_0_22px_rgba(233,162,59,.08)]"
      >
        {first.charAt(0).toUpperCase()}
      </div>
      <div className="mt-5">
        <Eyebrow>Only you have this link</Eyebrow>
      </div>
      <Title>{first}&apos;s story voice</Title>
      <p className="mt-1 text-[14px] text-[#B8AE9A]">
        {voice.relationship} · made {when(voice.createdAt)}
      </p>
      <div className="mt-3">
        <VoiceLabel label={voice.label} />
      </div>
    </div>
  );
}

function OffSwitch({
  enabled,
  busy,
  onChange,
  firstName,
}: {
  enabled: boolean;
  busy: boolean;
  onChange: (v: boolean) => void;
  firstName: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div id="voice-switch-label" className="font-display text-[21px] font-semibold text-[#FBF3E2]">
            {enabled ? "Your voice is on" : "Your voice is off"}
          </div>
          <p id="voice-switch-help" className="mt-1 text-[14px] leading-normal text-[#B8AE9A]">
            {enabled
              ? "It reads our chapters when the family picks it. Switch it off any time; nothing plays after that, not even chapters already made."
              : `Nothing plays in ${firstName}'s voice, not even chapters already made. Switch it back on whenever you like.`}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="voice-switch-label"
          aria-describedby="voice-switch-help"
          disabled={busy}
          onClick={() => onChange(!enabled)}
          className={`flex h-[48px] w-[84px] shrink-0 items-center rounded-full p-[5px] transition disabled:opacity-50 ${
            enabled ? "justify-end bg-[#4E6A45]" : "justify-start bg-[#3A4A70]"
          }`}
        >
          <span className="block h-[38px] w-[38px] rounded-full bg-[#FFFCF5] shadow" />
        </button>
      </div>
    </Card>
  );
}

function ConsentCard({ consent }: { consent: OwnerConsent | null }) {
  return (
    <Card>
      <Eyebrow>Your permission, as you said it</Eyebrow>
      {consent ? (
        <>
          <blockquote className="font-story mt-3 rounded-[18px] border-2 border-[#E9A23B] bg-[#FFFCF5] px-4 py-3 text-[17px] leading-[1.6] text-[#1F1A14]">
            “{consent.text}”
          </blockquote>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13.5px]">
            <dt className="text-[#A99F8C]">You said it</dt>
            <dd className="text-[#DCD2BE]">{when(consent.spokenAt)}</dd>
            <dt className="text-[#A99F8C]">We stored it</dt>
            <dd className="text-[#DCD2BE]">{when(consent.receivedAt)}</dd>
            <dt className="text-[#A99F8C]">Wording</dt>
            <dd className="text-[#DCD2BE]">{consent.scriptVersion}</dd>
            <dt className="text-[#A99F8C]">Recording</dt>
            <dd className="break-all font-mono text-[12px] text-[#8E99B5]" title="sha256 of your consent recording">
              sha256 {consent.audioSha256}
            </dd>
            <dt className="text-[#A99F8C]">Record</dt>
            <dd className="text-[#DCD2BE]">
              {consent.intact ? (
                <span className="font-bold text-[#B9D3A6]">unchanged since it was stored</span>
              ) : (
                <span className="font-bold text-[#F4B3A2]">doesn&apos;t match its stored fingerprint: it may have been edited</span>
              )}
            </dd>
          </dl>
        </>
      ) : (
        <p className="mt-2 text-[14px] text-[#B8AE9A]">No consent record was found for this voice.</p>
      )}
    </Card>
  );
}

function HeldBy({ voice }: { voice: PublicVoice }) {
  return (
    <Card>
      <Eyebrow>Who holds a copy of the voice</Eyebrow>
      <ul className="mt-2 flex flex-col gap-1.5 text-[14px] text-[#DCD2BE]">
        <li>This machine: your permission recording and the reading samples.</li>
        {voice.bindings.length === 0 ? (
          <li className="text-[#A99F8C]">No voice provider has made a voice from it yet.</li>
        ) : (
          voice.bindings.map((b) => (
            <li key={b.provider}>
              {providerName(b.provider)}: a voice made {when(b.createdAt)}
              {b.requiresVerification ? " (waiting for the provider's extra verification)" : ""}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

function DeleteCard({ ownerName, busy, onConfirm }: { ownerName: string; busy: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const ok = typed.trim().toLowerCase() === "delete";
  return (
    <div className="rounded-[22px] border border-[#5A2E2A] bg-[#241A26] p-4">
      <Eyebrow tone="muted">Delete everything</Eyebrow>
      <p className="mt-2 text-[14px] leading-normal text-[#DCD2BE]">
        This removes {ownerName.split(/\s+/)[0]}&apos;s story voice for good: the voice at each provider, the reading samples, the
        permission recording and every chapter already made in it. We delete everything we hold and instruct the voice provider to
        delete theirs. It can&apos;t be undone.
      </p>
      {!open ? (
        <Button variant="ghost" className="mt-3 w-full sm:w-auto" onClick={() => setOpen(true)}>
          Delete everything…
        </Button>
      ) : (
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (ok && !busy) onConfirm();
          }}
        >
          <label htmlFor="confirm-delete" className="text-[13.5px] font-bold text-[#F4C9BD]">
            To confirm, type the word <span className="font-mono">delete</span>
          </label>
          <input
            id="confirm-delete"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="min-h-[48px] rounded-2xl border border-[#5A2E2A] bg-[#131B31] px-4 text-[16px] text-[#FBF3E2] outline-none focus:border-[#D9573A]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="danger" disabled={!ok || busy}>
              {busy ? "Deleting…" : "Delete everything now"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
            >
              Keep it
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ReceiptView({ receipt }: { receipt: DeletionReceipt }) {
  const failed = receipt.providerDeletions.filter((p) => (!p.voiceDeleted && !p.expiresAt) || p.historyError);
  return (
    <>
      <div className="flex flex-col items-center pt-4 text-center">
        <Eyebrow>Deleted {when(receipt.deletedAt)}</Eyebrow>
        <Title>{receipt.ownerName.split(/\s+/)[0]}&apos;s story voice is gone.</Title>
        <p className="mt-2 text-[14.5px] leading-normal text-[#B8AE9A]">
          We deleted everything we hold and instructed the voice provider to delete theirs.
        </p>
      </div>

      <Card>
        <Eyebrow>What was removed</Eyebrow>
        <ul className="mt-2 flex flex-col gap-2 text-[14px] text-[#DCD2BE]">
          <li>
            On this machine: {receipt.localFilesDeleted} file{receipt.localFilesDeleted === 1 ? "" : "s"} (permission recording, reading
            samples, voice record) and {receipt.cachedFilesDeleted} cached chapter file{receipt.cachedFilesDeleted === 1 ? "" : "s"}.
          </li>
          {receipt.providerDeletions.length === 0 && <li>No voice provider held a voice.</li>}
          {receipt.providerDeletions.map((p) => (
            <li key={`${p.provider}-${p.providerVoiceId}`}>
              {providerName(p.provider)}:{" "}
              {p.voiceDeleted ? (
                <span className="font-bold text-[#B9D3A6]">voice deleted</span>
              ) : p.expiresAt ? (
                <span className="font-bold text-[#F2C46B]">
                  can&apos;t be deleted on request; its last copy of your voice expires {when(p.expiresAt)}
                </span>
              ) : (
                <span className="font-bold text-[#F4C9BD]">voice NOT confirmed deleted</span>
              )}
              {typeof p.historyItemsDeleted === "number" && `, ${p.historyItemsDeleted} history item${p.historyItemsDeleted === 1 ? "" : "s"} removed`}
              {p.historyError && <span className="block text-[12.5px] text-[#F4C9BD]">History purge failed ({p.historyError}).</span>}
              {p.error && <span className="block text-[12.5px] text-[#F4C9BD]">Voice delete failed ({p.error}).</span>}
            </li>
          ))}
        </ul>
      </Card>

      {failed.length > 0 && (
        <div role="alert" className="rounded-2xl border border-[#D9573A] bg-[#2A1A20] px-4 py-3 text-[14px] leading-normal text-[#F4C9BD]">
          <b>A provider didn&apos;t confirm yet.</b> Everything on this machine is gone. This machine keeps retrying the provider
          delete (whenever the lab opens, or <code>npm run voice:purge-pending</code>). To be sure now, delete it by hand in that
          provider&apos;s dashboard:{" "}
          {failed.map((p) => (
            <span key={p.providerVoiceId} className="font-mono text-[12.5px]">
              {providerName(p.provider)} voice {p.providerVoiceId}{" "}
            </span>
          ))}
        </div>
      )}

      <Card>
        <Eyebrow>What we kept: a receipt, no audio</Eyebrow>
        {receipt.consent ? (
          <>
            <p className="mt-2 text-[14px] text-[#DCD2BE]">
              The words of your permission (the children&apos;s names left out) and when you gave it:
            </p>
            <blockquote className="font-story mt-2 rounded-[14px] bg-[#131B31] px-4 py-3 text-[15.5px] leading-[1.55] text-[#DCD2BE]">
              “{receipt.consent.text}”
            </blockquote>
            <p className="mt-2 text-[12.5px] text-[#8E99B5]">
              Said {when(receipt.consent.spokenAt)} · stored {when(receipt.consent.receivedAt)} · {receipt.consent.scriptVersion}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[14px] text-[#DCD2BE]">
            Who and when: {receipt.ownerName}, consented {when(receipt.consentedAt)}.
          </p>
        )}
        <p className="mt-3 rounded-[14px] border border-dashed border-[#E9A23B] px-3 py-2 text-[12.5px] leading-normal text-[#E9D2A8]">
          {!/privacy lawyer/i.test(receipt.placeholderNote) && <b>Pending the privacy lawyer&apos;s call. </b>}
          {receipt.placeholderNote}
        </p>
      </Card>
    </>
  );
}
