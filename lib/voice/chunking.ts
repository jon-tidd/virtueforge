// Splits a paragraph into sentence groups for models that garble long input.
// Chatterbox wants about 250–350 characters per request (provider-research.md,
// section 1). Short pieces (a line of dialogue) are merged into a neighbour,
// or the pair is re-split evenly, so no request is a two-word fragment.

export interface ChunkOptions {
  /** Aim for at least this many characters per chunk. */
  min: number;
  /** Never send more than this many characters (unless one word is longer). */
  max: number;
}

export const CHATTERBOX_CHUNKS: ChunkOptions = { min: 250, max: 350 };

/** Splits into sentences, keeping closing quotes and brackets with their sentence. */
export function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const re = /[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g;
  const out: string[] = [];
  for (const m of clean.matchAll(re)) {
    const s = m[0].trim();
    if (s) out.push(s);
  }
  return out.length ? out : [clean];
}

/** Breaks one over-long sentence at commas/semicolons, then at spaces. */
function splitLong(sentence: string, max: number): string[] {
  if (sentence.length <= max) return [sentence];
  const parts = sentence.replace(/([,;:—–])\s+/g, "$1\u0000").split("\u0000");
  const out: string[] = [];
  let cur = "";
  const pushWords = (piece: string) => {
    for (const w of piece.split(" ")) {
      if (!cur) cur = w;
      else if (cur.length + 1 + w.length <= max) cur += " " + w;
      else {
        out.push(cur);
        cur = w;
      }
    }
  };
  for (const p of parts) {
    if (!cur) {
      if (p.length <= max) cur = p;
      else pushWords(p);
    } else if (cur.length + 1 + p.length <= max) cur += " " + p;
    else {
      out.push(cur);
      cur = "";
      if (p.length <= max) cur = p;
      else pushWords(p);
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function chunkText(text: string, opts: ChunkOptions = CHATTERBOX_CHUNKS): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= opts.max) return [clean];

  const pieces = splitSentences(clean).flatMap((s) => splitLong(s, opts.max));
  const chunks: string[] = [];
  let cur = "";
  for (const p of pieces) {
    if (!cur) cur = p;
    else if (cur.length + 1 + p.length <= opts.max) cur += " " + p;
    else {
      chunks.push(cur);
      cur = p;
    }
  }
  if (cur) chunks.push(cur);

  // Rebalance: a chunk shorter than min joins a neighbour when the pair still fits.
  for (let i = chunks.length - 1; i > 0; i--) {
    const a = chunks[i - 1];
    const b = chunks[i];
    if ((b.length < opts.min || a.length < opts.min) && a.length + 1 + b.length <= opts.max) {
      chunks.splice(i - 1, 2, `${a} ${b}`);
    }
  }
  return fixShortChunks(chunks, opts);
}

/**
 * Best place to cut `text` in two near its middle, both parts <= max: a
 * sentence end if one gives two reasonable halves, else a comma/semicolon,
 * else any space. -1 if there is no space at all.
 */
function evenSplitPoint(text: string, max: number, minPart: number): number {
  const mid = text.length / 2;
  const candidates = (re: RegExp) => {
    const out: number[] = [];
    for (const m of text.matchAll(re)) {
      const at = (m.index ?? 0) + m[0].length - 1; // the space after the mark
      if (at > 0 && at < text.length - 1 && at <= max && text.length - at - 1 <= max) out.push(at);
    }
    return out;
  };
  for (const [re, needMin] of [
    [/[.!?…]["'”’)\]]* /g, true],
    [/[,;:—–] /g, true],
    [/ /g, false],
  ] as const) {
    const ok = candidates(re).filter((at) => !needMin || (at >= minPart && text.length - at - 1 >= minPart));
    if (ok.length) return ok.reduce((best, at) => (Math.abs(at - mid) < Math.abs(best - mid) ? at : best));
  }
  return -1;
}

/**
 * No request may be a short fragment (Chatterbox garbles or pads them): a
 * chunk under min/2 joins its shorter neighbour; if the pair is too long for
 * one request, the pair is re-split evenly (at a sentence, clause or word
 * boundary), so both halves end up well over min/2.
 */
function fixShortChunks(chunks: string[], opts: ChunkOptions): string[] {
  const out = [...chunks];
  const short = opts.min / 2;
  for (let guard = 0; guard < 4 * out.length + 8 && out.length > 1; guard++) {
    let i = 0;
    for (let j = 1; j < out.length; j++) if (out[j].length < out[i].length) i = j;
    if (out[i].length >= short) break;
    const left = i > 0 ? out[i - 1].length : Infinity;
    const right = i < out.length - 1 ? out[i + 1].length : Infinity;
    const a = left <= right ? i - 1 : i;
    const pair = `${out[a]} ${out[a + 1]}`;
    if (pair.length <= opts.max) {
      out.splice(a, 2, pair);
      continue;
    }
    const at = evenSplitPoint(pair, opts.max, short);
    if (at < 0) break; // one enormous word: nothing sensible to do
    out.splice(a, 2, pair.slice(0, at), pair.slice(at + 1));
  }
  return out;
}
