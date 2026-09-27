"use client";

// Small browser helpers shared by the voice lab panels: typed API errors, the
// owner-token header, a voice status check, and a same-browser channel so the
// owner page can stop playback in other tabs the moment it flips the switch.

export const OWNER_HEADER = "x-voice-owner-token";
/** Sent by the player's fetch(); the audio route refuses anything without it (no navigations, no <audio src>). */
export const PLAYER_HEADER = "x-voice-player";

/** An error from /api/voice/*: `{ error: <code>, message }` plus the HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiError(res: Response, fallback: string): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { error?: unknown; message?: unknown } | null;
  const code = typeof body?.error === "string" ? body.error : res.status === 404 ? "not_found" : "http_error";
  const message = typeof body?.message === "string" ? body.message : `${fallback} (${res.status})`;
  return new ApiError(code, message, res.status);
}

export async function getJson<T>(url: string, init?: RequestInit, fallback = "Request failed"): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw await apiError(res, fallback);
  return (await res.json()) as T;
}

/** The owner page lives at /voice-lab/owner#<token>: the token never enters a path or a log. */
export function ownerPagePath(ownerToken: string): string {
  return `/voice-lab/owner#${ownerToken}`;
}

export type VoiceStatus = "on" | "off" | "deleted";

/** Is this voice still allowed to play? Network trouble counts as "on": the audio route enforces it anyway. */
export async function voiceStatus(voiceId: string): Promise<VoiceStatus> {
  try {
    const res = await fetch(`/api/voice/voices/${encodeURIComponent(voiceId)}`, { cache: "no-store" });
    if (res.status === 404) return "deleted";
    if (!res.ok) return "on";
    const body = (await res.json()) as { voice?: { enabled?: boolean } };
    return body.voice?.enabled === false ? "off" : "on";
  } catch {
    return "on";
  }
}

// ---------------------------------------------------------------------------
// Same-browser voice events (owner page -> any open player)
// ---------------------------------------------------------------------------

export type VoiceEvent = { type: "voice-off" | "voice-on" | "voice-deleted"; voiceId: string };
const CHANNEL = "gg-voice-lab";
const LOCAL_EVENT = "gg-voice-lab";

export function announceVoiceEvent(ev: VoiceEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<VoiceEvent>(LOCAL_EVENT, { detail: ev }));
  if (typeof BroadcastChannel === "undefined") return;
  const ch = new BroadcastChannel(CHANNEL);
  ch.postMessage(ev);
  ch.close();
}

export function subscribeVoiceEvents(fn: (ev: VoiceEvent) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const local = (e: Event) => fn((e as CustomEvent<VoiceEvent>).detail);
  window.addEventListener(LOCAL_EVENT, local);
  const ch = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
  if (ch) ch.onmessage = (e: MessageEvent<VoiceEvent>) => fn(e.data);
  return () => {
    window.removeEventListener(LOCAL_EVENT, local);
    ch?.close();
  };
}

// ---------------------------------------------------------------------------
// One player at a time (same page): a player announces itself when it starts,
// and every other player pauses.
// ---------------------------------------------------------------------------

const PLAYER_EVENT = "gg-voice-player-start";

export function announcePlayerStart(playerId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(PLAYER_EVENT, { detail: playerId }));
}

export function subscribePlayerStart(fn: (playerId: string) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const h = (e: Event) => fn((e as CustomEvent<string>).detail);
  window.addEventListener(PLAYER_EVENT, h);
  return () => window.removeEventListener(PLAYER_EVENT, h);
}
