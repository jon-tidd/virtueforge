import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { storyContentDir } from "./config";

// Chapter files are Markdown with YAML front matter:
//
//   ---
//   id: s1-ch01
//   season: 1
//   part: 1
//   chapter: 1
//   title: The Fox at the Window
//   tag: Brave
//   lead: Clara
//   ---
//   ## Chapter-book telling      <- the voice reads these paragraphs
//   ## Picture-book telling
//   ## Pause & ask               <- "**Question:** …" (and other lines)
//   ## Last page
//
// Inside the chapter-book telling, a paragraph that is exactly
// "[[Pause & ask]]", or starts with "**Pause & ask:**", marks where playback
// stops to ask the question. It is never sent to a voice.

export const CHAPTER_ID_RE = /^s\d{1,2}-ch\d{2,3}$/;

export interface ChapterMeta {
  id: string;
  season: number;
  part: number;
  chapter: number;
  title: string;
  tag: string;
  lead: string;
}

export type ChapterItem =
  | { type: "paragraph"; index: number; text: string }
  | { type: "pause"; question: string; answersFirst?: string };

export interface Chapter {
  meta: ChapterMeta;
  /** sha256 of the raw file: any edit changes every cache key. */
  contentHash: string;
  /** Where it came from: "content" (STORY_CONTENT_DIR) or "fixture". */
  source: "content" | "fixture";
  items: ChapterItem[];
  /** Just the readable paragraphs, in order. paragraphs[i] is item index i. */
  paragraphs: string[];
  pause: { question: string; answersFirst?: string } | null;
  lastPage: string;
}

export class ChapterNotFoundError extends Error {
  constructor(id: string) {
    super(`chapter not found: ${id}`);
    this.name = "ChapterNotFoundError";
  }
}

// Paths are built at runtime from process.cwd() and env vars. The
// turbopackIgnore comments stop Turbopack's file tracer from treating them as
// "could be any file in the project" and pulling the whole repo (including
// .voice-data/ and docs/) into server bundles. The lab only runs under
// `next dev`, so nothing here needs to be traced.
const FIXTURE_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "lib", "voice", "__fixtures__");

/** Minimal front-matter parser: flat "key: value" lines only. */
export function parseFrontMatter(src: string): { data: Record<string, string>; body: string } {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    data[kv[1]] = v;
  }
  return { data, body: src.slice(m[0].length) };
}

/** Splits the body into "## Heading" sections (keys lower-cased). */
export function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const noComments = body.replace(/<!--[\s\S]*?-->/g, "");
  const parts = noComments.split(/^##\s+/m);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
    out[heading] = nl === -1 ? "" : part.slice(nl + 1).trim();
  }
  return out;
}

/** Markdown -> plain reading text: drops emphasis, blockquote marks and links. */
export function plainText(md: string): string {
  return md
    .replace(/^\s*>\s?/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(\S(?:.*?\S)?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

const PAUSE_MARK_RE = /^\s*(?:>\s*)?(?:\[\[\s*pause\s*&(?:amp;)?\s*ask\s*\]\]|\*\*pause\s*&\s*ask:?\*\*:?)([\s\S]*)$/i;

function parsePauseSection(section: string | undefined): { question: string; answersFirst?: string } | null {
  if (!section) return null;
  const q = /\*\*Question:?\*\*:?\s*(.+)/i.exec(section);
  const a = /\*\*Answers first:?\*\*:?\s*(.+)/i.exec(section);
  const question = plainText(q ? q[1] : section.split(/\n\s*\n/)[0] ?? "");
  if (!question) return null;
  return { question, answersFirst: a ? plainText(a[1]) : undefined };
}

export function parseChapter(src: string, source: Chapter["source"] = "content"): Chapter {
  const { data, body } = parseFrontMatter(src);
  const id = data.id ?? "";
  if (!CHAPTER_ID_RE.test(id)) throw new Error(`chapter front matter has no valid id (got ${JSON.stringify(id)})`);
  const meta: ChapterMeta = {
    id,
    season: Number(data.season) || 0,
    part: Number(data.part) || 0,
    chapter: Number(data.chapter) || 0,
    title: data.title ?? "",
    tag: data.tag ?? "",
    lead: data.lead ?? "",
  };
  const sections = splitSections(body);
  const telling = sections["chapter-book telling"];
  if (!telling) throw new Error(`chapter ${id} has no "## Chapter-book telling" section`);
  const pauseSection = parsePauseSection(sections["pause & ask"]);

  const items: ChapterItem[] = [];
  const paragraphs: string[] = [];
  let pauseUsed = false;
  for (const block of telling.split(/\n\s*\n/)) {
    if (!block.trim()) continue;
    const mark = PAUSE_MARK_RE.exec(block);
    if (mark) {
      const inline = plainText(mark[1] ?? "");
      const question = inline || pauseSection?.question;
      if (question) {
        items.push({ type: "pause", question, answersFirst: pauseSection?.answersFirst });
        pauseUsed = true;
      }
      continue;
    }
    const text = plainText(block);
    if (!text) continue;
    items.push({ type: "paragraph", index: paragraphs.length, text });
    paragraphs.push(text);
  }
  // No marker in the telling: ask the question at the end.
  if (!pauseUsed && pauseSection) items.push({ type: "pause", ...pauseSection });

  return {
    meta,
    contentHash: createHash("sha256").update(src).digest("hex"),
    source,
    items,
    paragraphs,
    pause: pauseSection,
    lastPage: plainText(sections["last page"] ?? ""),
  };
}

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(/* turbopackIgnore: true */ file, "utf8");
  } catch {
    return null;
  }
}

/** Loads a chapter from STORY_CONTENT_DIR, falling back to the bundled fixture. */
export async function loadChapter(id: string, contentDir = storyContentDir()): Promise<Chapter> {
  if (!CHAPTER_ID_RE.test(id)) throw new ChapterNotFoundError(id);
  const fromContent = await readIfExists(path.join(/* turbopackIgnore: true */ contentDir, `${id}.md`));
  if (fromContent) return parseChapter(fromContent, "content");
  const fixture = await readIfExists(path.join(/* turbopackIgnore: true */ FIXTURE_DIR, `${id}.md`));
  if (fixture) return parseChapter(fixture, "fixture");
  throw new ChapterNotFoundError(id);
}

export async function listChapters(contentDir = storyContentDir()): Promise<ChapterMeta[]> {
  const seen = new Map<string, ChapterMeta>();
  for (const [dir, source] of [
    [contentDir, "content"],
    [FIXTURE_DIR, "fixture"],
  ] as const) {
    let names: string[] = [];
    try {
      names = await fs.readdir(/* turbopackIgnore: true */ dir);
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      const id = name.replace(/\.md$/, "");
      if (!name.endsWith(".md") || !CHAPTER_ID_RE.test(id) || seen.has(id)) continue;
      try {
        seen.set(id, parseChapter(await fs.readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ dir, name), "utf8"), source).meta);
      } catch {
        // A draft that doesn't parse yet is skipped, not fatal.
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}
