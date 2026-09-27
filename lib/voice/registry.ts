import { createElevenLabsProvider } from "./providers/elevenlabs";
import { createChatterboxFalProvider, createChatterboxHttpProvider } from "./providers/chatterbox";
import { createMockProvider } from "./providers/mock";
import type { ProviderId, TTSProvider } from "./types";

// Picks the provider. Adapters read their keys from process.env at call time,
// so the registry can be built once. Tests swap in their own providers.

export const PROVIDER_IDS: readonly ProviderId[] = ["elevenlabs", "chatterbox-fal", "chatterbox-http", "mock"];

let registry: Map<ProviderId, TTSProvider> | null = null;

function build(): Map<ProviderId, TTSProvider> {
  return new Map<ProviderId, TTSProvider>([
    ["elevenlabs", createElevenLabsProvider()],
    ["chatterbox-fal", createChatterboxFalProvider()],
    ["chatterbox-http", createChatterboxHttpProvider()],
    ["mock", createMockProvider({ delayMs: Number(process.env.VOICE_MOCK_DELAY_MS) || 0 })],
  ]);
}

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === "string" && (PROVIDER_IDS as readonly string[]).includes(v);
}

export function getProvider(id: ProviderId): TTSProvider {
  if (!registry) registry = build();
  const p = registry.get(id);
  if (!p) throw new Error(`unknown provider: ${id}`);
  return p;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  configured: boolean;
  defaultModel: string;
  models: string[];
  watermark: boolean;
  stitching: boolean;
}

export function listProviders(): ProviderInfo[] {
  return PROVIDER_IDS.map((id) => {
    const p = getProvider(id);
    return {
      id,
      label: p.label,
      configured: p.isConfigured(),
      defaultModel: p.defaultModel,
      models: [...p.models],
      watermark: p.capabilities.watermark,
      stitching: p.capabilities.stitching,
    };
  });
}

/** VOICE_DEFAULT_PROVIDER if configured, else the first configured real provider, else mock. */
export function defaultProviderId(): ProviderId {
  const wanted = process.env.VOICE_DEFAULT_PROVIDER;
  if (isProviderId(wanted) && getProvider(wanted).isConfigured()) return wanted;
  return PROVIDER_IDS.find((id) => id !== "mock" && getProvider(id).isConfigured()) ?? "mock";
}

/** For tests: replace one or more providers. Pass null to reset. */
export function setProvidersForTesting(providers: TTSProvider[] | null): void {
  if (providers === null) {
    registry = null;
    return;
  }
  registry = build();
  for (const p of providers) registry.set(p.id, p);
}
