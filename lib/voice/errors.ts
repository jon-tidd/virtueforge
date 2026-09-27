// Errors the API routes turn into HTTP responses. Messages are safe to show:
// they never contain keys, tokens, or provider response bodies with secrets.

export type VoiceErrorCode =
  | "bad_request"
  | "adult_own_voice_required"
  | "consent_text_mismatch"
  | "consent_stale"
  | "bad_audio"
  | "not_enough_audio"
  | "unauthorized"
  | "voice_not_found"
  | "voice_off"
  | "not_bound"
  | "already_bound"
  | "chapter_not_found"
  | "paragraph_not_found"
  | "provider_not_configured"
  | "model_not_allowed"
  | "provider_error"
  | "rate_limited"
  | "too_large";

const STATUS: Record<VoiceErrorCode, number> = {
  bad_request: 400,
  adult_own_voice_required: 400,
  consent_text_mismatch: 400,
  consent_stale: 400,
  bad_audio: 400,
  not_enough_audio: 400,
  unauthorized: 401,
  voice_not_found: 404,
  voice_off: 403,
  not_bound: 409,
  already_bound: 409,
  chapter_not_found: 404,
  paragraph_not_found: 404,
  provider_not_configured: 503,
  model_not_allowed: 400,
  provider_error: 502,
  rate_limited: 429,
  too_large: 413,
};

export class VoiceError extends Error {
  readonly status: number;
  constructor(
    public readonly code: VoiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "VoiceError";
    this.status = STATUS[code];
  }
}
