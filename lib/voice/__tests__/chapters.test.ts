import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listChapters, loadChapter, parseChapter, parseFrontMatter, plainText } from "../chapters";

const dirs: string[] = [];
function tmp() {
  const d = mkdtempSync(path.join(os.tmpdir(), "gg-ch-"));
  dirs.push(d);
  return d;
}
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

const SRC = `---
id: s1-ch07
season: 1
part: 2
chapter: 7
title: "The Shut Doors"
tag: Brave
lead: Alfie
---

## Chapter-book telling

First *paragraph* here.
It wraps onto a second line.

**Pause & ask:** "Why did Alfie knock?"

> Second paragraph, quoted.

## Picture-book telling

Short.

## Pause & ask

**Question:** "A different question?"
**Answers first:** Alfie

## Last page

Tomorrow: more.
`;

describe("chapter loader", () => {
  it("parses front matter", () => {
    const { data } = parseFrontMatter(SRC);
    expect(data).toMatchObject({ id: "s1-ch07", title: "The Shut Doors", chapter: "7" });
  });

  it("reads chapter-book paragraphs, joining wrapped lines and dropping markdown", () => {
    const ch = parseChapter(SRC);
    expect(ch.meta).toMatchObject({ id: "s1-ch07", season: 1, part: 2, chapter: 7, tag: "Brave", lead: "Alfie" });
    expect(ch.paragraphs).toEqual(["First paragraph here. It wraps onto a second line.", "Second paragraph, quoted."]);
    expect(ch.lastPage).toBe("Tomorrow: more.");
  });

  it("puts the pause where the marker is, using the inline question", () => {
    const ch = parseChapter(SRC);
    expect(ch.items.map((i) => i.type)).toEqual(["paragraph", "pause", "paragraph"]);
    const pause = ch.items[1];
    expect(pause.type === "pause" && pause.question).toBe('"Why did Alfie knock?"');
    expect(pause.type === "pause" && pause.answersFirst).toBe("Alfie");
  });

  it("uses the section question for a bare [[Pause & ask]] marker, and never makes it a paragraph", async () => {
    const ch = await loadChapter("s1-ch01", tmp()); // empty content dir -> fixture
    expect(ch.source).toBe("fixture");
    expect(ch.meta.title).toBe("The Fox at the Window");
    expect(ch.paragraphs).toHaveLength(6);
    expect(ch.paragraphs.join(" ")).not.toMatch(/Pause/);
    const types = ch.items.map((i) => i.type);
    expect(types).toEqual(["paragraph", "paragraph", "paragraph", "paragraph", "pause", "paragraph", "paragraph"]);
    const pause = ch.items[4];
    expect(pause.type === "pause" && pause.question).toMatch(/^"Clara let a cold, wet fox/);
    expect(ch.paragraphs[0]).toMatch(/^The lights of Candlemere were going out/);
    expect(ch.paragraphs[0]).toMatch(/Tap\. Tap\. Tap\.$/);
  });

  it("appends the pause at the end when the telling has no marker", () => {
    const src = SRC.replace('**Pause & ask:** "Why did Alfie knock?"\n\n', "");
    const ch = parseChapter(src);
    expect(ch.items.map((i) => i.type)).toEqual(["paragraph", "paragraph", "pause"]);
  });

  it("prefers STORY_CONTENT_DIR over the fixture, and changes hash with content", async () => {
    const d = tmp();
    const real = SRC.replace("s1-ch07", "s1-ch01");
    writeFileSync(path.join(d, "s1-ch01.md"), real);
    const ch = await loadChapter("s1-ch01", d);
    expect(ch.source).toBe("content");
    const fixture = await loadChapter("s1-ch01", tmp());
    expect(ch.contentHash).not.toBe(fixture.contentHash);
  });

  it("rejects bad ids and missing chapters", async () => {
    await expect(loadChapter("../etc/passwd", tmp())).rejects.toThrow(/not found/);
    await expect(loadChapter("s1-ch99", tmp())).rejects.toThrow(/not found/);
    expect(() => parseChapter("---\nid: nope\n---\n")).toThrow(/valid id/);
  });

  it("lists content and fixture chapters without duplicates", async () => {
    const d = tmp();
    writeFileSync(path.join(d, "s1-ch07.md"), SRC);
    writeFileSync(path.join(d, "notes.md"), "not a chapter");
    const list = await listChapters(d);
    expect(list.map((c) => c.id)).toEqual(["s1-ch01", "s1-ch07"]);
  });

  it("plainText strips emphasis and links", () => {
    expect(plainText("*Tap.* **Bold** [link](http://x) _it_")).toBe("Tap. Bold link it");
  });
});
