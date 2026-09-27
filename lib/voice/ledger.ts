import type { LedgerEntry, ProviderId } from "./types";
import type { VoiceStorage } from "./storage";
export { estimateCostUsd, ratePerThousand } from "./rates";

export const LEDGER_KEY = "ledger.jsonl";

export async function appendLedger(storage: VoiceStorage, entry: LedgerEntry): Promise<void> {
  await storage.appendLine(LEDGER_KEY, JSON.stringify(entry));
}

export async function readLedger(storage: VoiceStorage): Promise<LedgerEntry[]> {
  const bytes = await storage.read(LEDGER_KEY);
  if (!bytes) return [];
  return Buffer.from(bytes)
    .toString("utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as LedgerEntry];
      } catch {
        return [];
      }
    });
}

export interface LedgerSummaryRow {
  provider: ProviderId;
  model: string;
  paragraphs: number;
  characters: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  estCostUsd: number;
}

export function summarizeLedger(
  entries: LedgerEntry[],
  filter: { chapterId?: string; voiceId?: string } = {},
): LedgerSummaryRow[] {
  const rows = new Map<string, LedgerSummaryRow>();
  for (const e of entries) {
    if (filter.chapterId && e.chapterId !== filter.chapterId) continue;
    if (filter.voiceId && e.voiceId !== filter.voiceId) continue;
    const k = `${e.provider}|${e.model}`;
    const r =
      rows.get(k) ??
      ({ provider: e.provider, model: e.model, paragraphs: 0, characters: 0, totalLatencyMs: 0, avgLatencyMs: 0, estCostUsd: 0 } as LedgerSummaryRow);
    r.paragraphs++;
    r.characters += e.characters;
    r.totalLatencyMs += e.latencyMs;
    r.estCostUsd = Math.round((r.estCostUsd + e.estCostUsd) * 1e6) / 1e6;
    r.avgLatencyMs = Math.round(r.totalLatencyMs / r.paragraphs);
    rows.set(k, r);
  }
  return [...rows.values()].sort((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
}
