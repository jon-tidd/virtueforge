import { VoiceProviderError, type ProviderId } from "../types";

// One way to call a provider:
//  - redirect: "error" on every request, so a redirect can never re-send a key,
//    a reference clip or chapter text to some other host;
//  - 429 and 503 are retried (twice by default) with backoff, honouring
//    Retry-After up to a cap; an exhausted 429 surfaces as status 429 so the
//    engine can answer rate_limited instead of a hard provider_error;
//  - network failures become a VoiceProviderError with fixed wording.
// Response bodies are never read into an error message (see VoiceProviderError).

export interface RetryOptions {
  /** Extra attempts after the first (default 2). */
  retries?: number;
  /** Longest single wait (default 8 s). */
  maxWaitMs?: number;
  /** For tests. */
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE = new Set([429, 503]);
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Retry-After as milliseconds (delta-seconds or an HTTP date), or undefined. */
export function retryAfterMs(res: Response, now = Date.now()): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const secs = Number(raw);
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  const at = Date.parse(raw);
  return Number.isFinite(at) ? Math.max(0, at - now) : undefined;
}

export async function providerFetch(
  provider: ProviderId,
  doFetch: typeof fetch,
  url: string,
  init: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 2;
  const maxWait = opts.maxWaitMs ?? 8000;
  const sleep = opts.sleep ?? defaultSleep;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await doFetch(url, { ...init, redirect: "error" });
    } catch {
      // TypeError from fetch: network trouble, or a redirect we refused. No URL in the message.
      throw new VoiceProviderError(provider, "request failed (network error or refused redirect)");
    }
    if (!RETRYABLE.has(res.status) || attempt >= retries) return res;
    const wait = Math.min(maxWait, retryAfterMs(res) ?? 500 * 2 ** attempt);
    await res.body?.cancel().catch(() => undefined);
    await sleep(wait);
  }
}

/** A failed response as an error: our wording, the provider id and the status. The body is discarded. */
export async function providerFailure(provider: ProviderId, what: string, res: Response): Promise<VoiceProviderError> {
  await res.body?.cancel().catch(() => undefined);
  return new VoiceProviderError(provider, `${what} failed (${res.status})`, res.status, retryAfterMs(res));
}

/** "HTTP 500" for a provider error with a status, else "failed". Safe to store and show. */
export function safeStatus(e: unknown): string {
  return e instanceof VoiceProviderError && e.status ? `HTTP ${e.status}` : "failed";
}
