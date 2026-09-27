# Grit & Grace: settled decisions

Settled by Jon in the earlier cloud session (restated 2026-09-26). Treat everything here as decided unless Jon says otherwise. It applies everywhere: `feature-plan.md`, the mockup source in `canvas/`, the story bible and all drafts.

## Family & world

- **Kids:** Jon's own three (a 7-year-old boy, a 5-year-old boy and a 3-year-old girl) star in his family's test stories. Their names never go in this repo, which is public on GitHub: they live in `private/family.json` (gitignored). Everything committed uses the sample family **Hugh (7), Alfie (5) and Clara (3)**, who sit in exactly the same slots, so a private copy is a straight name swap.
- **"I can…" ladders and reading levels** use thoughtful difficulty ranges. They must work for a Kindergartner and a 2nd grader who like a challenge.
- **Sidekick:** Ember, a fox.
- **Grandparent character:** Grandma Ruth.
- **World naming:** Tolkien-inspired, built from Old English roots (-combe, -wold, -holt, -mere, -ford, -stead). Grounded and old-feeling, never whimsical or Harry Potter-like.
- **Home village:** Candlemere, in the land of the Westering.
- **Season 1 (Brave): "The Last Light of Candlemere".** The village's lights are going out. The kids (Hugh, Alfie and Clara in the sample family) and Ember carry the last flame across the Westering to relight the old beacon.
- **Later seasons (draft):** 2 Kind & Fair "The Broken Bridge", 3 Wise "The Silent Library", 4 Steady "The Long Winter".
- **The lantern** is the story object and the brand motif: the logo, and one lantern lit per night read.

## Product

- **Name:** Grit & Grace. Trademark risk: "GRIT AND GRACE" is registered to Westminster School (educational materials). Jon checks with a trademark attorney before launch.
- **Pricing:** Free (first 3 chapters, draw every child). Family $49/yr or $5.99/mo; the first 500 "founding families" pay $39/yr. Heirloom $89/yr or $9.99/mo (family story voice + a yearly hardcover). Gift a year.
- **Paywall** after Chapter 3, on a cliffhanger.
- **Content model:** Claude drafts each season from a story bible; Jon reviews it once per season. Nightly personal parts (names, drawn likeness, spotted deeds, idea jar, "something happened today" specials, favorites) are woven in by AI with automatic safety checks, and the parent previews anything personal. Jon never reviews daily stories.
- **Copy** says "reviewed by a person", never "written by people". The FAQ explains AI use honestly.
- **Likeness** comes from a drawn avatar builder. Never photos.
- **Faith-friendly** is a toggle: a weekly verse and Bible stories in the library.
- **Printing is core:** a one-sheet fold-a-book (8 pages), hero trading cards, a weekly fridge card, a staple booklet. Paper nights still light a lantern.
- **Grandparents:** a share message, a large-text read-along page, recorded chapters, gifting.
- **Lanterns** count nights read together, never behavior. No guilt streaks; rest nights show a moon.

## What kids grow: 16 strengths

- **Grit** = Brave (Courage: Brave, Keep Going, Bounce Back, Truth-Teller) + Steady (Temperance: Pause Button, Wait Well, One Thing, Enough).
- **Grace** = Kind & Fair (Justice: Kind, Fair Play, Thankful, Better Together) + Wise (Prudence: Curious, Think It Through, Open Mind, Make Something New).
- One season per family: Brave, Kind & Fair, Wise, Steady. Each strength runs about 3 weeks, then comes back later.
- **The Lantern Loop** (teaching method): meet it in a story (the child is the hero); name it with a phrase and a gesture; ask why instead of stating the moral; make an if-then plan; get spotted with praise for effort (legends, not prizes); then "remember when" callbacks weeks later.

## Story engine: classical Western values (underneath the stories, never preachy)

- **Aristotle:** virtue is a habit and a mean between two failings. Tag every chapter with its virtue and both opposing failings (e.g. Brave: between timid and reckless).
- **Right and wrong are real.** Good acts earn trust and honor, not prizes. Show virtue rewarded, not just vice punished.
- **A classical echo in every chapter:** quietly retell a motif from Homer, Aesop, Scripture (faith toggle on), Arthurian legend, the Stoics or classic fairy tales. Season 1 echoes the Odyssey: the journey there and home again.
- **A mentor who teaches Socratically:** asks questions, never lectures.
- **Tolkien as a guiding influence:** ordinary small folk showing quiet courage, hospitality, loyalty between friends, mercy, and the sudden joyful turn at the darkest moment. Keep it original: no Tolkien names, places or plots.
- **Core values:** duty to family and neighbors, gratitude to those who came before, telling the truth, owning your mistakes, mercy, courage in service of others.
- The machinery lives in the bible and the prompts. The story surface stays warm, fun and modern.
- **"Something happened today" stories** are never retold as they happened. They become an adventure where the kids help others make it right, and nobody is the villain.

