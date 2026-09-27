#!/usr/bin/env python3
"""Check mockup screens (.dc.html) for broken markup and stale story content.

Usage: check-dc.py [file.dc.html ...]   (no args = every screen in canvas/project)
Exit code 1 if any ERROR is found. WARN lines are for a human (or agent) to judge.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent / "canvas" / "project"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "source", "track", "wbr"}
SUPPORT = '<script src="./support.js"></script>'

# Old story content that should be gone after the Candlemere sweep.
STALE = [r"\bTheo\b", r"\bJune\b", r"\bMax\b", r"\bPip\b", r"Brindlewick", r"Lantern Road",
         r"Hollow", r"Creaking Bridge", r"[Ll]ighthouse", r"Tide Keepers", r"Knight of the Road",
         r"Whispering Wood", r"First Dark Village", r"Lantern Quest", r"Keeper's Riddle",
         r"Lanterns in the Fog", r"Home by Starlight", r"Lantern in the Attic",
         r"blessing at lights-out", r"written by people", r"human-written", r"Bedtime Virtues",
         r"birthday candle", r"blow(ing)? out", r"Season 2 · Justice", r"Season 1 · Courage",
         r"first year, then \$49", r"for as long as you stay", r"lantern-bearer"]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
            return
        open_tags = [t for t, _ in self.stack]
        if tag in open_tags:
            while self.stack and self.stack[-1][0] != tag:
                t, line = self.stack.pop()
                self.errors.append(f"<{t}> opened on line {line} is never closed")
            self.stack.pop()
        else:
            self.errors.append(f"stray </{tag}> on line {self.getpos()[0]}")


def visible_text(html):
    """Markup without <style>/<script> blocks, roughly what a reader sees plus script strings."""
    return re.sub(r"<style>.*?</style>", "", html, flags=re.S)


def check(path, boards):
    errors, warns = [], []
    html = path.read_text()
    if SUPPORT not in html:
        errors.append("missing the exact support.js line")
    if "data-dc-script" not in html:
        errors.append("missing the <script type=\"text/x-dc\" data-dc-script> block")
    # Only check markup balance outside the component script.
    markup = re.sub(r'<script type="text/x-dc".*?</script>', "", html, flags=re.S)
    parser = Balance()
    parser.feed(markup)
    errors += parser.errors + [f"<{t}> opened on line {l} is never closed" for t, l in parser.stack
                               if t not in {"html", "body", "head"}]
    m = re.search(r"data-props='(.*?)'", html, flags=re.S)
    preview = None
    if not m:
        errors.append("no data-props")
    else:
        try:
            preview = json.loads(m.group(1)).get("$preview")
        except json.JSONDecodeError as e:
            errors.append(f"data-props is not valid JSON: {e}")
    board = boards.get(path.name)
    if board and preview and (preview.get("width"), preview.get("height")) != (board["w"], board["h"]):
        errors.append(f"$preview {preview} doesn't match canvas board {board['w']}x{board['h']}")
    root = re.search(r"</helmet>\s*<(\w+)[^>]*style=\"([^\"]*)\"", html)
    if board and root:
        w = re.search(r"(?<![-\w])width:\s*(\d+)px", root.group(2))
        h = re.search(r"(?<![-\w])height:\s*(\d+)px", root.group(2))
        if not w or not h or (int(w.group(1)), int(h.group(1))) != (board["w"], board["h"]):
            errors.append(f"root element size doesn't match canvas board {board['w']}x{board['h']}")
    text = visible_text(html)
    for pat in STALE:
        for hit in re.finditer(pat, text):
            s = max(0, hit.start() - 50)
            warns.append(f"stale '{hit.group(0)}': …{' '.join(text[s:hit.end() + 50].split())}…")
    if re.search(r"\b[Ll]amps?\b", text):
        warns.append("mentions 'lamp' (the nightly marker is a lantern; a real lamp in the story is fine)")
    if EMOJI.search(text):
        warns.append("contains an emoji")
    return errors, warns


def main():
    boards = json.loads((PROJECT / "canvas.json").read_text())["boards"]
    files = [Path(a) for a in sys.argv[1:]] or sorted(PROJECT.glob("*.dc.html"))
    bad = 0
    for f in files:
        errors, warns = check(f, boards)
        for e in errors:
            print(f"ERROR {f.name}: {e}")
        for w in warns:
            print(f"WARN  {f.name}: {w}")
        bad += bool(errors)
    print(f"{len(files)} checked, {bad} with errors")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
