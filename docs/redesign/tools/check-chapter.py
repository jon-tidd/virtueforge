#!/usr/bin/env python3
"""Plain code tests for one Grit & Grace chapter, at production.

Usage:
  check-chapter.py <source.json> [--blocks <blocks.json>] [--pictures <pictures.json>]
                   [--md <rendered.md>] [--family <family.json>] [--canon <canon.md>]
                   [--no-matrix] [--quiet]

Implements the production column of docs/redesign/story/prompts.md section 14 ("Plain
tests the app runs in code") and the bible's numeric Musts (bible §§2, 3): lengths
(900 to 1,100 words; 750 to 850 without the jar default in a jar chapter), sentence caps
(28 words; 15 in the picture-book telling), one speaker per paragraph where code can
tell, typography (no em dash, the "…" character), the picture-book telling (300 to 450
words over 8 to 12 pictures, every picture pinned, the youngest's act, the Pause & ask
and the comfort image each on one picture), the reading lines, rich words, the join-in
line, the Pause & ask block (position, lines, 20-word question, "Show me", no yes/no
prompts, the fixed grown-up line), the last page, the refrains spelled exactly, the
word lists (never-words, brands, slang, "little ones" and "kids" in narration, "blow
out"...), subject pronouns for children only inside blocks, names, and every marker
known. It also renders the chapter for a matrix of made-up families (1 to 4 children,
she/he/they, every grandparent and parents setup, both vote routes, every age band and
access need, shortest and longest names), so a missing block version, a slot a family
lacks, or a length that only breaks for some families is caught before review.

Tests the kit calls judgment (prompt 8) are not here. Hits on a "confirm" list, and
Should items, print WARN: they go to the checker or the reviewer and never fail.

Prints PASS / WARN / FAIL per test with the reason. Exit 1 on any FAIL, 2 on bad input.
Standard library only. It imports render-chapter.py (same folder) for markers and
rendering, so the two tools always agree.
"""
import argparse
import importlib.util
import itertools
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REDESIGN = HERE.parent
DEFAULT_FAMILY = REDESIGN / "story" / "sample-family.json"
DEFAULT_CANON = REDESIGN / "story" / "canon.md"

_spec = importlib.util.spec_from_file_location("render_chapter", HERE / "render-chapter.py")
rc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rc)

# ---------------------------------------------------------------------------
# Lists (prompts.md section 14, bible §§3 and 9). One place, so they can grow.

HARD_LISTS = {
    "Threat": ["teeth", "claws", "blood", "scream", "screamed", "chase", "chased"],
    "Death": ["died", "dead", "dying", "killed", "kill", "grave", "graves"],
    "Identity praise": ["good girl", "good boy", "brave girl", "brave boy", "so smart", "the bravest",
                        "a true hero", "such a kind boy", "such a kind girl", "what a good"],
    "Preaching": ["and so they learned", "learned that", "the lesson", "the moral", "remember, kids",
                  "it's important to", "always remember"],
    "Stereotypes": ["boys don't cry", "girls can't", "like a girl"],
    "Fire": ["blow out", "blew out", "blowing out", "blows out", "birthday candle"],
    "Strangers": ["don't tell", "do not tell", "our secret"],
    "Water": ["swim", "swam", "swimming", "under the water", "underwater"],
    "Unsafe acts": ["matches", "ate the berries", "picked berries and ate"],
    "Screens and machines": ["phone", "tablet", "screen", "TV", "television", "computer", "car", "truck",
                             "train", "electric", "battery"],
    "Slang": ["awesome", "literally", "OMG", "dude", "epic", "whatever"],
    "Weapons": ["sword", "spear", "gun", "bow and arrow"],
    # A starter set: prompts.md calls for a maintained list of brand, toy, film, TV, game
    # and character names. Grow it here.
    "Brands and media": ["Lego", "Barbie", "Disney", "Pixar", "Marvel", "Pokemon", "Pokémon", "Minecraft",
                         "Peppa", "Paw Patrol", "Bluey", "Elsa", "Frozen", "Spider-Man", "Spiderman",
                         "Batman", "Superman", "Star Wars", "Harry Potter", "Hogwarts", "Nintendo",
                         "Mario", "Sonic", "Fortnite", "Roblox", "YouTube", "iPad", "iPhone", "Netflix",
                         "McDonald's", "Coca-Cola", "Cheerios", "Play-Doh", "Hot Wheels", "Transformers",
                         "Thomas the Tank Engine", "Gruffalo", "Moana", "Encanto", "Minions",
                         "Teletubbies", "Sesame Street", "Elmo", "Dora", "Scooby-Doo", "Hello Kitty"],
    "Faith words in story text": ["God", "Lord", "Jesus", "Christ", "pray", "prayer", "Bible", "Scripture",
                                  "church", "amen"],
}
CONFIRM_LISTS = {
    "Death, confirm": ["ghost", "ghosts"],
    "Shaming, confirm": ["naughty", "baby", "stupid", "silly"],
    "Water, confirm": ["sank", "sinking"],
    "Unsafe acts, confirm": ["cord round", "string round", "rope round"],
    "Weapons, confirm": ["knife", "arrow"],
}
NARRATION_ONLY = {"Talking down (in narration)": ["little ones", "kids"]}
TOLKIEN_FALLBACK = ["Bree", "Bywater", "Hobbiton", "Buckland", "Michel Delving", "Rivendell", "Weathertop",
                    "Withywindle", "Brandywine", "Edoras", "Aldburg", "Dunharrow", "Harrowdale", "Westfold",
                    "Eastfold", "Westmarch", "Westernesse", "Upbourn", "Upbourne", "Snowbourn", "Snowbourne",
                    "Coldfell", "Coldfells", "Deeping", "Waymeet", "Staddle", "Archet", "Crickhollow",
                    "Frogmorton", "Overhill", "the Shire", "Entmoot", "Gaffer", "hobbit", "barrow"]
VERSE_REF_RE = re.compile(r"\b(?:[1-3] )?[A-Z][a-z]+ \d{1,3}:\d{1,3}\b")

REFRAINS = ["Lantern up!", "Not yet… keep going!", "Oops… up again!", "Hand on heart: I'll say what's true.",
            "Sleep low, stay warm, wake bright.", "Good evening. I'm so sorry to bother you.",
            "One, two, three, four, lots.", "The way on is yours.", "That's not mine to tell.",
            "…and the flame hopped across.", "Fire banked. Sleep low, stay warm, wake bright."]
CALM = rc.CALM_CLOSE
SPELLINGS = ["Keepers' Way", "Keepers' Lantern", "Keepers' Stones", "Moot Hall", "Beacon Night", "Beacon Feast"]
LOWERCASE_TERMS = ["lantern breath", "banking words", "longest night"]

CAST = ["Ember", "Hild", "Dun", "Reeve Osric", "Osric", "Cuthbert", "Wistan", "Edith", "Ebba", "Dame Blythe",
        "Blythe", "Aldwin", "Will", "Old Alric", "Alric", "Ned", "Old Brock", "Brock"]
PLACES = ["Candlemere", "Westering", "Moot Hall", "Swale", "Keepers' Way", "Keepers' Lantern", "Keepers' Stones",
          "Wardlow", "Carrying", "Beacon Night", "Beacon Feast", "Ashcombe", "Ramsden", "Honeybourne",
          "Blakefell", "Sedgefen", "Stepping Way", "Windley", "Thornholt", "Stanbury", "Oxley", "Goose-Wife"]
REVIEWED_WORDS = {"I", "I'm", "I'll", "I'd", "I've", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
                  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
                  "Brave", "Keep", "Going", "Bounce", "Back", "Truth-Teller", "Lantern", "Not", "Oops",
                  "Hand", "Sleep", "Fire", "Good", "One", "The", "That's", "Chapter", "Ch", "Show",
                  "Why", "What", "Where", "When", "How", "Who", "Tell", "Ask", "Yes", "No", "OK", "Okay"}
SAMPLE_NAMES = ["Hugh", "Alfie", "Clara", "Ruth"]
# The stand-in child name for scans and the stored one-child version. It must not be a
# word the reviewed text also uses as a common noun (see COMMON_NOUN_NAMES).
PLACEHOLDER = "Tamsin"
# Given names that are also everyday words. A family whose child has one of these names
# hears the word as the child wherever the text uses it ("A robin followed them").
# Grow the list; the test only warns, and the checker settles each hit.
COMMON_NOUN_NAMES = ["Robin", "Rose", "Hazel", "Holly", "Ivy", "Rowan", "Heather", "Daisy", "Poppy", "Violet",
                     "Iris", "Lily", "Willow", "Jasper", "Autumn", "Summer", "Sky", "Hunter", "Wren", "Lark",
                     "Ash", "Birch", "Reed", "Brook", "River", "Rain", "Hope", "Joy", "Star", "Bear", "Fox",
                     "Pearl", "Ruby", "Amber", "Coral", "Sage", "Dawn", "Stone", "Storm", "Forest"]
assert PLACEHOLDER not in COMMON_NOUN_NAMES
EVERYONE_RE = re.compile(r"\b(everyone|everybody)\b", re.I)
YESNO_START = {"is", "are", "was", "were", "do", "does", "did", "can", "could", "will", "would", "has", "have", "should"}
SUBJECT_PRONOUNS = re.compile(r"\b(he|she|they|he's|she's|they're|he'd|she'd|they'd|he'll|she'll|they'll|"
                              r"they've|himself|herself|themselves|themself)\b", re.I)
OBJ_POS_PRONOUNS = re.compile(r"\b(him|his|her|hers)\b", re.I)
SPEECH_VERBS = r"(?:said|asked|whispered|called|shouted|cried|replied|answered|laughed|sang|yelled|murmured|added)"
SAY_AFTER = re.compile(SPEECH_VERBS + r"\s+(the\s+[a-z]+(?:-[a-z]+)?|[A-Z][\w'’]*(?:\s+[A-Z][\w'’]*)?)")
SAY_BEFORE = re.compile(r"(?<![\w'’])(the\s+[a-z]+(?:-[a-z]+)?|[A-Z][\w'’]*(?:\s+[A-Z][\w'’]*)?|he|she|they|I|we)\s+"
                        + SPEECH_VERBS + r"\b")
SPEAKER_ALIASES = {"the fox": "ember"}


# ---------------------------------------------------------------------------
# Text helpers