## Family voice engine (build now; Jon tests it with his own voice)

- No provider chosen yet. Build a provider-agnostic TTS layer (interface + adapters).
- Start with ElevenLabs voice cloning. Add a self-hosted open-source adapter (e.g. Resemble's Chatterbox) and compare quality and cost on the same chapter. Check current pricing and docs.
- Watch the cost: every family's chapters are personalized, so each one is generated separately. Model the per-family yearly cost against the $89 Heirloom price.
- **Flow (matches the mockup):** the consent statement is read aloud and stored with a timestamp; about 3 minutes of guided reading; the voice is created, then previewed; it's labeled "made from [name]'s recording, with their permission"; the voice owner controls an off switch; delete removes everything.
- **Rules:** adults only, their own voice only, never a child's voice; reads only our chapter text (no free text); no downloads; watermark where the provider supports it; keep the consent record.
- Generate each chapter once and cache it; stream it paragraph by paragraph in the reader.
- Keys live in `.env.local` only, never committed. Build it behind a feature flag, off in production.
- **First milestone:** Jon records the consent statement and samples, Claude creates his voice, and Jon hears Chapter 1 read in it.
- Voiceprints are biometric data under Illinois BIPA and similar laws, so a privacy lawyer reviews this before any public launch.

## Guardrails

- Work on a new branch (`claude/grit-grace-phase0`). Never merge to `main` or change the live site without Jon's OK.
- Production backup: branch `backup/main-2026-09-26`.
- Live 62-screen mockup: https://claude.ai/artifact/VFzzJNTnkhvaLpmZjon3E4. Source in `canvas/`, research in `research/`.

## Next steps, in order

1. Update `feature-plan.md` and the mockup source with all of the above.
2. Write the story bible: the world, the characters, and the rules of the classical engine.
3. Write the Season 1 arc and full drafts of Chapters 1–3 starring Jon's three and Ember (committed with the sample family; Jon's copy is built into `private/`).
4. Build the voice engine prototype so Jon can test it with his own voice.

---

## Working assumptions (Claude's calls, flagged for Jon)

1. **Season structure.** A season is 12 weekly parts of about 5 nightly chapters each (≈60 chapters, about 12 weeks). Each strength gets 3 parts (Brave, Keep Going, Bounce Back, Truth-Teller in Season 1). This is the only shape that fits "a chapter every night, 5 nights a week", "each strength runs about 3 weeks" and "paywall after Chapter 3" at the same time. So "the Season 1 arc (12 chapters)" is written as 12 parts, with every nightly chapter titled. *Why flagged:* the earlier plan said 8–12 chapters per season, and the mockup mixed both ("4 of 12 chapters" next to "Week 6").
2. **Sample family: Hugh (7), Alfie (5) and Clara (3).** The existing storybook art shows an eldest boy with a lantern, a younger boy in glasses, a little girl and a fox, so the sample family fills the same three slots as Jon's kids (eldest boy, middle boy in glasses, youngest girl). The earlier proposal "Wren" became "Alfie" to match the art. "Kit" was rejected because it collides with the "Lantern kit" screen.
3. **Privacy: this repo is public.** Every committed file (mockup source, canon, bible, drafts, plan) uses the sample family. The private mockup artifact shows Jon's kids on the in-app screens; it is built from the committed source by swapping names (`tools/build-private.py` reads `private/family.json`). Marketing screens (row 1: M1–M9) always use the sample family.
4. **Founding price duration** was not stated. Copy says "$39/yr for our first 500 founding families" without promising "for life" or "first year only" until Jon decides.
5. **Story canon first.** The mockup quotes chapter titles, places and story lines, so a short canon sheet (`story/canon.md`: world names, mentor, the Season 1 part-by-part arc and chapter titles) is written in step 1. The bible (step 2) and arc (step 3) build on it.
