import { promises as fs } from "node:fs";
import { familyFilePath } from "./config";

// Committed chapters use the sample family (Hugh, Alfie, Clara). A family
// file maps each slot's sample name to the family's real name:
//   {"slots": {"eldest": {"sample": "Hugh", "real": "…"}, …}}
// The file lives outside the repo (VOICE_FAMILY_FILE). It is read at runtime
// only, and its contents are never logged.

export interface FamilySlot {
  sample: string;
  real: string;
}

export interface FamilyFile {
  slots: Record<string, FamilySlot>;
}

export interface Family {
  /** Sample name -> real name. Empty when there is no family file. */
  swaps: Array<[string, string]>;
  /** Children's real names in slot order (eldest, middle, youngest), for the consent statement. */
  childNames: string[];
}

const CHILD_SLOT_ORDER = ["eldest", "middle", "youngest"];
const NON_CHILD_SLOT = /grand|nan|parent|mum|mom|dad|pet/i;

export const EMPTY_FAMILY: Family = { swaps: [], childNames: [] };

export function parseFamily(raw: unknown): Family {
  if (!raw || typeof raw !== "object" || !("slots" in raw)) return EMPTY_FAMILY;
  const slots = (raw as FamilyFile).slots;
  if (!slots || typeof slots !== "object") return EMPTY_FAMILY;
  const swaps: Array<[string, string]> = [];
  const children: Array<[number, string]> = [];
  Object.entries(slots).forEach(([key, slot], i) => {
    if (!slot || typeof slot.sample !== "string" || typeof slot.real !== "string") return;
    const sample = slot.sample.trim();
    const real = slot.real.trim();
    if (!sample || !real) return;
    swaps.push([sample, real]);
    if (!NON_CHILD_SLOT.test(key)) {
      const order = CHILD_SLOT_ORDER.indexOf(key);
      children.push([order === -1 ? 100 + i : order, real]);
    }
  });
  children.sort((a, b) => a[0] - b[0]);
  return { swaps, childNames: children.map(([, n]) => n) };
}

export async function loadFamily(file = familyFilePath()): Promise<Family> {
  if (!file) return EMPTY_FAMILY;
  try {
    return parseFamily(JSON.parse(await fs.readFile(/* turbopackIgnore: true */ file, "utf8")));
  } catch {
    // Missing or unreadable: fall back to the sample family, silently.
    return EMPTY_FAMILY;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Swaps whole-word sample names for real ones in one pass, so a real name that
 * happens to equal another sample name is never swapped twice.
 */
export function personalize(text: string, family: Family): string {
  if (family.swaps.length === 0) return text;
  const map = new Map(family.swaps);
  const names = [...map.keys()].sort((a, b) => b.length - a.length).map(escapeRe);
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])(${names.join("|")})(?![\\p{L}\\p{N}_])`, "gu");
  return text.replace(re, (m) => map.get(m) ?? m);
}

/** "Hugh, Alfie and Clara" / "Hugh and Alfie" / "Hugh" / "my family". */
export function childrenPhrase(family: Family): string {
  const n = family.childNames;
  if (n.length === 0) return "my family";
  if (n.length === 1) return n[0];
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}
