#!/usr/bin/env python3
"""Render one Grit & Grace chapter for one family, as the voice engine's Markdown.

Usage:
  render-chapter.py <source.json> --blocks <blocks.json> [--pictures <pictures.json>]
                    --family <family.json> [--route A|B] [--season N] -o <out.md>

Inputs are the season-drafting outputs in docs/redesign/story/prompts.md:
  source.json    prompt 1d (CHAPTER_SCHEMA): the chapter-book telling and its extras
  blocks.json    prompt 1f: the reviewed variant blocks and look options
  pictures.json  prompt 1e: the picture-book telling and its pictures (optional)
  family.json    the FAMILY object (prompts.md section 4), e.g. story/sample-family.json

Every story slot marker (prompts.md section 3) is filled by rule in code: children,
pronouns, blocks (pronoun, grandparent, parents, family size, age band, access, vote
route), likeness touches from the avatar builder values (first listed option the child
has, at most two touches per telling), the grandparent, the parents, cast alternates,
and Tier C slots with their reviewed defaults. Vote routes render route A unless
--route B is given.

The output is the Markdown the voice engine's loader reads (lib/voice/chapters.ts):
front matter, "## Chapter-book telling" (with a "[[Pause & ask]]" paragraph after
pause_and_ask.after_paragraph), "## Picture-book telling", "## Pause & ask",
"## Last page", then reviewer sections: "## For the grown-up", "## Vote",
"## Remember when", "## Pictures", "## Defaults", "## Flags for Jon".

It fails loudly (exit 2, nothing written) on an unknown marker, a missing block or
block version, a missing Tier C default, a slot the family doesn't have, or any
marker left over after filling.

Standard library only. check-chapter.py imports this file for its marker and render
logic, so the two always agree.
"""
import argparse
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants from prompts.md

CHILD_SLOTS = ("eldest", "middle", "middle2", "youngest")
ROLE_SLOTS = ("lead", "turn")
CHILD_ARGS = CHILD_SLOTS + ROLE_SLOTS + ("all",)
GP_ARGS = ("called", "name", "called.1", "called.2", "both", "remembered", "real")
TIERC_TYPES = ("legend", "jar", "jar_credit", "favorite", "rw", "gp_words", "plan", "guest")
PRONOUNS = {
    "he": {"subj": "he", "obj": "him", "pos": "his", "refl": "himself"},
    "she": {"subj": "she", "obj": "her", "pos": "her", "refl": "herself"},
    "they": {"subj": "they", "obj": "them", "pos": "their", "refl": "themselves"},
}
BANDS = ("3-4", "5-6", "7-9")
ACCESS_KINDS = ("wheelchair", "hearing", "low_vision", "signs", "talker")
PAUSE_PARAGRAPH = "[[Pause & ask]]"
GROWN_UP_LINE = ("Whatever they say, say it back a little longer: 'Yes, she was scared, "
                 "and she went anyway.' There's no wrong answer.")
CALM_CLOSE = "Fire banked. Sleep low, stay warm, wake bright."
REAL_NO_GP = "a grown-up who loves you"

MARKER_RE = re.compile(r"\[\[([^\[\]]*)\]\]")
BLOCK_ID_RE = re.compile(r"^[A-Za-z0-9][\w.\-]*$")
CAST_NAME_RE = re.compile(r"^[A-Z][A-Za-z' ]*$")
TIERC_RE = re.compile(r"^(?P<type>[a-z_]+)\|default:(?P<id>[\w.\-]+)$")
LOOK_RE = re.compile(r"^(?P<slot>[a-z0-9]+)\|(?P<id>[\w.\-]+)$")
PRO_RE = re.compile(r"^(?P<slot>[a-z0-9]+)\.(?P<form>obj|pos)$")


class RenderError(Exception):
    """A fault in the season text or the family object. Always fatal."""


# ---------------------------------------------------------------------------
# Markers

def parse_marker(inner):
    """Parse the inside of a [[...]] marker. Returns (kind, arg). Raises on anything unknown."""
    if ":" not in inner:
        raise RenderError(f"unknown marker [[{inner}]]")
    kind, arg = inner.split(":", 1)
    if kind == "child":
        if arg not in CHILD_ARGS:
            raise RenderError(f"unknown child slot in [[{inner}]]")
        return kind, arg
    if kind == "pro":
        m = PRO_RE.match(arg)
        if not m or m.group("slot") not in CHILD_SLOTS + ROLE_SLOTS:
            raise RenderError(f"unknown pronoun marker [[{inner}]] (only SLOT.obj and SLOT.pos)")
        return kind, (m.group("slot"), m.group("form"))
    if kind == "block":
        if not BLOCK_ID_RE.match(arg):
            raise RenderError(f"bad block id in [[{inner}]]")
        return kind, arg
    if kind == "look":
        m = LOOK_RE.match(arg)
        if not m or m.group("slot") not in CHILD_SLOTS + ROLE_SLOTS:
            raise RenderError(f"bad look marker [[{inner}]] (want [[look:SLOT|ID]])")
        return kind, (m.group("slot"), m.group("id"))
    if kind == "gp":
        if arg not in GP_ARGS:
            raise RenderError(f"unknown grandparent marker [[{inner}]]")
        return kind, arg
    if kind == "parents":
        if arg != "called":
            raise RenderError(f"unknown parents marker [[{inner}]]")
        return kind, arg
    if kind == "cast":
        if not CAST_NAME_RE.match(arg):
            raise RenderError(f"bad cast name in [[{inner}]]")
        return kind, arg
    if kind == "tierc":
        m = TIERC_RE.match(arg)
        if not m or m.group("type") not in TIERC_TYPES:
            raise RenderError(f"unknown Tier C marker [[{inner}]]")
        return kind, (m.group("type"), m.group("id"))
    raise RenderError(f"unknown marker [[{inner}]]")


