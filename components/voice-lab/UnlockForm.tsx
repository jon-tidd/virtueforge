"use client";

import { useState } from "react";
import { Button, Card, ErrorNote, Eyebrow, Title } from "./ui";

// Types the lab secret once; the server answers with an httpOnly cookie. After
// that, go on to where we were headed, keeping any #fragment (an owner link's
// token lives there and never reaches the server).

export function UnlockForm({ next, configured, unlocked }: { next: string; configured: boolean; unlocked: boolean }) {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = () => window.location.replace(next + window.location.hash);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/voice/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (res.ok) return go();
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? `Couldn't unlock (${res.status})`);
    } catch {
      setError("Couldn't reach the lab. Is the dev server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div>
        <Eyebrow>Voice lab · prototype</Eyebrow>
        <Title>{unlocked ? "This browser can use the lab." : "Unlock the voice lab"}</Title>
      </div>
      {!configured ? (
        <Card>
          <p className="text-[14.5px] leading-normal text-[#DCD2BE]">
            The lab needs a secret before it opens. Add <code>VOICE_LAB_SECRET</code> (at least 16 characters, for example the
            output of <code>openssl rand -hex 24</code>) to <code>.env.local</code>, restart <code>npm run voice:dev</code>, and come
            back here.
          </p>
        </Card>
      ) : unlocked ? (
        <Button onClick={go}>Go to the lab</Button>
      ) : (
        <Card>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (secret && !busy) void submit();
            }}
          >
            <label htmlFor="lab-secret" className="text-[13px] font-bold text-[#B8AE9A]">
              Lab secret (VOICE_LAB_SECRET in .env.local)
            </label>
            <input
              id="lab-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              className="min-h-[48px] rounded-2xl border border-[#3A4A70] bg-[#131B31] px-4 text-[16px] text-[#FBF3E2] outline-none focus:border-[#E9A23B]"
            />
            <Button type="submit" disabled={!secret || busy}>
              {busy ? "Checking…" : "Unlock"}
            </Button>
            <p className="text-[12.5px] leading-normal text-[#8E99B5]">
              Kept in this browser as an httpOnly cookie for 30 days. Every other lab page and API answers 404 without it.
            </p>
          </form>
          <ErrorNote>{error}</ErrorNote>
        </Card>
      )}
    </div>
  );
}