def plain(md):
    s = re.sub(r"(\*\*|__)(.+?)\1", r"\2", md or "")
    s = re.sub(r"(?<![\w*])\*(\S(?:.*?\S)?)\*(?![\w*])", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def words(text):
    return [w for w in plain(text).split() if re.search(r"[A-Za-z0-9]", w)]


def wc(text):
    return len(words(text))


SENT_END = re.compile(r"([.!?…][\"”’')\]*]*)(\s+)(?=[\"“‘'(*]*[A-Z0-9\[])")


def sentences(text):
    t = plain(text)
    out, start = [], 0
    for m in SENT_END.finditer(t):
        out.append(t[start:m.end(1)].strip())
        start = m.end()
    tail = t[start:].strip()
    if tail:
        out.append(tail)
    return [s for s in out if s]


def strip_quotes(text):
    """Narration only: drop everything inside double quotes."""
    return re.sub(r"[\"“][^\"”]*[\"”]", " ", text or "")


def neutral(text):
    """Markers replaced by neutral stand-ins, for scanning a block version on its own."""
    def sub(m):
        kind, arg = rc.parse_marker(m.group(1))
        if kind == "child":
            return PLACEHOLDER
        if kind == "pro":
            return {"obj": "them", "pos": "their"}[arg[1]]
        if kind == "gp":
            return "a grown-up who loves you" if arg == "real" else "Gran"
        if kind == "parents":
            return "Mom and Dad"
        if kind == "cast":
            return arg
        return " "
    return rc.tidy(rc.MARKER_RE.sub(sub, text or ""))


def phrase_re(phrase, case=False):
    body = r"\s+".join(re.escape(w) for w in phrase.split())
    return re.compile(r"(?<![\w'’-])" + body + r"(?![\w'’-])", 0 if case else re.I)


# Proper names are matched with their capitals, so "frozen" or "stock" in a sentence never
# trips the brand or Tolkien lists.
CASE_SENSITIVE_LISTS = {"Brands and media"}


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", plain(s).lower().replace("’", "'")).strip()


# ---------------------------------------------------------------------------
# Results

class Report:
    def __init__(self, quiet=False):
        self.rows = []
        self.quiet = quiet

    def add(self, name, status, reason):
        self.rows.append((name, status, reason))

    def ok(self, name, reason):
        self.add(name, "PASS", reason)

    def fail(self, name, reason):
        self.add(name, "FAIL", reason)

    def warn(self, name, reason):
        self.add(name, "WARN", reason)

    def check(self, name, problems, ok_reason, warn=False):
        if problems:
            shown = "; ".join(problems[:6]) + (f"; and {len(problems) - 6} more" if len(problems) > 6 else "")
            (self.warn if warn else self.fail)(name, shown)
        else:
            self.ok(name, ok_reason)

    def print(self):
        for name, status, reason in self.rows:
            if self.quiet and status == "PASS":
                continue
            print(f"{status:<5} {name}: {reason}")
        n = {s: sum(1 for r in self.rows if r[1] == s) for s in ("PASS", "WARN", "FAIL")}
        print(f"\n{n['PASS']} PASS, {n['WARN']} WARN, {n['FAIL']} FAIL")
        return n["FAIL"]


# ---------------------------------------------------------------------------
# Canon

def canon_rows(canon_path):
    rows = {}
    try:
        text = Path(canon_path).read_text(encoding="utf-8")
    except OSError:
        return rows, TOLKIEN_FALLBACK
    sec = text.split("### All 60 chapters", 1)[-1].split("### The twelve votes", 1)[0]
    for line in sec.splitlines():
        m = re.match(r"^\|\s*(\d+)\s*\|", line)
        if not m:
            continue
        parts = [p.strip() for p in line.strip().split("|")]
        if len(parts) < 10:
            continue
        rows[int(m.group(1))] = {
            "day": parts[2], "title": re.sub(r"\*\*(.+?)\*\*", r"\1", parts[3]).strip(),
            "lead": parts[-5], "echo": parts[-4], "tag": parts[-3], "marks": parts[-2],
        }
    tol = TOLKIEN_FALLBACK
    m = re.search(r"Tolkien names and near-copies:(.+)", text)
    if m:
        found = re.findall(r"([A-Z][\w' ]+?|\"[^\"]+\"|the Shire|hobbit|barrow)(?:\(e\)|\(s\))?(?:,|\.|$| \()", m.group(1))
        names = []
        for f in found:
            f = f.strip().strip('"')
            if f and len(f) > 2 and not f.startswith(("or ", "any ")):
                names.append(f)
        if len(names) >= 10:
            tol = sorted(set(names) | {"Upbourne", "Snowbourne", "Coldfells", "hobbit", "barrow"})
    return rows, tol


def canon_sample_page(canon_path):
    """Chapter 1's free sample text from canon §8: (story sentences, the Pause & ask question)."""
    try:
        text = Path(canon_path).read_text(encoding="utf-8")
    except OSError:
        return [], None
    sec = text.split("### Chapter 1 and the free sample chapter", 1)[-1].split("\n### ", 1)[0]
    body = sec.split("**First sentences:**", 1)[-1].split("- **Tomorrow:**", 1)[0]
    story, question = [], None
    for line in body.splitlines():
        line = line.strip()
        if not line.startswith(">"):
            continue
        line = line.lstrip("> ").strip()
        if not line:
            continue
        m = re.match(r"\*\*Pause & ask:\*\*\s*(.+)", line)
        if m:
            question = plain(m.group(1)).strip('"“”')
            continue
        story += sentences(line)
    return story, question


LEAD_NAMES = {"Hugh": "eldest", "Alfie": "middle", "Clara": "youngest", "All three": "all"}


# ---------------------------------------------------------------------------
# Test families (made up; never the sample family's names)

SHORT = {"eldest": "Bo", "middle": "Cy", "middle2": "Di", "youngest": "Ed"}
LONG = {"eldest": "Anna Maria Rose", "middle": "Jean Paul Henry", "middle2": "Mary Kate Lynn",
        "youngest": "Lily Grace Ann"}
BAND_OF = {"eldest": "7-9", "middle": "5-6", "middle2": "5-6", "youngest": "3-4"}
SIZE_SLOTS = {1: ["eldest"], 2: ["eldest", "youngest"], 3: ["eldest", "middle", "youngest"],
              4: ["eldest", "middle", "middle2", "youngest"]}


def make_family(size, pronoun, gp, parents, long_names=False, bands=None, access=None, look=None):
    names = LONG if long_names else SHORT
    kids = []
    for s in SIZE_SLOTS[size]:
        lk = {"hair": "curls", "glasses": s == "middle", "freckles": s == "eldest", "clothes": "hooded cloak",
              "extras": [], "mobility": None, "hearing": None, "communication": None, "vision": None}
        if look:
            lk.update(look)
        if access and access[0] == s:
            kind = access[1]
            if kind == "wheelchair":
                lk["mobility"] = "wheelchair"
            elif kind == "hearing":
                lk["hearing"] = "hearing aids"
            elif kind == "low_vision":
                lk["vision"] = "low"
            elif kind == "signs":
                lk["communication"] = "signs"
            elif kind == "talker":
                lk["communication"] = "talker"
        band = (bands or {}).get(s) or ("7-9" if size == 1 else BAND_OF[s])
        kids.append({"slot": s, "name": names[s], "nickname": None, "age": 6, "band": band, "rung": "Middle",
                     "pronoun": pronoun, "telling": "chapter", "look": lk, "favorites": {}})
    gp_setup, gp_pro = gp
    gname = "Joe Bob" if long_names else "Joe"
    if gp_setup == "one":
        called = {"she": "Nana", "he": "Grandpa", "they": "Gran"}[gp_pro]
        g = {"setup": "one", "people": [{"called": called, "name": gname, "pronoun": gp_pro}],
             "story_called": called, "story_name": f"{called} {gname}"}
    elif gp_setup == "two":
        g = {"setup": "two", "people": [{"called": "Nana", "name": None, "pronoun": "she"},
                                        {"called": "Pop", "name": None, "pronoun": "he"}],
             "story_called": None, "story_name": None}
    elif gp_setup == "nan":
        g = {"setup": "nan", "people": [], "story_called": "Nan", "story_name": "Nan"}
    else:
        g = {"setup": "remembered", "people": [{"called": "Grandpa", "name": None, "pronoun": "he"}],
             "story_called": "Nan", "story_name": "Nan"}
    p_setup, p_pro = parents
    p = {"setup": p_setup, "called": {"two": "Mom and Dad", "one": "Mama", "none_set": None}[p_setup],
         "pronoun": p_pro if p_setup == "one" else None}
    return {"family_id": "fam_test", "children": kids, "grandparent": g, "parents": p, "pet": None,
            "faith_on": False, "house_translation": None, "cast_alternates": {}, "place_in_season": {"season": 1}}


GP_SETUPS = [("one", "she"), ("one", "he"), ("one", "they"), ("two", None), ("nan", None), ("remembered", None)]
PARENT_SETUPS = [("two", None), ("one", "she"), ("one", "he"), ("one", "they"), ("none_set", None)]


def matrix_families(has_route):
    routes = ["A", "B"] if has_route else ["A"]
    for size, pro, gp, par, route in itertools.product([1, 2, 3, 4], ["she", "he", "they"], GP_SETUPS,
                                                       PARENT_SETUPS, routes):
        for long_names in (False, True):
            yield (f"{size} child(ren), {pro}, gp {gp[0]}{'/' + gp[1] if gp[1] else ''}, parents {par[0]}"
                   f"{'/' + par[1] if par[1] else ''}, route {route}{', long names' if long_names else ''}",
                   make_family(size, pro, gp, par, long_names), route)
    for size in (1, 2, 3, 4):
        for s in SIZE_SLOTS[size]:
            for band in rc.BANDS:
                yield (f"{size} child(ren), {s} in band {band}",
                       make_family(size, "she", ("one", "she"), ("two", None), bands={s: band}), "A")
            for kind in rc.ACCESS_KINDS:
                yield (f"{size} child(ren), {s} with {kind}",
                       make_family(size, "they", ("one", "she"), ("two", None), access=(s, kind)), "A")


# ---------------------------------------------------------------------------
# Marker walk (static): every marker known, and slot markers only where the slot exists

def walk_markers(text, blocks, looks, sizes, where, found, problems, seen_blocks, ctx="story", depth=0):
    if depth > 12:
        problems["nest"].append(f"{where}: blocks nest more than 12 deep")
        return
    for m in rc.MARKER_RE.finditer(text or ""):
        inner = m.group(1)
        try:
            kind, arg = rc.parse_marker(inner)
        except rc.RenderError as e:
            problems["unknown"].append(f"{where}: {e}")
            continue
        found.append((kind, arg, where))
        slot = None
        if kind == "child" and arg in rc.CHILD_SLOTS:
            slot = arg
        elif kind in ("pro", "look") and arg[0] in rc.CHILD_SLOTS:
            slot = arg[0]
        if slot and not (ctx != "story" and slot in ("eldest", "youngest")):
            need = {"eldest": {1, 2, 3, 4}, "youngest": {2, 3, 4}, "middle": {3, 4}, "middle2": {4}}[slot]
            bad = sorted(set(sizes) - need)
            if bad:
                problems["size"].append(f"{where}: [[{inner}]] reached in a family of {', '.join(map(str, bad))}"
                                        " (put it inside a family-size block)")
        if kind == "block":
            b = blocks.get(arg)
            if b is None:
                problems["missing"].append(f"{where}: missing block [[block:{arg}]]")
                continue
            seen_blocks.add(arg)
            axis = b["varies_by"].split(":")[0]
            for key, ver in b["versions"].items():
                vs = sizes
                if axis == "family_size":
                    try:
                        vs = [int(key)] if int(key) in sizes else []
                    except ValueError:
                        problems["unknown"].append(f"block {arg}: family-size version {key!r} is not 1 to 4")
                        continue
                    if not vs:
                        continue
                walk_markers(ver, blocks, looks, vs, f"{arg}[{key}]", found, problems, seen_blocks, ctx, depth + 1)
        elif kind == "look":
            lk = looks.get(arg[1])
            if lk is None:
                problems["missing"].append(f"{where}: missing look [[look:{arg[0]}|{arg[1]}]]")
                continue
            seen_blocks.add("look:" + arg[1])
            if "none" not in lk["options"]:
                problems["missing"].append(f"look {arg[1]} has no \"none\" option")
            for key, opt in lk["options"].items():
                walk_markers(opt, blocks, looks, sizes, f"{arg[1]}[{key}]", found, problems, seen_blocks, ctx, depth + 1)


# ---------------------------------------------------------------------------
# The checks

def all_texts(source, pictures):
    """(where, text, ctx) for every story or reader-facing string in the source and pictures."""
    out = []
    ob = source.get("opening_block") or {}
    for k in ("legend", "gp_reply", "last_time"):
        if ob.get(k):
            out.append((f"opening_block.{k}", ob[k], "story"))
    for p in source.get("paragraphs") or []:
        out.append((p.get("id", "?"), p.get("text", ""), "story"))
    pa = source.get("pause_and_ask") or {}
    for k in ("in_the_story", "question", "stretch", "for_the_grown_up"):
        if pa.get(k):
            out.append((f"pause_and_ask.{k}", pa[k], "pause"))
    for i, x in enumerate(pa.get("if_stuck") or []):
        out.append((f"pause_and_ask.if_stuck[{i}]", x, "pause"))
    for k, v in (pa.get("for_the_youngest") or {}).items():
        if v:
            out.append((f"pause_and_ask.for_the_youngest.{k}", v, "pause"))
    lp = source.get("last_page") or {}
    for k in ("why_question", "what_happened", "calm_close", "next_time"):
        if lp.get(k):
            out.append((f"last_page.{k}", lp[k], "lastpage"))
    fm = lp.get("for_the_morning") or {}
    for k, v in (fm.get("missions") or {}).items():
        out.append((f"last_page.missions.{k}", v, "real"))
    if fm.get("tell_it_back"):
        out.append(("last_page.tell_it_back", fm["tell_it_back"], "real"))
    v = source.get("vote") or {}
    if v.get("setup"):
        out.append(("vote.setup", v["setup"], "story"))
    for o in v.get("options") or []:
        for k in ("title", "line", "button"):
            if o.get(k):
                out.append((f"vote.{o.get('key')}.{k}", o[k], "story"))
    rw = source.get("remember_when") or {}
    for k in ("text", "ask", "hint"):
        if rw.get(k):
            out.append((f"remember_when.{k}", rw[k], "story" if k == "text" else "pause"))
    for k in ("plan_reminder", "letter_home"):
        vv = source.get(k)
        if vv:
            out.append((k, vv.get("text") if isinstance(vv, dict) else vv, "story"))
    for d in source.get("tier_c_defaults") or []:
        try:
            out.append((f"default {d.get('id')}", rc.default_text(d), "story"))
        except rc.RenderError:
            pass
    rl = source.get("reading_lines") or {}
    if (rl.get("your_line") or {}).get("text"):
        out.append(("reading_lines.your_line", rl["your_line"]["text"], "story"))
    if (source.get("join_in") or {}).get("line"):
        out.append(("join_in", source["join_in"]["line"], "story"))
    for pic in (pictures or {}).get("pictures") or []:
        out.append((f"picture {pic.get('n')}", pic.get("text", ""), "story"))
    pas = (pictures or {}).get("pause_and_ask_simple") or {}
    if pas.get("question"):
        out.append(("pause_and_ask_simple.question", pas["question"], "pause"))
    for k, v2 in (pas.get("for_the_youngest") or {}).items():
        if v2:
            out.append((f"pause_and_ask_simple.for_the_youngest.{k}", v2, "pause"))
    return out


def rc_sections(md):
    body = re.sub(r"^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?", "", md, count=1)
    body = re.sub(r"<!--[\s\S]*?-->", "", body)
    out, order = {}, []
    for part in re.split(r"^##\s+", body, flags=re.M)[1:]:
        nl = part.find("\n")
        head = (part if nl == -1 else part[:nl]).strip()
        out[head.lower()] = "" if nl == -1 else part[nl + 1:].strip()
        order.append(head)
    return out, order


def paragraphs_of(section):
    return [b.strip() for b in re.split(r"\n\s*\n", section or "") if b.strip()]


def render_all(source, blocks, pictures, family, route="A", tierc_text=None):
    md, r = rc.render_markdown(source, blocks, pictures, family, route=route, tierc_text=tierc_text)
    r.looks_placed = [x for x in r.used_looks if x[1] != "none"]
    items = rc.render_telling(rc.Renderer(source, blocks, family, route=route, tierc_text=tierc_text), source)
    return md, r, items


def chapter_words(items):
    return sum(wc(t) for _, t in items)


def jar_paragraph_ids(source):
    return [p.get("id") for p in source.get("paragraphs") or [] if "[[tierc:jar|" in (p.get("text") or "")]


def filler(n):
    return " ".join(["word"] * n)


def run(args):
    rep = Report(args.quiet)
    try:
        source = rc.load_json(args.source, "chapter source")
        blocks_json = rc.load_json(args.blocks, "blocks JSON") if args.blocks else {"blocks": [], "looks": []}
        pictures = rc.load_json(args.pictures, "pictures JSON") if args.pictures else None
        family = rc.load_json(args.family, "family JSON")
        blocks, looks = rc.index_blocks(blocks_json)
    except rc.RenderError as e:
        print(f"check-chapter: ERROR: {e}", file=sys.stderr)
        return 2
    rows, tolkien = canon_rows(args.canon)
    ch = source.get("chapter")
    print(f"check-chapter: chapter {ch} \"{source.get('title', '?')}\" ({Path(args.source).name}"
          f"{', ' + Path(args.blocks).name if args.blocks else ''}{', ' + Path(args.pictures).name if args.pictures else ''}"
          f"{', ' + Path(args.md).name if args.md else ''})\n")

    # -- schema
    need = ["status", "chapter", "part", "day", "title", "lead", "tag", "paragraphs", "pause_and_ask", "last_page",
            "reading_lines", "rich_words", "join_in", "key_act", "laugh", "opening_block"]
    missing = [k for k in need if k not in source]
    ids = [p.get("id") for p in source.get("paragraphs") or []]
    probs = [f"missing field {k!r}" for k in missing]
    if source.get("status") != "ok":
        probs.append(f"status is {source.get('status')!r}")
    if len(set(ids)) != len(ids) or not all(ids):
        probs.append("paragraph ids are missing or repeated")
    rep.check("schema", probs, f"CHAPTER_SCHEMA fields present, {len(ids)} paragraphs")
    if missing and any(k in missing for k in ("paragraphs", "pause_and_ask", "last_page")):
        return rep.print() and 1
    has_jar = bool(jar_paragraph_ids(source))
    is_ch1 = ch == 1

    # -- canon row (checklist items 1 and 2)
    row = rows.get(ch)
    if not row:
        rep.warn("canon.row", f"no Season 1 canon row for chapter {ch}; title, day, lead and tag not compared")
    else:
        probs = []
        if source.get("title") != row["title"]:
            probs.append(f"title {source.get('title')!r} != canon {row['title']!r}")
        if source.get("day") != row["day"]:
            probs.append(f"day {source.get('day')!r} != canon {row['day']!r}")
        want_lead = LEAD_NAMES.get(row["lead"], row["lead"])
        if source.get("lead") != want_lead:
            probs.append(f"lead {source.get('lead')!r} != canon {want_lead!r} ({row['lead']})")
        if source.get("tag") != row["tag"]:
            probs.append(f"tag {source.get('tag')!r} != canon {row['tag']!r} (character for character)")
        rep.check("canon.row", probs, f"title, day, lead ({row['lead']}) and tag match canon")

    # -- markers
    found, seen = [], set()
    problems = {"unknown": [], "missing": [], "size": [], "nest": []}
    for where, text, ctx in all_texts(source, pictures):
        walk_markers(text, blocks, looks, [1, 2, 3, 4], where, found, problems, seen, ctx)
    defaults = rc.index_defaults(source)
    for kind, arg, where in found:
        if kind == "tierc" and arg[1] != "none" and arg[1] not in defaults:
            problems["missing"].append(f"{where}: no reviewed default {arg[1]!r} for [[tierc:{arg[0]}|default:{arg[1]}]]")
        if kind == "cast":
            allowed = set(CAST) | set(source.get("allowed_names") or []) | set(n.get("name") if isinstance(n, dict) else n for n in source.get("new_names") or [])
            if arg not in allowed:
                problems["unknown"].append(f"{where}: [[cast:{arg}]] is not a canon cast name")
    rep.check("markers.known", problems["unknown"] + problems["missing"] + problems["nest"],
              f"{len(found)} markers, every one defined by the kit, every block, look and default present")
    rep.check("markers.family_size", problems["size"],
              "every middle, middle2 and youngest marker in story text sits inside a family-size version that has that slot")
    unused = sorted(b for b in blocks if b not in seen) + sorted(l for l in looks if "look:" + l not in seen)
    if unused:
        rep.warn("markers.unused", "blocks or looks never referenced: " + ", ".join(unused))
    ob = source.get("opening_block") or {}
    if (ob.get("legend") or "").strip() and not (ob.get("legend") or "").startswith("[[tierc:legend|"):
        rep.fail("markers.legend_slot", "opening_block.legend is not a [[tierc:legend|default:…]] slot")

    # -- render for the sample family (both routes when the chapter has route blocks)
    route_blocks = [b for b, v in blocks.items() if v["varies_by"].split(":")[0] in ("route", "vote", "vote_route")]
    renders = {}
    for route in (["A", "B"] if route_blocks else ["A"]):
        try:
            tt = {"jar": None} if has_jar else None
            md, r, items = render_all(source, blocks_json, pictures, family, route)
            renders[route] = (md, r, items)
            if has_jar:
                renders[route + "-nojar"] = render_all(source, blocks_json, pictures, family, route, tt)
        except rc.RenderError as e:
            rep.fail(f"render.sample.route{route}", str(e))
    if "A" not in renders:
        return rep.print() and 1
    rep.ok("render.sample", f"renders for {family.get('family_id')} on route" + ("s A and B" if route_blocks else " A")
           + ", no marker left")
    md_a, r_a, items_a = renders["A"]
    sections_a, _ = rc_sections(md_a)

    # -- canon text, word for word, as the sample family hears it
    told = re.sub(r"\s+", " ", " ".join(plain(t) for _, t in items_a))
    everything = told + " " + re.sub(r"\s+", " ", plain(md_a))
    probs = []
    for cq in source.get("canon_quoted") or []:
        if re.sub(r"\s+", " ", plain(cq)).strip() not in everything:
            probs.append(f"canon_quoted passage not found word for word: \"{plain(cq)[:60]}…\"")
    if is_ch1:
        page, canon_q = canon_sample_page(args.canon)
        for sent in page:
            if sent not in told:
                probs.append(f"canon §8 sentence missing or changed: \"{sent}\"")
        if canon_q:
            q_now = plain(r_a.fill((source.get("pause_and_ask") or {}).get("question") or "", "pause"))
            if q_now.strip('"“”') != canon_q:
                probs.append(f"the Pause & ask question isn't canon §8's: \"{canon_q}\"")
        rep.check("canon.text", probs, f"canon §8's Chapter 1 sample page ({len(page)} sentences) and its Pause & ask "
                  "question are word for word in the sample family's telling")
    else:
        rep.check("canon.text", probs, f"{len(source.get('canon_quoted') or [])} canon_quoted passage(s) found word for word")

    # -- the matrix
    matrix_stats = {"cb": [], "pb": [], "open": [], "fails": {}, "long_sent": [], "names": [], "n": 0,
                    "figures": {}, "ending": {}}
    ending_unit = list(source.get("last_paragraph_unit") or ids[-1:])
    if not args.no_matrix:
        for label, fam, route in matrix_families(bool(route_blocks)):
            matrix_stats["n"] += 1
            try:
                tt = {"jar": None} if has_jar else None
                md, r, items = render_all(source, blocks_json, pictures, fam, route, tt)
            except rc.RenderError as e:
                matrix_stats["fails"].setdefault(str(e), []).append(label)
                continue
            cbw = chapter_words(items)
            matrix_stats["cb"].append((cbw, label))
            matrix_stats["open"].append((sum(wc(t) for i, t in items if i.startswith("open.")), label))
            secs, _ = rc_sections(md)
            if pictures:
                matrix_stats["pb"].append((wc(secs.get("picture-book telling", "")), label))
            for pid, t in items:
                for s in sentences(t):
                    if wc(s) > 28:
                        matrix_stats["long_sent"].append(f"{pid} ({label}): {wc(s)} words")
            names = [rc.child_name(c) for c in fam["children"]]
            for pid, t in items:
                matrix_stats["names"] += name_repetition(pid, t, names, label)
            if pictures:
                for msg, lab in picture_figure_problems(pictures, r, label):
                    matrix_stats["figures"].setdefault(msg, []).append(lab)
            missing = ending_names(items, ending_unit, names)
            if missing:
                matrix_stats["ending"].setdefault(f"leaves out {len(missing)} of {len(names)} children", []).append(label)
        fails = [f"{msg} [{len(labels)} famil{'y' if len(labels) == 1 else 'ies'}, e.g. {labels[0]}]"
                 for msg, labels in matrix_stats["fails"].items()]
        rep.check("variants.coverage", fails,
                  f"{matrix_stats['n']} made-up families render (1 to 4 children, she/he/they, every grandparent and "
                  "parents setup, every band and access need, short and long names)")
    else:
        rep.warn("variants.coverage", "skipped (--no-matrix)")

    # -- lengths: chapter-book telling
    lo, hi = (750, 850) if has_jar else (900, 1100)
    label = " without the jar default" if has_jar else ""
    base_items = renders["A-nojar"][2] if has_jar else items_a
    sample_words = chapter_words(base_items)
    probs = []
    if not lo <= sample_words <= hi:
        probs.append(f"{sample_words} words for the sample family{label}; want {lo:,} to {hi:,}")
    if matrix_stats["cb"]:
        mn, mx = min(matrix_stats["cb"]), max(matrix_stats["cb"])
        if mn[0] < lo:
            probs.append(f"shortest version {mn[0]} words ({mn[1]})")
        if mx[0] > hi:
            probs.append(f"longest version {mx[0]} words ({mx[1]})")
        rng = f"; every version {mn[0]} to {mx[0]}"
    else:
        rng = ""
    rep.check("length.chapter_book", probs, f"{sample_words} words{label} for the sample family{rng}; want {lo:,} to {hi:,}")
    if has_jar:
        full = chapter_words(items_a)
        rep.check("length.chapter_book_with_jar", [] if 900 <= full <= 1100 else [f"{full} words with the jar default"],
                  f"{full} words with the jar default in; want 900 to 1,100")

    # -- sentences
    long_s = []
    for route, (md, r, items) in ((k, v) for k, v in renders.items() if not k.endswith("nojar")):
        for pid, t in items:
            for s in sentences(t):
                if wc(s) > 28:
                    long_s.append(f"{pid}: {wc(s)} words: \"{s[:60]}…\"")
    for bid, b in blocks.items():
        for key, ver in b["versions"].items():
            for s in sentences(neutral(ver)):
                if wc(s) > 28:
                    long_s.append(f"block {bid}[{key}]: {wc(s)} words")
    agg = {}
    for x in matrix_stats["long_sent"]:
        m = re.match(r"(\S+) \((.*)\): (\d+) words", x)
        pid, fam_label, n = m.group(1), m.group(2), int(m.group(3))
        cur = agg.setdefault(pid, [0, 0, fam_label])
        cur[1] += 1
        if n > cur[0]:
            cur[0], cur[2] = n, fam_label
    long_s += [f"{pid}: up to {n} words in {k} made-up families (e.g. {lab})" for pid, (n, k, lab) in agg.items()]
    rep.check("sentences.chapter_book", sorted(set(long_s)), "no sentence over 28 words, in any version")
    all_s = [s for _, t in items_a for s in sentences(t)]
    if all_s:
        avg = sum(wc(s) for s in all_s) / len(all_s)
        (rep.ok if 9 <= avg <= 14 else rep.warn)("sentences.average", f"average {avg:.1f} words a sentence; Should be 9 to 14")
    over4 = [pid for pid, t in items_a if len(sentences(t)) > 4]
    if over4:
        rep.warn("paragraphs.four_sentences", "over four sentences (Should): " + ", ".join(over4))

    # -- one speaker per paragraph
    two, maybe = [], []
    for pid, t in items_a:
        named, pron = speakers(t)
        if len(named) >= 2:
            two.append(f"{pid}: {', '.join(sorted(named))}")
        elif named and pron:
            maybe.append(f"{pid}: {', '.join(sorted(named))} + \"{'/'.join(sorted(pron))}\"")
        elif len(pron) >= 2:
            maybe.append(f"{pid}: {'/'.join(sorted(pron))}")
    rep.check("one_speaker", two, "no paragraph has two named speakers")
    if maybe:
        rep.warn("one_speaker.confirm", "a pronoun speaker next to another speaker; the checker confirms: " + "; ".join(maybe))
    if pictures:
        pic_two = []
        for pic in pictures.get("pictures") or []:
            named, pron = speakers(r_a.fill(pic.get("text", ""), "story", "picture"))
            if len(named | pron) >= 2:
                pic_two.append(f"picture {pic.get('n')}")
        if pic_two:
            rep.warn("one_speaker.pictures", "more than one speaker in (Should): " + ", ".join(pic_two))

    # -- typography
    probs = []
    raw_all = [(w, t) for w, t, _ in all_texts(source, pictures)]
    raw_all += [(f"block {bid}[{k}]", v) for bid, b in blocks.items() for k, v in b["versions"].items()]
    raw_all += [(f"look {lid}[{k}]", v) for lid, lk in looks.items() for k, v in lk["options"].items()]
    for where, t in raw_all:
        if "—" in (t or ""):
            probs.append(f"{where}: em dash")
        if "..." in (t or ""):
            probs.append(f"{where}: \"...\" (use the single character \"…\")")
    nt = (source.get("last_page") or {}).get("next_time") or ""
    if re.search(r"tomorrow", nt, re.I):
        probs.append("last_page.next_time says \"tomorrow\"")
    rep.check("typography", probs, "no em dash, the ellipsis is \"…\", no \"tomorrow\" in Next time")

    # -- picture-book telling
    if not pictures:
        rep.fail("pictures", "no pictures JSON given (prompt 1e); every picture must be pinned")
    else:
        pics = pictures.get("pictures") or []
        pb_text = sections_a.get("picture-book telling", "")
        pbw = wc(pb_text)
        probs = []
        if not 300 <= pbw <= 450:
            probs.append(f"{pbw} words for the sample family; want 300 to 450")
        if matrix_stats["pb"]:
            mn, mx = min(matrix_stats["pb"]), max(matrix_stats["pb"])
            if mn[0] < 300:
                probs.append(f"shortest version {mn[0]} words ({mn[1]})")
            if mx[0] > 450:
                probs.append(f"longest version {mx[0]} words ({mx[1]})")
        if not 8 <= len(pics) <= 12:
            probs.append(f"{len(pics)} pictures; want 8 to 12")
        rep.check("picture_book.length", probs, f"{pbw} words over {len(pics)} pictures")
        long_p = []
        for pic in pics:
            t = r_a.fill(pic.get("text", ""), "story", "picture")
            for s in sentences(t):
                if wc(s) > 15:
                    long_p.append(f"picture {pic.get('n')}: {wc(s)} words")
            n_s = len(sentences(t))
            if n_s > 4:
                long_p.append(f"picture {pic.get('n')}: {n_s} sentences")
        rep.check("picture_book.sentences", long_p, "no sentence over 15 words")
        jar_ids = set()
        for d in source.get("tier_c_defaults") or []:
            if d.get("slot") == "jar":
                jar_ids |= {p.get("id") for p in d.get("paragraphs") or []}
        probs = []
        for pic in pics:
            pin = pic.get("pinned_to")
            if pin not in ids and pin not in jar_ids:
                probs.append(f"picture {pic.get('n')} pinned to {pin!r}, not a paragraph")
            if pin in jar_ids and "jar" not in (pic.get("roles") or []):
                probs.append(f"picture {pic.get('n')} is a jar-default picture without the role \"jar\"")
        nums = [p.get("n") for p in pics]
        if nums != list(range(1, len(pics) + 1)):
            probs.append(f"pictures are numbered {nums}, not 1 to {len(pics)}")
        rep.check("picture_book.pinned", probs, "every picture pinned to an existing paragraph")
        probs = []
        for role in ("youngest_act", "pause_and_ask", "comfort_final"):
            with_role = [p.get("n") for p in pics if role in (p.get("roles") or [])]
            if len(with_role) != 1:
                probs.append(f"{role} on {len(with_role)} pictures {with_role}; want exactly one")
        if pics and "comfort_final" not in (pics[-1].get("roles") or []):
            probs.append("the last picture is not comfort_final")
        ka = source.get("key_act") or {}
        ya = [p for p in pics if "youngest_act" in (p.get("roles") or [])]
        if ya and ka.get("slot") == "youngest" and ya[0].get("pinned_to") != ka.get("paragraph"):
            probs.append(f"the youngest_act picture is pinned to {ya[0].get('pinned_to')}, but the key act is in {ka.get('paragraph')}")
        pap = [p for p in pics if "pause_and_ask" in (p.get("roles") or [])]
        pas = pictures.get("pause_and_ask_simple") or {}
        if pap and pas.get("picture") != pap[0].get("n"):
            probs.append(f"pause_and_ask_simple.picture is {pas.get('picture')}, the pause_and_ask picture is {pap[0].get('n')}")
        if not (pas.get("question") and (pas.get("for_the_youngest") or {}).get("talk")):
            probs.append("pause_and_ask_simple needs a question and a talk prompt for the youngest")
        rep.check("picture_book.roles", probs,
                  "the youngest's act, the Pause & ask and the comfort image (last) each on exactly one picture")
        if pap and pap[0].get("pinned_to") != source["pause_and_ask"].get("after_paragraph"):
            rep.warn("picture_book.pause_pin", f"the pause_and_ask picture is pinned to {pap[0].get('pinned_to')}, "
                     f"the Pause & ask sits after {source['pause_and_ask'].get('after_paragraph')}")
        if ka.get("slot") and ka.get("slot") != "youngest":
            rep.warn("picture_book.youngest_act", f"the key act is the {ka.get('slot')}'s; code can't find the "
                     "youngest's own act paragraph, so the checker confirms the youngest_act picture's pin")
        first = pics[0].get("text", "") if pics else ""
        if pics and not first.startswith("[[tierc:legend|"):
            rep.fail("picture_book.legend_slot", "the first picture's text doesn't start with [[tierc:legend|default:none]]")
        def img_words(img):
            """The longest description any family's image prompt gets: the shared fields plus
            one family size's figure list."""
            if not isinstance(img, dict):
                return wc(str(img or ""))
            base = {k: v for k, v in img.items() if k not in ("figures", "figures_by_size")}
            lists = [img.get("figures") or []] + list((img.get("figures_by_size") or {}).values())
            return max(wc(" ".join(str(v) for v in flatten({**base, "figures": fl}))) for fl in lists)
        long_img = [f"picture {p.get('n')}: {img_words(p.get('image'))} words" for p in pics if img_words(p.get("image")) > 80]
        if long_img:
            rep.warn("picture_book.image_length", "image descriptions over 80 words: " + ", ".join(long_img))
        if pictures.get("rich_word"):
            n_rw = len(phrase_re(pictures["rich_word"]).findall(plain(pb_text)))
            if n_rw < 2:
                rep.warn("picture_book.rich_word", f"\"{pictures['rich_word']}\" said {n_rw} time(s) (Should: twice)")

    # -- opening block and first problem
    ob_items = [(i, t) for i, t in base_items if i.startswith("open.")]
    ob_words = sum(wc(t) for _, t in ob_items)
    probs = []
    if ob_words > 120:
        probs.append(f"{ob_words} words for the sample family")
    if matrix_stats["open"] and max(matrix_stats["open"])[0] > 120:
        probs.append(f"{max(matrix_stats['open'])[0]} words ({max(matrix_stats['open'])[1]})")
    ob_keys = [k for k in (source.get("opening_block") or {}) if k in ("legend", "gp_reply", "last_time")]
    if ob_keys != [k for k in ("legend", "gp_reply", "last_time") if k in ob_keys]:
        probs.append(f"order is {ob_keys}; want legend, gp_reply, last_time")
    lt = (source.get("opening_block") or {}).get("last_time")
    if is_ch1 and lt:
        probs.append("Chapter 1 has no \"Last time…\"")
    if not is_ch1 and not lt:
        probs.append("no \"Last time…\" line")
    if lt and len(sentences(neutral(lt))) != 1:
        probs.append("\"Last time…\" is not one sentence")
    rep.check("opening_block", probs, f"{ob_words} words; order legend, reply, \"Last time…\"")
    prob_ids = [p.get("id") for p in source["paragraphs"] if "problem" in (p.get("marks") or [])]
    if not prob_ids:
        rep.fail("first_problem", "no paragraph is marked \"problem\"")
    else:
        before = 0
        for pid, t in base_items:
            if pid == prob_ids[0]:
                break
            if not pid.startswith("open."):
                before += wc(t)
        rep.check("first_problem", [f"starts {before} words after the opening block"] if before > 150 else [],
                  f"the problem ({prob_ids[0]}) starts {before} words after the opening block")

    # -- Pause & ask
    pa = source["pause_and_ask"]
    after = pa.get("after_paragraph")

    def pos(items):
        total = chapter_words(items)
        upto = 0
        for pid, t in items:
            upto += wc(t)
            if pid == after:
                break
        return 100.0 * upto / total if total else 0

    if has_jar:
        p150 = pos(render_all(source, blocks_json, pictures, family, "A", {"jar": filler(150)})[2])
        p250 = pos(render_all(source, blocks_json, pictures, family, "A", {"jar": filler(250)})[2])
        probs = [f"{p:.0f}% with a {n}-word jar scene" for p, n in ((p150, 150), (p250, 250)) if not 35 <= p <= 65]
        rep.check("pause_and_ask.position", probs, f"{p150:.0f}% with a 150-word jar scene, {p250:.0f}% with 250; want 35% to 65%")
    else:
        p = pos(items_a)
        rep.check("pause_and_ask.position", [] if 35 <= p <= 65 else [f"{p:.0f}% of the way through"],
                  f"{p:.0f}% of the way through; want 35% to 65%")
        if pa.get("position_pct") is not None and abs(pa["position_pct"] - p) > 3:
            rep.warn("pause_and_ask.position_reported", f"1d reported {pa['position_pct']}%, code counts {p:.0f}%")
    probs = []
    if after not in ids:
        probs.append(f"after_paragraph {after!r} is not a paragraph")
    need_lines = ["question", "answers_first", "if_stuck", "for_the_youngest", "for_the_grown_up"]
    if not is_ch1:
        need_lines.append("in_the_story")
    for k in need_lines:
        if not pa.get(k):
            probs.append(f"no {k}")
    if is_ch1 and pa.get("in_the_story"):
        probs.append("Chapter 1 has no \"In the story\" line")
    q = r_a.fill(pa.get("question") or "", "pause")
    if wc(q) > 20:
        probs.append(f"question is {wc(q)} words; want 20 or fewer")
    if q and "why" not in q.lower():
        probs.append("question is not a \"Why…?\" question")
    stuck = pa.get("if_stuck") or []
    if len(stuck) != 2:
        probs.append(f"{len(stuck)} \"If they're stuck\" prompts; want two")
    for s in stuck:
        first = (re.findall(r"[A-Za-z']+", neutral(s)) or [""])[0].lower()
        if first in YESNO_START:
            probs.append(f"if-stuck prompt starts with a yes/no word: \"{s}\"")
    fy = pa.get("for_the_youngest") or {}
    if not fy.get("talk"):
        probs.append("no talk prompt for the youngest")
    if fy.get("do_it") and not fy["do_it"].startswith("Show me"):
        probs.append("the youngest's do-it prompt doesn't start \"Show me\"")
    for k, v in fy.items():
        if v and re.search(r"\bcan you\b", v, re.I):
            probs.append(f"\"Can you\" in the youngest's {k} prompt")
    if (pa.get("for_the_grown_up") or "") != rc.GROWN_UP_LINE:
        probs.append("\"For the grown-up\" doesn't match the fixed line exactly")
    role = pa.get("answers_first")
    if role not in ("turn", "lead") and role not in rc.CHILD_SLOTS:
        probs.append(f"answers_first is {role!r}; want turn, lead or a slot")
    if pa.get("touches_mistake_of") and pa.get("touches_mistake_of") == role:
        probs.append("the child whose mistake the question touches answers first")
    if pa.get("in_the_story") and source.get("story_question"):
        sq = source["story_question"]
        para = next((p for p in source["paragraphs"] if p.get("id") == sq.get("paragraph")), None)
        if para and norm(sq.get("text", "")) not in norm(neutral(expand_for_scan(para["text"], r_a))):
            probs.append(f"the story question isn't in {sq.get('paragraph')} word for word")
    rep.check("pause_and_ask.lines", probs, f"every line present, question {wc(q)} words, \"Show me\", no yes/no prompts, fixed grown-up line")
    if role == "eldest":
        rep.warn("pause_and_ask.answers_first", "answers_first is the eldest slot; the kit wants the turn or lead child")
    if pas_q := ((pictures or {}).get("pause_and_ask_simple") or {}).get("question"):
        if wc(r_a.fill(pas_q, "pause")) > 20:
            rep.fail("pause_and_ask.picture_question", f"the picture-book question is {wc(r_a.fill(pas_q, 'pause'))} words")

    # -- last page
    lp = source["last_page"]
    order = ["why_question", "what_happened", "blessing_key", "calm_close", "next_time", "for_the_morning"]
    present = [k for k in lp if k in order]
    probs = []
    if present != [k for k in order if k in present]:
        probs.append(f"order is {present}")
    for k in order:
        if k == "blessing_key":
            continue
        if not lp.get(k) and not (k == "next_time" and ch == 60):
            probs.append(f"no {k}")
    if lp.get("calm_close") != CALM:
        probs.append("the calm close doesn't match \"Fire banked. Sleep low, stay warm, wake bright.\" exactly")
    bk = lp.get("blessing_key")
    if bk and not re.fullmatch(r"(?:[1-3] )?[A-Z][a-z]+(?: [A-Z][a-z]+)* \d{1,3}:\d{1,3}(?:[-–]\d{1,3})?", bk):
        probs.append(f"blessing_key {bk!r} is not a verse key (never the verse's words)")
    if lp.get("why_question") and "why" not in lp["why_question"].lower():
        probs.append("the last page's question is not a \"Why…?\"")
    if lp.get("what_happened") and len(sentences(neutral(lp["what_happened"]))) > 2:
        probs.append("\"What happened\" is over two sentences")
    fm = lp.get("for_the_morning") or {}
    ms = fm.get("missions") or {}
    have = sorted(k for k, v in ms.items() if (v or "").strip())
    if have != sorted(rc.BANDS) or sorted(ms) != sorted(rc.BANDS):
        probs.append(f"missions for bands {have}; want one each for 3-4, 5-6 and 7-9 and no other")
    if not fm.get("tell_it_back"):
        probs.append("no tell-it-back idea")
    nt = lp.get("next_time")
    nrow = rows.get(ch + 1) if isinstance(ch, int) else None
    if nt and nrow and nt not in (f"Ch. {ch + 1} · {nrow['title']}", f"Chapter {ch + 1} · {nrow['title']}"):
        probs.append(f"next_time {nt!r}; want \"Ch. {ch + 1} · {nrow['title']}\"")
    n_lines = 7 if bk else 6
    rep.check("last_page", probs, f"{n_lines} lines in order, fixed calm close, one mission per age band")

    # -- reading lines, join-in, rich words
    rl = source.get("reading_lines") or {}
    yl = rl.get("your_line") or {}
    probs = []
    ytxt = r_a.fill(yl.get("text") or "", "story")
    ys = sentences(ytxt)
    if not ytxt:
        probs.append("no \"your line\"")
    else:
        if not 1 <= len(ys) <= 3:
            probs.append(f"\"your line\" is {len(ys)} sentences; want 1 to 3")
        for s in ys:
            if wc(s) > 12:
                probs.append(f"\"your line\" sentence of {wc(s)} words; want 12 or fewer")
        letters = re.sub(r"[^A-Za-z]", "", ytxt)
        if letters and letters.isupper():
            probs.append("\"your line\" is in capitals")
        ptxt = dict(items_a).get(yl.get("paragraph"))
        if ptxt is None:
            probs.append(f"\"your line\" paragraph {yl.get('paragraph')!r} doesn't exist")
        elif norm(ytxt) not in norm(ptxt):
            probs.append(f"\"your line\" is not in {yl.get('paragraph')} word for word")
    bp = rl.get("big_print") or []
    if not 2 <= len(bp) <= 3:
        probs.append(f"{len(bp)} big-print items; want 2 or 3")
    rep.check("reading_lines", probs, f"\"your line\" {len(ys)} sentence(s) in {yl.get('paragraph')}; {len(bp)} big-print items")
    ji = source.get("join_in") or {}
    probs = []
    jtxt = r_a.fill(ji.get("line") or "", "story")
    ptxt = dict(items_a).get(ji.get("paragraph"))
    if not jtxt:
        probs.append("no join-in line marked")
    elif ptxt is None:
        probs.append(f"join-in paragraph {ji.get('paragraph')!r} doesn't exist")
    elif norm(jtxt) not in norm(ptxt):
        probs.append(f"the join-in line is not in {ji.get('paragraph')} word for word")
    rep.check("join_in", probs, f"\"{jtxt}\" in {ji.get('paragraph')}")
    rw = source.get("rich_words") or []
    probs = []
    if not 3 <= len(rw) <= 5:
        probs.append(f"{len(rw)} rich words; want 3 to 5")
    if sum(1 for w in rw if w.get("everyday")) < 2:
        probs.append("fewer than two everyday rich words")
    cb_plain = plain(" ".join(t for _, t in items_a))
    counts = []
    for w in rw:
        n = count_word(w.get("word", ""), cb_plain)
        counts.append(f"{w.get('word')} ×{n}")
        if n < 2:
            probs.append(f"\"{w.get('word')}\" appears {n} time(s); want at least 2")
    new_in = {}
    for w in rw:
        for pid, t in items_a:
            if count_word(w.get("word", ""), plain(t)):
                new_in.setdefault(pid, []).append(w.get("word"))
                break
    for pid, ws in new_in.items():
        if len(ws) > 1:
            probs.append(f"{pid} brings in more than one new rich word ({', '.join(ws)})")
    rep.check("rich_words", probs, ", ".join(counts))

    # -- marks the checker needs
    probs = []
    for k in ("key_act", "laugh"):
        v = source.get(k) or {}
        if not v.get("paragraph") or v.get("paragraph") not in ids:
            probs.append(f"{k} has no paragraph")
    mb = source.get("modeled_behavior")
    if mb:
        ptxt = dict(items_a).get(mb.get("paragraph"))
        if ptxt is None:
            probs.append("modeled_behavior has no paragraph")
        elif mb.get("phrase") and norm(mb["phrase"]) not in norm(ptxt):
            probs.append(f"the phrase \"{mb['phrase']}\" isn't spoken in {mb.get('paragraph')}")
    elif not is_ch1:
        probs.append("no modeled_behavior")
    else:
        rep.warn("marks.modeled_behavior", "Chapter 1 marks no modeled behavior; the checklist (item 8) still asks for one")
    if not is_ch1 and not source.get("story_question"):
        probs.append("no story_question")
    rep.check("marks", probs, "key act, laugh" + (", modeled behavior" if mb else "") + " marked on real paragraphs")

    # -- Tier C defaults within their bands
    probs = []
    for d in source.get("tier_c_defaults") or []:
        try:
            t = neutral(rc.default_text(d))
        except rc.RenderError as e:
            probs.append(str(e))
            continue
        n, ns, slot = wc(t), len(sentences(t)), d.get("slot")
        band = {"jar": (150, 250), "rw": (40, 90), "gp_words": (0, 40), "plan": (0, 20), "guest": (0, 20)}.get(slot)
        if band and not band[0] <= n <= band[1]:
            probs.append(f"{d.get('id')} ({slot}) is {n} words; want {band[0]} to {band[1]}")
        if slot == "gp_words" and ns > 2:
            probs.append(f"{d.get('id')} is {ns} sentences; want 2 or fewer")
        if slot == "favorite" and not 1 <= ns <= 2:
            probs.append(f"{d.get('id')} is {ns} sentences; want 1 or 2")
        if slot == "jar" and not d.get("paragraphs"):
            probs.append(f"{d.get('id')} is not written as numbered paragraphs (jar.p1, jar.p2…)")
    rwh = source.get("remember_when")
    if rwh and rwh.get("text") and not 40 <= wc(neutral(rwh["text"])) <= 90:
        probs.append(f"remember when is {wc(neutral(rwh['text']))} words; want 40 to 90")
    gpr = (source.get("opening_block") or {}).get("gp_reply")
    if gpr and "[[tierc:" not in gpr and wc(neutral(gpr)) > 40:
        probs.append(f"the grandparent reply is {wc(neutral(gpr))} words; want 40 or fewer")
    pr = source.get("plan_reminder")
    if pr:
        ptxt = pr.get("text") if isinstance(pr, dict) else pr
        if "(Pause. Let [[child:turn]] say it.)" not in (ptxt or ""):
            probs.append("the plan reminder has no \"(Pause. Let [[child:turn]] say it.)\" cue")
    if has_jar and not source.get("jar_brief"):
        probs.append("a jar chapter with no jar_brief")
    n_def = len(source.get("tier_c_defaults") or [])
    rep.check("tier_c_defaults", probs, f"{n_def} default(s), each within its slot's band")

    # -- refrains and spellings
    story_strings = scan_strings(source, pictures, blocks, looks, renders, blocks_json, family)
    probs = []
    for where, t in story_strings:
        probs += [f"{where}: {p}" for p in refrain_problems(t)]
    rep.check("refrains", sorted(set(probs)), "every refrain, place and capitalized term spelled exactly")

    # -- word lists
    canon_q = [plain(x) for x in source.get("canon_quoted") or []]
    skip_names = [rc.child_name(c) for c in family.get("children") or []] + list(source.get("allowed_names") or [])
    hard, confirm = [], []
    for where, t in story_strings:
        t = plain(t)
        for cq in canon_q:
            t = t.replace(cq, " ")
        for nm in skip_names:
            t = re.sub(r"\b" + re.escape(nm) + r"\b", " ", t)
        for lst, entries in HARD_LISTS.items():
            for e in entries:
                if phrase_re(e, case=lst in CASE_SENSITIVE_LISTS).search(t):
                    hard.append(f"{where}: {lst}: \"{e}\"")
        for lst, entries in NARRATION_ONLY.items():
            for e in entries:
                if phrase_re(e).search(strip_quotes(t)):
                    hard.append(f"{where}: {lst}: \"{e}\"")
        for e in tolkien:
            if phrase_re(e, case=e[:1].isupper()).search(t):
                hard.append(f"{where}: Tolkien: \"{e}\"")
        for m in re.finditer(r"\b[A-Z]\w*shire\b|\bby-Water\b", t):
            hard.append(f"{where}: Tolkien: a \"-shire\" or \"by-Water\" name (\"{m.group(0)}\")")
        if VERSE_REF_RE.search(t):
            hard.append(f"{where}: a verse reference in story text")
        for lst, entries in CONFIRM_LISTS.items():
            for e in entries:
                if phrase_re(e).search(t):
                    confirm.append(f"{where}: {lst}: \"{e}\"")
    rep.check("never_words", sorted(set(hard)),
              "no threat, death, shaming, preaching, fire (\"blow out\"), water, screen, slang, weapon, brand, "
              "Tolkien or faith words; no \"little ones\" or \"kids\" in narration")
    if confirm:
        rep.warn("confirm_words", "sent to the checker to judge in context: " + "; ".join(sorted(set(confirm))))
    if tolkien is TOLKIEN_FALLBACK:
        rep.warn("never_words.tolkien_list", "couldn't read the Tolkien list from canon §2; used the built-in copy")

    # -- pronouns: a child's (or the grandparent's, or the parents') subject pronoun only inside a block
    fails, warns = pronoun_scan(source, pictures, r_a)
    rep.check("pronouns", fails, "no subject pronoun outside a block in a sentence that names a child, the grandparent "
              "or the parents (or follows one)")
    if warns:
        rep.warn("pronouns.confirm", "pronouns outside a block, near no named person; the checker confirms whose: "
                 + "; ".join(warns[:8]) + (f"; and {len(warns) - 8} more" if len(warns) > 8 else ""))

    # -- names
    probs = []
    for where, t in raw_all:
        for nm in SAMPLE_NAMES:
            outside = rc.MARKER_RE.sub(" ", t or "")
            if re.search(r"\b" + nm + r"\b", outside):
                probs.append(f"{where}: sample-family name \"{nm}\" outside a marker")
    fam_words = re.compile(r"\b(Grandma|Grandpa|Granny|Grandad|Granddad|Nana|Mom|Dad|Mum|Mama|Papa|Mommy|Daddy)\b")
    for where, t in raw_all:
        for w in fam_words.findall(rc.MARKER_RE.sub(" ", t or "")):
            probs.append(f"{where}: \"{w}\" written out (use [[gp:…]] or [[parents:called]])")
    allowed = allowed_capitals(family, source)
    for where, t in story_strings:
        for w in unknown_capitals(t, allowed):
            probs.append(f"{where}: \"{w}\" is not a family, cast or place name")
    rep.check("names", sorted(set(probs)), "every capitalized name is the family's, the cast's or a place; no sample name outside a marker")
    gp_probs = []
    for p in (family.get("grandparent") or {}).get("people") or []:
        nm, called = p.get("name"), p.get("called")
        if not nm:
            continue
        for where, t in story_strings:
            for m in re.finditer(r"\b" + re.escape(nm) + r"\b", plain(t)):
                if not plain(t)[:m.start()].rstrip().endswith(called):
                    gp_probs.append(f"{where}: \"{nm}\" without \"{called}\" before it")
    rep.check("grandparent_name", gp_probs, "the grandparent's first name never stands alone")
    rep_probs = []
    names = [rc.child_name(c) for c in family.get("children") or []]
    for pid, t in items_a:
        rep_probs += name_repetition(pid, t, names, "sample family")
    for row_ in (blocks_json.get("one_child_she_version") or []):
        rep_probs += name_repetition(row_.get("id", "?"), row_.get("text", ""), [], "one-child she version", any_name=True)
    rep_probs += matrix_stats["names"]
    rep.check("name_repetition", sorted(set(rep_probs)), "no child named more than twice in a paragraph or starting two sentences in a row")

    # -- likeness touches
    per = {}
    for lid, key, telling in r_a.looks_placed:
        per.setdefault(telling, []).append(lid)
    over = [f"{t}: {len(v)}" for t, v in per.items() if len(v) > 2]
    rep.check("looks", over, f"{sum(len(v) for v in per.values())} likeness touch(es) placed for the sample family, at most two a telling")

    # -- Shoulds
    sw = source.get("sound_words") or []
    if not 1 <= len(sw) <= 3:
        rep.warn("sound_words", f"{len(sw)} sound words (Should: 1 to 3)")
    digits = [pid for pid, t in items_a if re.search(r"\b\d+\b", t)]
    if digits:
        rep.warn("numbers_in_words", "digits in story text (Should be words): " + ", ".join(digits))
    shout = [w for _, t in items_a for w in re.findall(r"\b[A-Z]{2,}\b", plain(t)) if w not in ("I", "OK")]
    if len(shout) > 1:
        rep.warn("shouting", f"capitals for shouting {len(shout)} times (Should: once at most): {', '.join(shout)}")
    gray = [w for w, t in story_strings if re.search(r"\bgray\b", t, re.I)]
    if gray:
        rep.warn("spelling.grey", "\"gray\" in: " + ", ".join(gray))
    kids_named = {n: 0 for n in names}
    for _, t in items_a:
        for n in names:
            kids_named[n] += len(re.findall(r"\b" + re.escape(n) + r"\b", t))
    quiet = [n for n, c in kids_named.items() if c == 0]
    if quiet:
        rep.warn("every_child", "never named in the chapter-book telling (Should: every child says or does something): " + ", ".join(quiet))
    # -- the picture figures, per family size
    if pictures:
        probs = [f"{m} [{len(v)} famil{'y' if len(v) == 1 else 'ies'}, e.g. {v[0]}]" for m, v in matrix_stats["figures"].items()]
        probs += [f"{m} (sample family)" for m, _ in picture_figure_problems(pictures, r_a, "sample family")]
        rep.check("pictures.figures", sorted(set(probs)),
                  "every picture's figures resolve to real children for every family size: no slot a family lacks, "
                  "nobody drawn twice, every child the words name drawn, every child in the comfort image")

    # -- ends warm, test 1 (bible §9): the last paragraph shows every child
    probs = []
    if ending_unit != ids[len(ids) - len(ending_unit):]:
        probs.append(f"last_paragraph_unit {ending_unit} is not the chapter's last paragraphs in order")
    miss = ending_names(items_a, ending_unit, names)
    if miss:
        probs.append(f"the ending names neither every child nor \"everyone\" for the sample family (no {', '.join(miss)})")
    probs += [f"the ending {m} [{len(v)} families, e.g. {v[0]}]" for m, v in matrix_stats["ending"].items()]
    rep.check("ends_warm.children", probs, "the last paragraph" + (f"s ({', '.join(ending_unit)}, read as one unit)" if len(ending_unit) > 1 else f" ({ending_unit[0]})")
              + (" name" if len(ending_unit) > 1 else " names") + " every child, in every version")
    if len(ending_unit) > 1:
        rep.warn("ends_warm.unit", f"the ending is read as one unit, {', '.join(ending_unit)}: "
                 + (source.get("last_paragraph_unit_note") or "the source gives no reason"))

    # -- the job list (prompt 1b)
    try:
        outline, opath = load_outline(args.outline, source.get("season") or 1)
    except rc.RenderError as e:
        rep.fail("job_list", str(e))
        outline = None
        opath = True
    if outline is None and opath is None:
        rep.warn("job_list", "no stored outline (prompt 1b) for this season, so the job list can't be tested")
    elif outline is not None:
        row_ = next((c for c in outline.get("chapters") or [] if c.get("chapter") == ch), None)
        if not row_:
            rep.warn("job_list", f"the outline {Path(opath).name} has no row for chapter {ch}")
        else:
            probs, done, untested = job_problems(source, row_, has_jar)
            rep.check("job_list", probs, f"jobs from {Path(opath).name}: " + (", ".join(done) or "none")
                      + ("; lead_by_size and fear level match" if "lead_by_size" in row_ else ""))
            if untested:
                rep.warn("job_list.untested", "jobs code can't see; the checker confirms: " + ", ".join(untested))

    # -- names that are also everyday words
    hits = {}
    for where, t in story_strings:
        low = rc.MARKER_RE.sub(" ", plain(t)).lower()
        for nm in COMMON_NOUN_NAMES:
            if re.search(r"\b" + nm.lower() + r"s?\b", low):
                hits.setdefault(nm, set()).add(where.split("[")[0])
    if hits:
        rep.warn("names.common_nouns", "a child with one of these names would hear the word as the child; the checker "
                 "confirms each (a reviewed alternate word, or fine as it is): "
                 + "; ".join(f"{nm}: {', '.join(sorted(w)[:4])}" for nm, w in sorted(hits.items())))

    # -- the rendered Markdown
    if args.md:
        md_checks(rep, args.md, source, blocks_json, pictures, family)

    return 1 if rep.print() else 0


# ---------------------------------------------------------------------------
# Pictures, job list and ending

def picture_figure_problems(pictures, r, label):
    """Every picture's figures resolve to real children for this family (prompts.md 5.5):
    no slot the family lacks, no child drawn twice, every child the picture's words name is
    drawn, and every child is drawn in the comfort image and in a picture whose words say
    "everyone"."""
    probs = []
    kids = {c["slot"]: rc.child_name(c) for c in r.slots["ordered"]}
    for pic in (pictures or {}).get("pictures") or []:
        where = f"picture {pic.get('n')}"
        try:
            figs = rc.resolve_figures(pic.get("image"), r, where)
        except rc.RenderError as e:
            probs.append((str(e), label))
            continue
        drawn = {slot for slot, _ in figs if slot in rc.CHILD_SLOTS}
        try:
            text = plain(r.fill(pic.get("text", ""), "story", "picture"))
        except rc.RenderError:
            continue
        need = {}
        if "comfort_final" in (pic.get("roles") or []):
            need.update({s: "the comfort image" for s in kids})
        elif EVERYONE_RE.search(text):
            need.update({s: "\"everyone\" in its words" for s in kids})
        for s_, nm in kids.items():
            if re.search(r"\b" + re.escape(nm) + r"\b", text):
                need.setdefault(s_, "its words name them")
        for s_ in sorted(set(need) - drawn):
            probs.append((f"{where}: the {s_} child isn't drawn ({need[s_]}) in a family of {min(len(kids), 4)}", label))
    return probs


JOB_KINDS = ("gp_reply", "trial_memory", "jar", "rw", "vote", "pocket_question", "mentor", "plan_reminder",
             "letter_home", "trial_announcement", "clue", "hook")


def load_outline(path, season):
    if path:
        p = Path(path)
    else:
        p = REDESIGN / "story" / f"season-{season}" / "outline.json"
        if not p.exists():
            return None, None
    try:
        return json.loads(p.read_text(encoding="utf-8")), p
    except (OSError, ValueError) as e:
        raise rc.RenderError(f"can't read the outline {p}: {e}")


def job_problems(source, row, has_jar):
    """The chapter against its stored job list (prompt 1b): each job done where code can see
    it, and no vote, jar or remember-when the list doesn't ask for."""
    probs, untested, done = [], [], []
    paras = source.get("paragraphs") or []
    marks = [m for p in paras for m in (p.get("marks") or [])]
    jobs = row.get("jobs") or []
    kinds = [j.get("job") for j in jobs]
    for j in jobs:
        k = j.get("job")
        if k not in JOB_KINDS:
            probs.append(f"unknown job {k!r}")
            continue
        ok = None
        if k == "clue":
            ok = "clue" in marks
        elif k == "mentor":
            ok = "mentor" in marks and any("[[cast:Hild]]" in (p.get("text") or "") for p in paras)
        elif k == "pocket_question":
            if j.get("slot") == "all":
                ok = "pocket_questions" in marks
            else:
                sq = source.get("story_question") or {}
                ok = bool(sq.get("text")) and sq.get("asked_by") == j.get("slot") and \
                    any(p.get("id") == sq.get("paragraph") for p in paras)
        elif k == "jar":
            ok = has_jar and bool(source.get("jar_brief"))
        elif k == "vote":
            v = source.get("vote") or {}
            ok = v.get("number") == j.get("number") and len(v.get("options") or []) == 2
        elif k == "rw":
            rw = source.get("remember_when") or {}
            ok = bool(rw.get("text")) and rw.get("slot") == j.get("slot") and rw.get("from_chapter") == j.get("from_chapter")
        elif k == "gp_reply":
            ok = bool((source.get("opening_block") or {}).get("gp_reply"))
        elif k == "plan_reminder":
            ok = bool(source.get("plan_reminder"))
        elif k == "letter_home":
            ok = bool(source.get("letter_home"))
        elif k == "hook":
            hook = source.get("hook") or ""
            last = (paras[-1].get("text") or "") if paras else ""
            ok = bool(hook) and norm(neutral(hook)) in norm(neutral(last)) + " " + norm(last)
        else:
            untested.append(k)
            continue
        (done if ok else probs).append(k if ok else f"job {k}" + (f" ({j.get('slot') or j.get('number')})" if j.get("slot") or j.get("number") else "") + " not done")
    if source.get("vote") and "vote" not in kinds:
        probs.append("the chapter has a vote the job list doesn't ask for")
    if has_jar and "jar" not in kinds:
        probs.append("the chapter has a jar slot the job list doesn't ask for")
    if source.get("remember_when") and "rw" not in kinds:
        probs.append("the chapter has a remember-when the job list doesn't ask for")
    if "mentor" in marks and "mentor" not in kinds:
        probs.append("Hild appears (a \"mentor\" mark), but the job list has no mentor job")
    for key in ("lead_by_size", "fear_level"):
        if key in row and source.get(key) != row[key]:
            probs.append(f"{key} {source.get(key)!r} differs from the outline's {row[key]!r}")
    return probs, done, untested


def ending_names(items, unit, names):
    """Which children the ending (the last paragraph, or the unit of paragraphs the source
    names) leaves out. "everyone" or "everybody" counts as every child."""
    text = " ".join(t for pid, t in items if pid in unit)
    if EVERYONE_RE.search(plain(text)):
        return []
    return [n for n in names if not re.search(r"\b" + re.escape(n) + r"\b", text)]


# ---------------------------------------------------------------------------
# Helpers used by the checks

def flatten(o):
    if isinstance(o, dict):
        for v in o.values():
            yield from flatten(v)
    elif isinstance(o, list):
        for v in o:
            yield from flatten(v)
    elif o is not None:
        yield o


def count_word(word, text):
    w = word.lower().strip()
    if not w:
        return 0
    forms = {w, w + "s", w + "es", w + "ed", w + "d", w + "ing", w + "ly", w + "er", w + "est"}
    if w.endswith("e"):
        forms |= {w[:-1] + "ing", w[:-1] + "y"}
    if w.endswith("le"):
        forms.add(w[:-1] + "y")
    if w.endswith("y"):
        forms |= {w[:-1] + "ies", w[:-1] + "ied", w[:-1] + "ily", w[:-1] + "iness"}
    toks = re.findall(r"[a-z]+(?:-[a-z]+)*", text.lower())
    return sum(1 for t in toks if t in forms)


def speakers(text):
    t = plain(text)
    named, pron = set(), set()
    for m in SAY_AFTER.finditer(t):
        named.add(m.group(1))
    for m in SAY_BEFORE.finditer(t):
        g = m.group(1)
        if g.lower() in ("he", "she", "they", "i", "we"):
            pron.add(g.lower())
        else:
            named.add(g)
    out = set()
    for n in named:
        n2 = n.lower()
        if n2 in ("the", "and", "then", "so", "but"):
            continue
        out.add(SPEAKER_ALIASES.get(n2, n2))
    return out, pron


def name_repetition(pid, text, names, label, any_name=False):
    out = []
    ss = sentences(text)
    if any_name:
        names = sorted({m for m in re.findall(r"\b[A-Z][a-z]+\b", text)} - REVIEWED_WORDS - set(CAST) - set(PLACES))
        names = [n for n in names if len(re.findall(r"\b" + n + r"\b", text)) > 2 or any(
            a.startswith(n) and b.startswith(n) for a, b in zip(ss, ss[1:]))]
    for n in names:
        if not n:
            continue
        cnt = len(re.findall(r"(?<![\w'])" + re.escape(n) + r"(?![\w])", plain(text)))
        if cnt > 2:
            out.append(f"{pid} ({label}): \"{n}\" {cnt} times")
        starts = [s.lstrip("\"“*").startswith(n) for s in ss]
        if any(a and b for a, b in zip(starts, starts[1:])):
            out.append(f"{pid} ({label}): \"{n}\" starts two sentences in a row")
    return out


# Each refrain with the anchor that finds a use of it (case-insensitive unless it starts
# with "(?-i)"). Wherever an anchor matches, one of the refrain's exact forms must be there.
REFRAIN_ANCHORS = {
    "Lantern up!": r"(?-i:Lantern up)\b",
    "Not yet… keep going!": r"\bnot yet\W+keep going",
    "Oops… up again!": r"\boops\W+up again",
    "Hand on heart: I'll say what's true.": r"\bhand on heart\b",
    "Sleep low, stay warm, wake bright.": r"\bsleep low\b",
    "Good evening. I'm so sorry to bother you.": r"\bso sorry to bother you\b",
    # A child's real count past four ("one, two, three, four, five, six, seven") is not Ember's refrain.
    "One, two, three, four, lots.": r"\bone\W+two\W+three\W+four\b(?!\W+five\b)",
    "The way on is yours.": r"\bway on is yours\b",
    "That's not mine to tell.": r"\bnot mine to tell\b",
    "…and the flame hopped across.": r"\bflame hopped across\b",
    "Fire banked. Sleep low, stay warm, wake bright.": r"\bfire banked\b",
}


def refrain_forms(ref):
    forms = {ref}
    if ref.endswith("."):
        forms.add(ref[:-1] + ",")
    if ref.startswith("Good evening."):
        forms |= {"I'm so sorry to bother you.", "I'm so sorry to bother you,"}
    if ref.startswith("Fire banked."):
        forms = {ref}
    return forms


def refrain_problems(text):
    t = plain(text).replace("’", "'")
    probs = []
    for ref, anchor in REFRAIN_ANCHORS.items():
        forms = refrain_forms(ref)
        for m in re.finditer(anchor, t, re.I):
            window = t[max(0, m.start() - len(ref) - 2): m.end() + len(ref) + 2]
            if ref.startswith("Sleep low") and "Fire banked. " + ref in window:
                continue
            if not any(f in window for f in forms):
                a = max(0, m.start() - 12)
                probs.append(f"\"…{t[a: m.end() + 24].strip()}…\" should use \"{ref}\" exactly")
    for sp in SPELLINGS:
        toks = re.findall(r"[A-Za-z]+", sp)
        loose = re.compile(r"\b" + r"[\W_]*\s*".join(toks) + r"\b", re.I)
        for m in loose.finditer(t):
            if t[m.start(): m.start() + len(sp)] != sp:
                probs.append(f"\"{m.group(0)}\" should be \"{sp}\"")
    for term in LOWERCASE_TERMS:
        for m in re.finditer(r"\b" + r"\s+".join(term.split()) + r"\b", t, re.I):
            if m.group(0) != term and m.group(0) != term[0].upper() + term[1:]:
                probs.append(f"\"{m.group(0)}\" should be lowercase \"{term}\"")
    for m in re.finditer(r"\bthe Beacon\b(?! (?:Night|Feast))", t):
        probs.append("\"the Beacon\" should be \"the beacon\"")
    return probs


def expand_for_scan(text, r, depth=0):
    """Blocks expanded (the sample family's choice), wrapped in \\x01…\\x02 so a scan can
    tell block text from free text. Every other marker is left in place."""
    if depth > 12:
        return text

    def sub(m):
        kind, arg = rc.parse_marker(m.group(1))
        if kind != "block":
            return m.group(0)
        b = r.blocks.get(arg)
        if b is None:
            return "\x01\x02"
        try:
            key = r.choose_version(b)
        except rc.RenderError:
            key = next(iter(b["versions"]))
        return "\x01" + expand_for_scan(b["versions"][key], r, depth + 1) + "\x02"

    return rc.MARKER_RE.sub(sub, text or "")


PERSON_MARKER = re.compile(r"\[\[(?:child|pro|gp|parents):[^\]]*\]\]")


def pronoun_scan(source, pictures, r):
    fails, warns = [], []
    units = []
    ob = source.get("opening_block") or {}
    for k in ("legend", "gp_reply", "last_time"):
        if ob.get(k):
            units.append((f"opening_block.{k}", ob[k]))
    for p in source.get("paragraphs") or []:
        units.append((p.get("id"), p.get("text", "")))
    for d in source.get("tier_c_defaults") or []:
        for p in d.get("paragraphs") or ([{"id": d.get("id"), "text": d.get("text", "")}]):
            units.append((f"{d.get('id')}:{p.get('id')}", p.get("text", "")))
    lp = source.get("last_page") or {}
    if lp.get("what_happened"):
        units.append(("last_page.what_happened", lp["what_happened"]))
    pa = source.get("pause_and_ask") or {}
    for k in ("question", "stretch", "in_the_story"):
        if pa.get(k):
            units.append((f"pause_and_ask.{k}", pa[k]))
    for pic in (pictures or {}).get("pictures") or []:
        units.append((f"picture {pic.get('n')}", pic.get("text", "")))
    prev_last = ""
    for where, raw in units:
        exp = re.sub(r"\s+", " ", expand_for_scan(raw, r)).strip()
        free = mask_blocks(exp)
        spans = sentence_spans(exp)
        for i, (a, b) in enumerate(spans):
            s = exp[a:b]
            prev = exp[spans[i - 1][0]:spans[i - 1][1]] if i else prev_last
            fr = rc.MARKER_RE.sub(" ", free[a:b].replace("\x03", " "))
            near = PERSON_MARKER.search(s) or PERSON_MARKER.search(prev)
            show = plain(rc.MARKER_RE.sub(lambda m: "{" + m.group(1) + "}", s.replace("\x01", "").replace("\x02", "")))
            hits = SUBJECT_PRONOUNS.findall(fr)
            if hits:
                h = "/".join(sorted(set(x.lower() for x in hits)))
                if near:
                    fails.append(f"{where}: \"{h}\" outside a block in \"{show[:70]}\"")
                else:
                    warns.append(f"{where}: \"{h}\" in \"{show[:50]}\"")
            op = OBJ_POS_PRONOUNS.findall(fr)
            if op and near:
                h = "/".join(sorted(set(x.lower() for x in op)))
                warns.append(f"{where}: \"{h}\" (not [[pro:…]]) in \"{show[:50]}\"")
        prev_last = exp[spans[-1][0]:spans[-1][1]] if spans else ""
    return fails, warns


def sentence_spans(t):
    out, start = [], 0
    for m in re.finditer(r"([.!?…][\"”’')\]*\x02]*)(\s+)(?=[\x01\"“‘'(*]*[A-Z0-9\[])", t):
        out.append((start, m.end(1)))
        start = m.end()
    if t[start:].strip():
        out.append((start, len(t)))
    return out


def mask_blocks(t):
    """Same length as t, with every character inside a block turned into \\x03."""
    out, depth = [], 0
    for ch in t:
        if ch == "\x01":
            depth += 1
            out.append(ch)
        elif ch == "\x02":
            depth = max(0, depth - 1)
            out.append(ch)
        else:
            out.append("\x03" if depth else ch)
    return "".join(out)


SKIP_SCAN = {"pause_and_ask.for_the_grown_up", "last_page.calm_close", "last_page.next_time"}


def scan_strings(source, pictures, blocks, looks, renders, blocks_json, family):
    """(where, text) for every string the word lists, names and spelling tests scan: the
    chapter-book telling as the sample family hears it (each route), every other reader-facing
    field filled for the sample family, and every block version, look option and default on
    its own. Fixed lines the kit writes (the grown-up line, the calm close, Next time) and the
    app's own labels are skipped."""
    out = []
    for route, (md, rr, items) in ((k, v) for k, v in renders.items() if not k.endswith("nojar")):
        for pid, t in items:
            if t:
                out.append((f"route {route} {pid}", t))
        rs = rc.Renderer(source, blocks_json, family, route=route)
        for where, text, ctx in all_texts(source, pictures):
            if where in SKIP_SCAN or where in {p.get("id") for p in source.get("paragraphs") or []} \
                    or where.startswith("opening_block."):
                continue
            try:
                out.append((f"route {route} {where}", rs.fill(text, ctx, "scan")))
            except rc.RenderError:
                out.append((f"route {route} {where}", neutral(text)))
    for bid, b in blocks.items():
        for k, v in b["versions"].items():
            out.append((f"block {bid}[{k}]", neutral(v)))
    for lid, lk in looks.items():
        for k, v in lk["options"].items():
            out.append((f"look {lid}[{k}]", neutral(v)))
    return out


def allowed_capitals(family, source):
    allowed = set(REVIEWED_WORDS) | {PLACEHOLDER, "Gran", "Nan", "Mom", "Dad"}
    for c in family.get("children") or []:
        allowed |= set(rc.child_name(c).split())
    g = family.get("grandparent") or {}
    for p in g.get("people") or []:
        allowed |= set((p.get("called") or "").split()) | set((p.get("name") or "").split())
    for k in ("story_called", "story_name"):
        allowed |= set((g.get(k) or "").split())
    allowed |= set(((family.get("parents") or {}).get("called") or "").split())
    for n in CAST + PLACES + list(source.get("allowed_names") or []):
        allowed |= set(n.replace("'", " ").split()) | {n}
    for n in source.get("new_names") or []:
        allowed |= set((n.get("name") if isinstance(n, dict) else n).split())
    allowed |= set((family.get("cast_alternates") or {}).values())
    for ref in REFRAINS:
        allowed |= set(re.findall(r"[A-Z][\w']*", ref))
    return allowed


def unknown_capitals(text, allowed):
    t = plain(text)
    out = []
    for s in re.split(r"(?<=[.!?…:])\s+|[\"“”]|\n", t):
        toks = re.findall(r"[A-Za-z][\w'’-]*", s)
        for i, w in enumerate(toks):
            if i == 0 or not w[0].isupper():
                continue
            base = re.sub(r"['’]s$", "", w)
            if base in allowed or w in allowed:
                continue
            out.append(w)
    return out


def md_checks(rep, md_path, source, blocks_json, pictures, family):
    try:
        md = Path(md_path).read_text(encoding="utf-8")
    except OSError as e:
        rep.fail("md.read", str(e))
        return
    m = re.match(r"^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?", md)
    probs = []
    fm = {}
    if not m:
        probs.append("no front matter")
    else:
        for line in m.group(1).splitlines():
            kv = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*)$", line.strip())
            if kv:
                v = kv.group(2).strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                    v = v[1:-1]
                fm[kv.group(1)] = v
    for k in ("id", "season", "part", "chapter", "title", "tag", "lead"):
        if not fm.get(k):
            probs.append(f"front matter has no {k}")
    if fm.get("id") and not re.fullmatch(r"s\d{1,2}-ch\d{2,3}", fm["id"]):
        probs.append(f"id {fm['id']!r} doesn't match sN-chNN")
    if fm.get("chapter") and str(source.get("chapter")) != fm["chapter"]:
        probs.append(f"chapter {fm['chapter']} != source {source.get('chapter')}")
    if fm.get("title") and fm["title"] != source.get("title"):
        probs.append("title differs from the source")
    if fm.get("tag") and fm["tag"] != source.get("tag", "").split("·")[0].strip():
        probs.append(f"tag {fm['tag']!r} isn't the strength from the tag line")
    secs, order = rc_sections(md)
    want = ["Chapter-book telling", "Picture-book telling", "Pause & ask", "Last page", "For the grown-up", "Vote",
            "Remember when", "Pictures", "Defaults", "Flags for Jon", "Packet card"]
    if order != want:
        probs.append(f"sections are {order}; want {want}")
    telling = paragraphs_of(secs.get("chapter-book telling", ""))
    pause_re = re.compile(r"^\s*(?:>\s*)?(?:\[\[\s*pause\s*&(?:amp;)?\s*ask\s*\]\]|\*\*pause\s*&\s*ask:?\*\*:?)", re.I)
    n_pause = sum(1 for b in telling if pause_re.match(b))
    if n_pause != 1:
        probs.append(f"{n_pause} Pause & ask markers in the telling; want 1")
    pa_sec = secs.get("pause & ask", "")
    if not re.search(r"\*\*Question:?\*\*:?\s*(.+)", pa_sec, re.I):
        probs.append("no **Question:** line")
    if not re.search(r"\*\*Answers first:?\*\*:?\s*(.+)", pa_sec, re.I):
        probs.append("no **Answers first:** line")
    if "**For the grown-up:**" not in pa_sec:
        probs.append("no **For the grown-up:** line")
    if not secs.get("last page"):
        probs.append("empty Last page")
    left = [x for x in rc.MARKER_RE.findall(md) if x.strip().lower() != "pause & ask"]
    if left:
        probs.append(f"marker left: [[{left[0]}]]")
    rep.check("md.format", probs, f"front matter {fm.get('id')}, sections in order, one [[Pause & ask]], loader lines present")
    lp = paragraphs_of(secs.get("last page", ""))
    labels = ["The end of Chapter", "Why do you think", "What happened", "Blessing", "Fire banked.", "Next time",
              "For the morning"]
    got = []
    for para in lp:
        for i, lab in enumerate(labels):
            if plain(para).startswith(lab):
                got.append(i)
    probs = [] if got == sorted(got) and len(got) >= 6 else [f"last-page lines in order {got}"]
    rep.check("md.last_page", probs, f"{len(got)} last-page lines in order")
    after = source["pause_and_ask"].get("after_paragraph")
    try:
        md_route = re.search(r"vote route ([AB])", md)
        fresh, _ = rc.render_markdown(source, blocks_json, pictures, family, route=md_route.group(1) if md_route else "A")
    except rc.RenderError as e:
        rep.fail("md.current", f"can't re-render to compare: {e}")
        return
    strip = lambda s: re.sub(r"<!--[\s\S]*?-->", "", s).strip()
    if strip(fresh) != strip(md):
        a, b = strip(fresh).splitlines(), strip(md).splitlines()
        first = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
        rep.fail("md.current", f"the .md differs from a fresh render with this family (first at line {first + 1}); render it again")
    else:
        rep.ok("md.current", f"matches a fresh render for {family.get('family_id')}; Pause & ask after {after}")
    probs = []
    if "—" in md:
        probs.append("em dash")
    if "..." in md:
        probs.append("\"...\"")
    rep.check("md.typography", probs, "no em dash, no \"...\"")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Plain code tests for one Grit & Grace chapter (prompts.md section 14).")
    ap.add_argument("source", help="chapter source JSON (prompt 1d)")
    ap.add_argument("--blocks", help="variant blocks JSON (prompt 1f)")
    ap.add_argument("--pictures", help="pictures JSON (prompt 1e)")
    ap.add_argument("--md", help="a rendered .md (render-chapter.py) to test as well")
    ap.add_argument("--family", default=str(DEFAULT_FAMILY), help="FAMILY JSON (default: story/sample-family.json)")
    ap.add_argument("--canon", default=str(DEFAULT_CANON), help="canon.md, for the chapter table and the Tolkien list")
    ap.add_argument("--outline", help="the season outline with every chapter's job list, lead_by_size and fear level "
                    "(prompt 1b; default: story/season-N/outline.json when it exists)")
    ap.add_argument("--no-matrix", action="store_true", help="skip rendering for the made-up families")
    ap.add_argument("--quiet", action="store_true", help="print only WARN and FAIL lines")
    return run(ap.parse_args(argv))


if __name__ == "__main__":
    sys.exit(main())