def markers_in(text):
    """Every marker in a string, as (full_text, kind, arg). Raises on an unknown one."""
    out = []
    for m in MARKER_RE.finditer(text or ""):
        kind, arg = parse_marker(m.group(1))
        out.append((m.group(0), kind, arg))
    return out


# ---------------------------------------------------------------------------
# Loading

def load_json(path, what):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise RenderError(f"{what} not found: {path}")
    except json.JSONDecodeError as e:
        raise RenderError(f"{what} is not valid JSON ({path}): {e}")


def index_blocks(blocks_json):
    """{id: block} and {id: look}. Duplicate ids are a fault."""
    blocks, looks = {}, {}
    for b in (blocks_json or {}).get("blocks", []):
        bid = b.get("id")
        if not bid or bid in blocks:
            raise RenderError(f"block with missing or duplicate id: {bid!r}")
        if not isinstance(b.get("versions"), dict) or not b["versions"]:
            raise RenderError(f"block {bid} has no versions")
        if not b.get("varies_by"):
            raise RenderError(f"block {bid} has no varies_by")
        blocks[bid] = b
    for lk in (blocks_json or {}).get("looks", []):
        lid = lk.get("id")
        if not lid or lid in looks:
            raise RenderError(f"look with missing or duplicate id: {lid!r}")
        if not isinstance(lk.get("options"), dict):
            raise RenderError(f"look {lid} has no options")
        looks[lid] = lk
    return blocks, looks


def index_defaults(source):
    """Tier C reviewed defaults by id: tier_c_defaults, plus remember_when / plan_reminder /
    letter_home / gp_reply objects that carry an id."""
    out = {}
    for d in source.get("tier_c_defaults") or []:
        if not d.get("id"):
            raise RenderError("a tier_c_defaults entry has no id")
        out[d["id"]] = d
    for key in ("remember_when", "plan_reminder", "letter_home"):
        v = source.get(key)
        if isinstance(v, dict) and v.get("id") and v["id"] not in out:
            out[v["id"]] = dict(v, slot=v.get("slot_type", key))
    return out


def default_text(d, picture=False):
    if picture and d.get("picture_text"):
        return d["picture_text"]
    if d.get("text") is not None:
        return d["text"]
    if d.get("paragraphs"):
        return "\n\n".join(p["text"] for p in d["paragraphs"])
    raise RenderError(f"Tier C default {d.get('id')} has no text")


# ---------------------------------------------------------------------------
# Family values worked out by code (prompts.md sections 3 and 4)

def child_name(c):
    return c.get("nickname") or c["name"]


def join_names(names):
    names = [n for n in names if n]
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + " and " + names[-1]


def gp_values(family):
    gp = family.get("grandparent") or {}
    setup = gp.get("setup")
    people = gp.get("people") or []
    if setup not in ("one", "two", "nan", "remembered"):
        raise RenderError(f"FAMILY.grandparent.setup is {setup!r}; want one, two, nan or remembered")
    called = gp.get("story_called")
    name = gp.get("story_name")
    if setup == "one" and (not called or not name):
        if not people:
            raise RenderError("grandparent setup 'one' with no people")
        p = people[0]
        called = called or p["called"]
        nm = p.get("name")
        name = name or (f"{p['called']} {nm}" if nm and nm not in p["called"] else p["called"])
    if setup in ("nan", "remembered"):
        called = called or "Nan"
        name = name or "Nan"
    return {"setup": setup, "people": people, "called": called, "name": name}


def slot_order(children):
    order = {s: i for i, s in enumerate(CHILD_SLOTS)}
    return sorted(children, key=lambda c: order.get(c["slot"], 9))


