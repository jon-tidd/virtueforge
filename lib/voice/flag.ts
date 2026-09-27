// The voice engine is a prototype. It runs only when explicitly switched on,
// and never in production, whatever the env says.

type Env = Record<string, string | undefined>;

export function isVoiceEngineEnabled(env: Env = process.env): boolean {
  if (env.VOICE_ENGINE_ENABLED !== "true") return false;
  if (env.NODE_ENV === "production") return false;
  if (env.VERCEL_ENV === "production") return false;
  return true;
}
