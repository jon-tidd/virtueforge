import rates from "./rates.json";
import type { ProviderId } from "./types";

// Pure rate lookups, shared by the server ledger and the compare page (no
// storage or Node imports, so client components can use it too). The numbers
// live in rates.json, which scripts/voice-cost.mjs reads as well.

type RateTable = Record<string, Record<string, number> | undefined>;
const TABLE = rates.perThousandChars as RateTable;

export interface RateInfo {
  /** USD per 1,000 characters. */
  usdPerThousand: number;
  /** False when the model isn't listed and the provider's first rate was used instead. */
  exact: boolean;
}

export function rateInfo(provider: ProviderId | string, model: string): RateInfo {
  const table = TABLE[provider] ?? {};
  if (typeof table[model] === "number") return { usdPerThousand: table[model], exact: true };
  // chatterbox-http reports its own model name; any of them use the GPU planning rate.
  const first = Object.values(table)[0];
  return { usdPerThousand: typeof first === "number" ? first : 0, exact: false };
}

export function ratePerThousand(provider: ProviderId | string, model: string): number {
  return rateInfo(provider, model).usdPerThousand;
}

export function estimateCostUsd(provider: ProviderId | string, model: string, characters: number): number {
  return Math.round((characters / 1000) * ratePerThousand(provider, model) * 1e6) / 1e6;
}

export type Fit = "yes" | "tight" | "no";

export interface FitThresholds {
  /** Most a voice should cost per family per year (the $30 margin guide). */
  marginGuideUsd: number;
  /** Upper bound for "tight" (twice the margin guide by default). */
  tightUsd: number;
  /** The Heirloom price; at or over it the voice loses money. */
  heirloomPriceUsd: number;
}

/** The same rule scripts/voice-cost.mjs prints: yes <= margin guide < tight <= tightUsd < no. */
export function defaultThresholds(): FitThresholds {
  const d = rates.defaults;
  return {
    marginGuideUsd: d.marginGuideUsd,
    tightUsd: d.marginGuideUsd * (d.tightMultipleOfMargin ?? 2),
    heirloomPriceUsd: d.heirloomPriceUsd,
  };
}

export function fitFor(usd: number, t: Pick<FitThresholds, "marginGuideUsd" | "tightUsd">): Fit {
  if (usd <= t.marginGuideUsd + 1e-9) return "yes";
  if (usd <= t.tightUsd + 1e-9) return "tight";
  return "no";
}