def compute_slots(family, source, turn_override=None):
    """The SLOTS map for this chapter (prompts.md section 3)."""
    children = family.get("children") or []
    if not children:
        raise RenderError("FAMILY has no children")
    by_slot = {}
    for c in children:
        s = c.get("slot")
        if s not in CHILD_SLOTS:
            raise RenderError(f"child {c.get('name')!r} has unknown slot {s!r}")
        if s in by_slot:
            raise RenderError(f"two children in slot {s}")
        if c.get("pronoun") not in PRONOUNS:
            raise RenderError(f"child in slot {s} has pronoun {c.get('pronoun')!r}; want he, she or they")
        by_slot[s] = c
    if "eldest" not in by_slot:
        raise RenderError("FAMILY has no child in the eldest slot")
    n = len(children)

    # lead: lead_by_size for this family's size, else the canon lead when the family has it.
    lead = None
    lbs = source.get("lead_by_size") or {}
    if lbs:
        lead = lbs.get(str(min(n, 4)))
        if not lead:
            raise RenderError(f"lead_by_size has no entry for a family of {n}")
    elif source.get("lead") in by_slot:
        lead = source["lead"]
    elif n == 1:
        lead = "eldest"
    else:
        raise RenderError(f"chapter has no lead_by_size and this family has no {source.get('lead')!r} slot")
    if lead == "all":
        lead_slot = None
    else:
        if lead not in by_slot:
            raise RenderError(f"lead slot {lead!r} is not in this family")
        lead_slot = lead

    # turn: eldest, then youngest, then middles from oldest down, one part each (bible §5).
    if turn_override:
        turn = turn_override
    elif source.get("turn_slot"):
        turn = source["turn_slot"]
    else:
        rota = [s for s in ("eldest", "youngest", "middle", "middle2") if s in by_slot]
        part = int(source.get("part") or 1)
        turn = rota[(part - 1) % len(rota)]
    if turn not in by_slot:
        raise RenderError(f"turn slot {turn!r} is not in this family")

    ordered = slot_order(children)
    listener_eldest = ordered[0]["slot"]
    listener_youngest = ordered[-1]["slot"]

    # answers_first: the role 1d gave, moved off a child whose own mistake the question touches.
    pa = source.get("pause_and_ask") or {}
    role = pa.get("answers_first") or "turn"
    role_slot = {"turn": turn, "lead": lead_slot or turn}.get(role, role)
    touches = pa.get("touches_mistake_of")
    if touches in ("lead", "turn"):
        touches = {"lead": lead_slot, "turn": turn}[touches]
    if n == 1 and touches:
        answers_first = "the grown-up"
    else:
        cand = role_slot
        if cand == touches or cand not in by_slot:
            for alt in (turn, lead_slot, listener_youngest):
                if alt and alt in by_slot and alt != touches:
                    cand = alt
                    break
        answers_first = child_name(by_slot[cand]) if cand in by_slot else "the grown-up"

    return {
        "by_slot": by_slot,
        "size": n,
        "lead": lead_slot,
        "lead_all": lead == "all",
        "turn": turn,
        "answers_first": answers_first,
        "listener_eldest": listener_eldest,
        "listener_youngest": listener_youngest,
        "ordered": ordered,
    }


def look_values(child):
    """Every avatar builder value the child has, as lower-case keys ("glasses", "curls",
    "hair:curls", "red bow", "wheelchair", ...)."""
    look = child.get("look") or {}
    vals = set()

    def add(field, v):
        if v is None or v is False or v == "":
            return
        v = str(v).strip().lower()
        for form in {v, v.replace("_", " "), v.replace(" ", "_")}:
            vals.add(form)
            vals.add(f"{field}:{form}")

    add("hair", look.get("hair"))
    if look.get("hair") and look.get("hair_color"):
        add("hair", f"{look['hair_color']} {look['hair']}")
    if look.get("glasses"):
        add("glasses", "glasses")
    if look.get("freckles"):
        add("freckles", "freckles")
    add("clothes", look.get("clothes"))
    if look.get("clothes") and look.get("clothes_color"):
        add("clothes", f"{look['clothes_color']} {look['clothes']}")
    for e in look.get("extras") or []:
        add("extras", e)
    for field in ("mobility", "hearing", "communication"):
        add(field, look.get(field))
    mob = str(look.get("mobility") or "").lower()
    if "wheelchair" in mob:
        add("mobility", "wheelchair")
    hear = str(look.get("hearing") or "").lower()
    if hear:
        add("hearing", "hearing aids")
        add("hearing", "hearing")
    return vals


def access_kind(child):
    look = child.get("look") or {}
    mob = str(look.get("mobility") or "").lower()
    if "wheelchair" in mob:
        return "wheelchair"
    if look.get("hearing"):
        return "hearing"
    if str(look.get("vision") or "").lower() in ("low", "low_vision", "low vision"):
        return "low_vision"
    comm = str(look.get("communication") or "").lower()
    if "sign" in comm:
        return "signs"
    if "talker" in comm or "device" in comm or "aac" in comm:
        return "talker"
    return "default"


# ---------------------------------------------------------------------------
# The renderer

