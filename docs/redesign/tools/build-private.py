#!/usr/bin/env python3
"""Build Jon's private copy of the mockup (or any story file) from the public source.

The repo is public, so committed files use the sample family (Hugh, Alfie, Clara).
Jon's real family lives in docs/redesign/private/family.json (gitignored). Both
families sit in the same three slots, so a private copy is a straight name swap.

Usage:
  build-private.py mockup <out_dir>        copy canvas/project, swapping names on in-app screens
  build-private.py file <in.md> <out.md>   swap names in one file (e.g. a chapter draft)
"""
import json
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REDESIGN = HERE.parent
FAMILY = REDESIGN / "private" / "family.json"
PROJECT = REDESIGN / "canvas" / "project"

# Marketing screens (canvas row 1) always keep the sample family.
MARKETING = {
    "Home.dc.html", "HowItWorks.dc.html", "Research.dc.html", "Pricing.dc.html",
    "Faq.dc.html", "About.dc.html", "Grandparents.dc.html", "Homeschool.dc.html",
    "SampleChapter.dc.html",
}


def load_swaps():
    slots = json.loads(FAMILY.read_text())["slots"].values()
    return [(re.compile(rf"\b{re.escape(s['sample'])}\b"), s["real"]) for s in slots]


def swap(text, swaps):
    for pattern, real in swaps:
        text = pattern.sub(real, text)
    return text


def build_mockup(out_dir):
    swaps = load_swaps()
    out = Path(out_dir) / "project"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    changed = []
    for src in sorted(PROJECT.iterdir()):
        text = src.read_text()
        if src.suffix == ".html" and src.name not in MARKETING:
            new = swap(text, swaps)
            if new != text:
                changed.append(src.name)
            text = new
        (out / src.name).write_text(text)
    # Check: no sample names left on in-app screens.
    leftovers = [
        f.name for f in out.glob("*.dc.html")
        if f.name not in MARKETING and any(p.search(f.read_text()) for p, _ in swaps)
    ]
    if leftovers:
        sys.exit(f"sample names left in: {leftovers}")
    print(f"built {out} ({len(changed)} screens personalized)")


def build_file(src, dst):
    Path(dst).write_text(swap(Path(src).read_text(), load_swaps()))
    print(f"wrote {dst}")


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "mockup":
        build_mockup(sys.argv[2])
    elif len(sys.argv) == 4 and sys.argv[1] == "file":
        build_file(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