class Renderer:
    """Fills markers for one family. ctx is "story", "pause", "lastpage" or "real"."""

    def __init__(self, source, blocks_json, family, route="A", turn_override=None, tierc_text=None):
        self.source = source
        # {Tier C type: text or None}: fills that slot type with this text instead of its
        # default ("" when None). check-chapter.py uses it to test lengths and the Pause & ask
        # position with the jar slot empty, or holding a 150- or 250-word scene.
        self.tierc_text = tierc_text or {}
        self.family = family
        self.route = route
        self.blocks, self.looks = index_blocks(blocks_json)
        self.defaults = index_defaults(source)
        self.slots = compute_slots(family, source, turn_override)
        self.gp = gp_values(family)
        self.parents = family.get("parents") or {}
        if self.parents.get("setup") not in ("two", "one", "none_set"):
            raise RenderError(f"FAMILY.parents.setup is {self.parents.get('setup')!r}; want two, one or none_set")
        self.cast_alt = family.get("cast_alternates") or {}
        self.used_blocks = []      # (block id, version) in the order chosen
        self.used_looks = []       # (look id, option key, telling)
        self.used_defaults = []    # Tier C default ids filled
        self.look_count = {}       # telling -> touches placed

    # -- slot helpers
    def slot_of(self, slot, ctx):
        if ctx in ("pause", "lastpage", "real"):
            if slot == "eldest":
                slot = self.slots["listener_eldest"]
            elif slot == "youngest":
                slot = self.slots["listener_youngest"]
        if slot == "lead":
            if self.slots["lead_all"]:
                raise RenderError("[[child:lead]] or [[pro:lead…]] used in a chapter led by all the children")
            slot = self.slots["lead"]
        elif slot == "turn":
            slot = self.slots["turn"]
        if slot not in self.slots["by_slot"]:
            raise RenderError(f"slot {slot!r} is not in this family (a marker for it must sit inside a family-size block)")
        return slot

    def child(self, slot, ctx):
        return self.slots["by_slot"][self.slot_of(slot, ctx)]

    # -- block choice by rule
    def choose_version(self, block):
        bid, axis, versions = block["id"], block["varies_by"], block["versions"]
        kind, _, arg = axis.partition(":")

        def pick(*keys):
            for k in keys:
                if k in versions:
                    return k
            raise RenderError(f"block {bid} ({axis}) has no version for this family (tried {', '.join(keys)})")

        if kind == "pronoun":
            if arg in ("grandparent", "gp"):
                if self.gp["setup"] != "one":
                    raise RenderError(f"block {bid} is keyed to the grandparent's pronoun, but setup is {self.gp['setup']}")
                return pick(self.gp["people"][0].get("pronoun") or "she")
            if arg == "parents":
                if self.parents.get("setup") != "one":
                    raise RenderError(f"block {bid} is keyed to one parent's pronoun, but setup is {self.parents.get('setup')}")
                return pick(self.parents.get("pronoun") or "they")
            return pick(self.child(arg, "story")["pronoun"])
        if kind in ("grandparent", "gp"):
            s = self.gp["setup"]
            if s == "one":
                p = self.gp["people"][0].get("pronoun") or "she"
                return pick(f"one.{p}", f"one_{p}", f"one:{p}", p, "one")
            return pick(s)
        if kind == "parents":
            s = self.parents["setup"]
            if s == "one":
                p = self.parents.get("pronoun") or "they"
                return pick(f"one.{p}", f"one_{p}", f"one:{p}", p, "one")
            if s == "none_set":
                return pick("none_set", "none")
            return pick("two")
        if kind == "family_size":
            return pick(str(min(self.slots["size"], 4)))
        if kind in ("age_band", "band"):
            return pick(self.child(arg, "story")["band"])
        if kind == "access":
            a = access_kind(self.child(arg, "story"))
            return pick(a, "default") if a != "default" else pick("default")
        if kind in ("route", "vote", "vote_route"):
            return pick(self.route)
        raise RenderError(f"block {bid} varies by unknown axis {axis!r}")

    # -- marker values
    def value(self, kind, arg, ctx, telling, depth):
        if kind == "child":
            if arg == "all":
                return join_names([child_name(c) for c in self.slots["ordered"]])
            return child_name(self.child(arg, ctx))
        if kind == "pro":
            slot, form = arg
            return PRONOUNS[self.child(slot, ctx)["pronoun"]][form]
        if kind == "block":
            b = self.blocks.get(arg)
            if b is None:
                raise RenderError(f"missing block [[block:{arg}]]")
            key = self.choose_version(b)
            self.used_blocks.append((arg, key))
            return self.fill(b["versions"][key], ctx, telling, depth + 1)
        if kind == "look":
            slot, lid = arg
            lk = self.looks.get(lid)
            if lk is None:
                raise RenderError(f"missing look [[look:{slot}|{lid}]]")
            if lk.get("slot") and lk["slot"] != slot:
                raise RenderError(f"look {lid} is for slot {lk['slot']} but the marker says {slot}")
            have = look_values(self.child(slot, ctx))
            chosen = "none"
            for key in lk["options"]:
                if key == "none":
                    continue
                if key.strip().lower() in have:
                    chosen = key
                    break
            if chosen != "none":
                if self.look_count.get(telling, 0) >= 2:
                    chosen = "none"        # the two-touch cap, in reading order
                else:
                    self.look_count[telling] = self.look_count.get(telling, 0) + 1
            self.used_looks.append((lid, chosen, telling))
            if chosen == "none":
                return ""
            return self.fill(lk["options"][chosen], ctx, telling, depth + 1)
        if kind == "gp":
            s = self.gp["setup"]
            if arg == "called":
                if not self.gp["called"]:
                    raise RenderError("[[gp:called]] outside a grandparent block, with two grandparents")
                return self.gp["called"]
            if arg == "name":
                if not self.gp["name"]:
                    raise RenderError("[[gp:name]] outside a grandparent block, with two grandparents")
                return self.gp["name"]
            if arg in ("called.1", "called.2", "both"):
                if s != "two" or len(self.gp["people"]) < 2:
                    raise RenderError(f"[[gp:{arg}]] used, but the grandparent setup is {s}")
                c1, c2 = self.gp["people"][0]["called"], self.gp["people"][1]["called"]
                return {"called.1": c1, "called.2": c2, "both": f"{c1} and {c2}"}[arg]
            if arg == "remembered":
                if s != "remembered" or not self.gp["people"]:
                    raise RenderError(f"[[gp:remembered]] used, but the grandparent setup is {s}")
                return self.gp["people"][0]["called"]
            if arg == "real":
                if s == "one":
                    return self.gp["called"]
                if s == "two":
                    return f"{self.gp['people'][0]['called']} and {self.gp['people'][1]['called']}"
                return REAL_NO_GP
        if kind == "parents":
            called = self.parents.get("called")
            if not called or self.parents.get("setup") == "none_set":
                raise RenderError("[[parents:called]] reached with no parents set (it belongs only in the two or one version)")
            return called
        if kind == "cast":
            return self.cast_alt.get(arg, arg)
        if kind == "tierc":
            typ, did = arg
            if typ in self.tierc_text:
                return self.tierc_text[typ] or ""
            if did == "none":
                return ""
            d = self.defaults.get(did)
            if d is None:
                raise RenderError(f"missing Tier C default {did!r} for [[tierc:{typ}|default:{did}]]")
            self.used_defaults.append(did)
            return self.fill(default_text(d, picture=(telling == "picture")), ctx, telling, depth + 1)
        raise RenderError(f"unknown marker kind {kind}")

    def fill(self, text, ctx="story", telling="chapter", depth=0):
        if text is None:
            return None
        if depth > 12:
            raise RenderError("blocks nest more than 12 deep (a block probably includes itself)")

        def sub(m):
            kind, arg = parse_marker(m.group(1))
            return self.value(kind, arg, ctx, telling, depth)

        out = MARKER_RE.sub(sub, text)
        if depth == 0:
            out = tidy(out)
            left = MARKER_RE.findall(out)
            if left:
                raise RenderError(f"marker left after filling: [[{left[0]}]]")
        return out


def tidy(s):
    """Collapse the gaps an empty slot leaves ("  ", " ." and a leading space)."""
    lines = []
    for para in re.split(r"\n\s*\n", s):
        p = re.sub(r"[ \t]{2,}", " ", para)
        p = re.sub(r" +([.,;:!?])", r"\1", p)
        lines.append(p.strip())
    return "\n\n".join(x for x in lines if x)


# ---------------------------------------------------------------------------
# Markdown assembly

def fm_value(v):
    s = str(v)
    if s[:1] in "\"'" or s.startswith(("#", "-", "[", "{")) or s != s.strip():
        return json.dumps(s, ensure_ascii=False)
    return s


def quoted(s):
    s = (s or "").strip()
    if not s:
        return s
    if s[0] in "\"“":
        return s
    return f"\"{s}\""


def describe_image(img, r):
    if not isinstance(img, dict):
        return str(img or "")
    parts = []
    for key in ("setting", "light"):
        if img.get(key):
            parts.append(f"{key}: {img[key]}")
    figs = []
    for fg in img.get("figures") or []:
        who = fg.get("who", "?")
        if who in CHILD_SLOTS and who in r.slots["by_slot"]:
            who = f"{who} ({child_name(r.slots['by_slot'][who])})"
        bits = [who]
        for k in ("position", "doing", "feeling_shown"):
            if fg.get(k):
                bits.append(fg[k])
        figs.append(", ".join(bits))
    if figs:
        parts.append("figures: " + "; ".join(figs))
    if img.get("props"):
        parts.append("props: " + ", ".join(img["props"]))
    for key in ("ember", "framing", "comfort_in_frame"):
        if img.get(key):
            parts.append(f"{key.replace('_', ' ')}: {img[key]}")
    return " · ".join(parts)


def render_telling(r, source):
    """The chapter-book telling as [(id, filled text)]: the opening block ("open.legend",
    "open.gp_reply", "open.last_time"), then every paragraph. Empty items are kept, with ""."""
    items = []
    ob = source.get("opening_block") or {}
    for key in ("legend", "gp_reply", "last_time"):
        items.append((f"open.{key}", r.fill(ob.get(key), "story", "chapter") if ob.get(key) else ""))
    for p in source["paragraphs"]:
        items.append((p.get("id"), r.fill(p.get("text", ""), "story", "chapter")))
    return items


def render_markdown(source, blocks_json, pictures, family, route="A", season=None, source_name="", turn=None,
                    tierc_text=None):
    for need in ("chapter", "part", "title", "tag", "paragraphs", "pause_and_ask", "last_page"):
        if need not in source:
            raise RenderError(f"source JSON has no {need!r} (prompt 1d's CHAPTER_SCHEMA)")
    if source.get("status", "ok") != "ok":
        raise RenderError(f"source status is {source.get('status')!r}, not ok")
    r = Renderer(source, blocks_json, family, route=route, turn_override=turn, tierc_text=tierc_text)
    season = int(season or source.get("season") or (family.get("place_in_season") or {}).get("season") or 1)
    ch = int(source["chapter"])
    cid = f"s{season}-ch{ch:02d}"
    tag_line = source["tag"]
    strength = tag_line.split("·")[0].strip()
    if r.slots["lead_all"]:
        lead_name = join_names([child_name(c) for c in r.slots["ordered"]])
    else:
        lead_name = child_name(r.slots["by_slot"][r.slots["lead"]])

    pa = source["pause_and_ask"]
    para_ids = [p.get("id") for p in source["paragraphs"]]
    after = pa.get("after_paragraph")
    if after not in para_ids:
        raise RenderError(f"pause_and_ask.after_paragraph {after!r} is not a paragraph id")

    out = []
    out += ["---", f"id: {cid}", f"season: {season}", f"part: {int(source['part'])}", f"chapter: {ch}",
            f"title: {fm_value(source['title'])}", f"tag: {fm_value(strength)}", f"lead: {fm_value(lead_name)}", "---", ""]
    out += ["<!--",
            f"Rendered by docs/redesign/tools/render-chapter.py from {source_name or 'the chapter source'}",
            f"for family {family.get('family_id', '?')}, vote route {route}. Do not edit by hand: change the",
            "source, blocks or pictures JSON and render again.",
            "-->", ""]

    # Chapter-book telling
    out += ["## Chapter-book telling", ""]
    ob = source.get("opening_block") or {}
    for pid, t in render_telling(r, source):
        if t:
            out += [t, ""]
        if pid == after:
            out += [PAUSE_PARAGRAPH, ""]

    # Picture-book telling
    out += ["## Picture-book telling", ""]
    pics = (pictures or {}).get("pictures") or []
    if not pics:
        out += ["<!-- No pictures JSON was given (prompt 1e). -->", ""]
    for pic in pics:
        t = r.fill(pic.get("text", ""), "story", "picture")
        if t:
            out += [t, ""]

    # Pause & ask
    out += ["## Pause & ask", ""]
    if pa.get("in_the_story"):
        out += [f"**In the story:** {r.fill(pa['in_the_story'], 'pause')}", ""]
    if not pa.get("question"):
        raise RenderError("pause_and_ask has no question")
    out += [f"**Question:** {quoted(r.fill(pa['question'], 'pause'))}", ""]
    out += [f"**Answers first:** {r.slots['answers_first']}", ""]
    if pa.get("if_stuck"):
        out += ["**If they're stuck:** " + " · ".join(quoted(r.fill(x, 'pause')) for x in pa["if_stuck"]), ""]
    fy = pa.get("for_the_youngest") or {}
    if fy.get("talk") or fy.get("do_it"):
        bits = []
        if fy.get("talk"):
            bits.append(quoted(r.fill(fy["talk"], "pause")))
        if fy.get("do_it"):
            bits.append("Do it: " + quoted(r.fill(fy["do_it"], "pause")))
        yname = child_name(r.slots["by_slot"][r.slots["listener_youngest"]])
        out += [f"**For the youngest ({yname}):** " + " · ".join(bits), ""]
    if pa.get("stretch"):
        out += [f"**Stretch:** {quoted(r.fill(pa['stretch'], 'pause'))}", ""]
    out += [f"**For the grown-up:** {r.fill(pa.get('for_the_grown_up') or '', 'pause')}", ""]
    simple = (pictures or {}).get("pause_and_ask_simple")
    if simple:
        line = f"**Picture-book question (picture {simple.get('picture')}):** {quoted(r.fill(simple.get('question', ''), 'pause'))}"
        out += [line, ""]
        sfy = simple.get("for_the_youngest") or {}
        if sfy.get("talk") or sfy.get("do_it"):
            bits = [quoted(r.fill(sfy[k], "pause")) if k == "talk" else "Do it: " + quoted(r.fill(sfy[k], "pause"))
                    for k in ("talk", "do_it") if sfy.get(k)]
            out += ["**Picture-book, for the youngest:** " + " · ".join(bits), ""]

    # Last page
    lp = source["last_page"]
    out += ["## Last page", "", f"**The end of Chapter {ch}**", ""]
    if lp.get("why_question"):
        out += [f"**Why do you think…?** {r.fill(lp['why_question'], 'lastpage')} *Ask now, or save it for breakfast.*", ""]
    if lp.get("what_happened"):
        out += [f"**What happened:** {r.fill(lp['what_happened'], 'lastpage')}", ""]
    if lp.get("blessing_key") and family.get("faith_on"):
        out += [f"**Blessing:** {lp['blessing_key']}", ""]
    out += [r.fill(lp.get("calm_close") or "", "lastpage"), ""]
    if lp.get("next_time"):
        out += [f"**Next time:** {lp['next_time']}", ""]
    fm = lp.get("for_the_morning") or {}
    missions = fm.get("missions") or {}
    if missions or fm.get("tell_it_back"):
        out += ["**For the morning**", ""]
        for c in r.slots["ordered"]:
            m = missions.get(c.get("band"))
            if m is None:
                raise RenderError(f"no mission for band {c.get('band')} ({child_name(c)})")
            out.append(f"- {child_name(c)}: {r.fill(m, 'real')}")
        if fm.get("tell_it_back"):
            out.append(f"- Tell it back: {r.fill(fm['tell_it_back'], 'real')}")
        out.append("")

    # Reviewer sections
    out += ["## For the grown-up", ""]
    out.append(f"- **Tag:** {tag_line}")
    if source.get("fear_level") is not None:
        out.append(f"- **Fear level:** {source['fear_level']}" + (f" ({source['fear_reason']})" if source.get("fear_reason") else ""))
    ce = source.get("classical_echo") or {}
    if ce:
        note = ce.get("grown_up_note") or ""
        out.append(f"- **Echo:** {ce.get('source', '')}" + (f" ({ce.get('move')})" if ce.get("move") else "") + (f". {note}" if note else ""))
        if ce.get("faith_note") and family.get("faith_on"):
            out.append(f"- **Faith echo:** {ce['faith_note']}")
    rw = source.get("rich_words") or []
    if rw:
        out.append("- **Rich words:** " + "; ".join(
            f"{w.get('word')}" + (" (everyday)" if w.get("everyday") else "") + (f", {', '.join(w.get('paragraphs', []))}" if w.get("paragraphs") else "")
            for w in rw))
    ji = source.get("join_in") or {}
    if ji:
        out.append(f"- **Join-in:** {r.fill(ji.get('line', ''), 'story')} ({ji.get('paragraph', '?')})")
    rl = source.get("reading_lines") or {}
    yl = rl.get("your_line") or {}
    if yl:
        ename = child_name(r.slots["by_slot"][r.slots["listener_eldest"]])
        out.append(f"- **Your line** (for {ename}): {r.fill(yl.get('text', ''), 'story')} ({yl.get('paragraph', '?')})")
    if rl.get("big_print"):
        out.append("- **Big-print words:** " + " · ".join(r.fill(x, "story") for x in rl["big_print"]))
    for key, label in (("story_question", "Story question"), ("modeled_behavior", "Modeled behavior"),
                       ("key_act", "Key act"), ("laugh", "Laugh")):
        v = source.get(key)
        if isinstance(v, dict) and v:
            txt = v.get("text") or v.get("phrase") or v.get("summary") or v.get("line") or ""
            who = v.get("asked_by") or v.get("slot")
            where = ", ".join(x for x in (who, v.get("paragraph")) if x)
            extra = f" ({where})" if where else ""
            gest = f" Gesture: {v['gesture_text']}" if v.get("gesture_text") else ""
            out.append(f"- **{label}:** {r.fill(txt, 'story')}{gest}{extra}")
    if source.get("sound_words"):
        out.append("- **Sound words:** " + ", ".join(source["sound_words"]))
    if source.get("hook"):
        out.append(f"- **Hook:** {r.fill(source['hook'], 'story')}")
    if source.get("in_real_life_needed"):
        out.append("- **In real life:** " + " ".join(source["in_real_life_needed"]))
    out.append("")

    out += ["## Vote", ""]
    v = source.get("vote")
    if v:
        out.append(f"Vote {v.get('number', '?')}: {r.fill(v.get('setup', ''), 'story')}")
        out.append("")
        for o in v.get("options") or []:
            out.append(f"- **{o.get('key')}. {r.fill(o.get('title', ''), 'story')}** {r.fill(o.get('line', ''), 'story')} Button: \"{o.get('button', '')}\"")
        out.append("")
    else:
        out += ["No vote at the end of this chapter.", ""]
    route_blocks = [b for b, _ in r.used_blocks if r.blocks[b]["varies_by"].split(":")[0] in ("route", "vote", "vote_route")]
    out += [f"This rendering follows route {route}" + (f" (blocks {', '.join(sorted(set(route_blocks)))})." if route_blocks else "; no paragraph in it depends on the route."), ""]

    out += ["## Remember when", ""]
    rwh = source.get("remember_when")
    if rwh:
        out += [r.fill(rwh.get("text", ""), "story"), ""]
        if rwh.get("ask"):
            out += [r.fill(rwh["ask"], "pause"), ""]
        if rwh.get("hint"):
            out += [f"**Hint:** {r.fill(rwh['hint'], 'pause')}", ""]
    else:
        out += ["None in this chapter.", ""]

    out += ["## Pictures", ""]
    if not pics:
        out += ["No pictures JSON was given.", ""]
    for pic in pics:
        roles = ", ".join(pic.get("roles") or []) or "none"
        desc = describe_image(pic.get("image"), r) or "(no image description)"
        out.append(f"- **{pic.get('n')}** · pinned to {pic.get('pinned_to')} · roles: {roles} · {desc}")
    if pics:
        out.append("")

    out += ["## Defaults", ""]
    wrote = False
    if ob.get("last_time"):
        out.append(f"- **Last time** (opening block): {r.fill(ob['last_time'], 'story')}")
        wrote = True
    if ob.get("gp_reply"):
        out.append(f"- **Grandparent reply** (opening block): {r.fill(ob['gp_reply'], 'story')}")
        wrote = True
    for d in source.get("tier_c_defaults") or []:
        txt = r.fill(default_text(d), "story").replace("\n\n", " ¶ ")
        words = f", {d['words']} words" if d.get("words") is not None else ""
        out.append(f"- **{d.get('slot')}** `{d.get('id')}`{words}: {txt}")
        wrote = True
    for key, label in (("plan_reminder", "Plan reminder"), ("letter_home", "Letter home")):
        vv = source.get(key)
        if vv:
            txt = vv.get("text") if isinstance(vv, dict) else vv
            out.append(f"- **{label}:** {r.fill(txt, 'story')}")
            wrote = True
    if not wrote:
        out.append("None: this chapter has no Tier C slot with a default.")
    out.append("")

    out += ["## Flags for Jon", ""]
    flags = []
    for src_name, obj in (("chapter", source), ("pictures", pictures or {}), ("blocks", blocks_json or {})):
        for fl in obj.get("flags_for_jon") or []:
            flags.append(f"({src_name}) {fl if isinstance(fl, str) else json.dumps(fl, ensure_ascii=False)}")
    for sc in source.get("self_check") or []:
        if isinstance(sc, dict) and sc.get("ok") is False:
            flags.append(f"(self-check item {sc.get('item')}) {sc.get('note', '')}")
    if flags:
        out += [f"- {f}" for f in flags]
    else:
        out.append("None.")
    out.append("")

    md = "\n".join(out)
    left = [m for m in MARKER_RE.findall(md) if m != "Pause & ask"]
    if left:
        raise RenderError(f"marker left in the output: [[{left[0]}]]")
    return md, r


def main(argv=None):
    ap = argparse.ArgumentParser(description="Render a Grit & Grace chapter for one family as voice-engine Markdown.")
    ap.add_argument("source", help="chapter source JSON (prompt 1d)")
    ap.add_argument("--blocks", required=True, help="variant blocks JSON (prompt 1f)")
    ap.add_argument("--pictures", help="pictures JSON (prompt 1e)")
    ap.add_argument("--family", required=True, help="FAMILY JSON (prompts.md section 4)")
    ap.add_argument("--route", default="A", choices=["A", "B"], help="vote route to render (default A)")
    ap.add_argument("--season", type=int, help="season number (default: source, then family, then 1)")
    ap.add_argument("--turn", choices=list(CHILD_SLOTS), help="override the turn slot (default: the bible §5 rota by part)")
    ap.add_argument("-o", "--out", required=True, help="output Markdown path")
    a = ap.parse_args(argv)
    try:
        source = load_json(a.source, "chapter source")
        blocks = load_json(a.blocks, "blocks JSON")
        pictures = load_json(a.pictures, "pictures JSON") if a.pictures else None
        family = load_json(a.family, "family JSON")
        md, _ = render_markdown(source, blocks, pictures, family, route=a.route, season=a.season,
                                source_name=Path(a.source).name, turn=a.turn)
    except RenderError as e:
        print(f"render-chapter: ERROR: {e}", file=sys.stderr)
        return 2
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(md, encoding="utf-8")
    print(f"render-chapter: wrote {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
