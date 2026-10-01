# Handoff: Grit & Grace, Phase 0

Written 1 October 2026 on Jon's Mac mini, which kept crashing. The work moves to Jon's MacBook. Everything worth keeping is committed on branch `claude/grit-grace-phase0` and pushed. Nothing was merged to `main`, and the live site is unchanged.

## The goal

Grit & Grace is the redesign of Virtue Forge: nightly bedtime adventures starring a family's own kids, teaching 16 strengths rooted in the classical virtues. Phase 0 is four steps, in Jon's order:

1. Update `feature-plan.md` and the mockup with the settled decisions.
2. Write the story bible: the world, the characters, the rules of the classical engine.
3. Write the Season 1 arc and full drafts of Chapters 1–3.
4. Build the family-voice prototype so Jon can hear Chapter 1 in his own voice.

**Read first, in this order:** `docs/redesign/decisions.md` (authoritative), `docs/redesign/story/canon.md`, then this file.

## Rules that never bend

- Work on `claude/grit-grace-phase0`. Never merge to `main` or change the live site without Jon's OK. The production backup is branch `backup/main-2026-09-26`.
- **This repo is public.** Jon's children's real names never go in it. Committed files use the sample family: Hugh (7), Alfie (5), Clara (3). Real names live only in `docs/redesign/private/` (gitignored). Before every commit, search the staged files for the real names.
- Keys live only in `.env.local`. The voice lab is off in production.

## What's done

| Step | State | Where |
|---|---|---|
| Decisions and working assumptions | Done | `docs/redesign/decisions.md` |
| Story canon (world, cast, all 60 Season 1 chapters, mockup mapping) | Done | `docs/redesign/story/canon.md` |
| Product plan rewritten | Done | `docs/redesign/feature-plan.md` |
| Mockup: all 63 screens moved to the canon and decisions | Done, published as version 13 | Source: `docs/redesign/canvas/project/`. Live: https://claude.ai/artifact/VFzzJNTnkhvaLpmZjon3E4 (in-app screens show Jon's kids; the repo copy shows the sample family) |
| Story bible, the 16 strengths, the prompt kit | Done | `docs/redesign/story/bible.md`, `strengths.md`, `prompts.md` |
| Voice provider research and cost model | Done | `docs/redesign/voice/provider-research.md` |
| Voice prototype (ElevenLabs, Chatterbox, mock; behind a flag) | Done: 158 tests pass, typecheck and build pass | `lib/voice/`, `app/api/voice/`, `app/voice-lab/`, `components/voice-lab/`, `scripts/`. Guide: `docs/redesign/voice/README.md`. Design: `docs/redesign/voice/engine-design.md` |
| Season 1 arc: 12 part sheets | Done | `docs/redesign/story/season-1/arc.md`, `parts/` |
| Chapters 1–3 (source, variant blocks, pictures, rendered) | Drafted, judged, checked and revised once. All three pass the code checker (0 fails) | `docs/redesign/story/season-1/source/`, `s1-ch01.md` to `s1-ch03.md` |
| Chapter tools | Done | `docs/redesign/tools/render-chapter.py`, `check-chapter.py` |

## What was in the middle

Step 3's last three pieces. The workflow that ran them is saved at `docs/redesign/tools/workflows/grit-grace-season1-drafts-wf_c9ce36e5-758.js` (its run can't be resumed on another machine; use it as the recipe).

1. **Continuity pass over Chapters 1–3.** Each chapter was revised on its own against the safety check and two critics (`docs/redesign/story/season-1/review-issues.json`, 77 findings). The pass that re-reads all three as one story had not run. It should: confirm each chapter's last paragraph flows into the next, facts and names agree, rich words come back within Part 1, the clue and Vote 1 carry through, then re-render and re-check. It should also decide whether `season-1/outline.json` is used by the tools or removed.
2. **Test families.** Render Chapter 1 for three very different families (an only child who is a girl of 6 with glasses, a grandfather, no parents set; three children with a girl as eldest; two children, one parent, no grandparent set) into `season-1/test-families/`, run the checker, and fix whatever the slot system gets wrong.
3. **Review packet for Jon:** `docs/redesign/story/season-1/README.md` (what to read, a checklist, where the classical engine shows per chapter, the open questions, how to leave notes).

## Next steps, in order

1. Finish the three items above. Commit.
2. Render Jon's private copy of Chapters 1–3 into `docs/redesign/private/season-1/` with `private/family-profile.json` (see "Mac-only files"). Never commit it.
3. First voice milestone, with Jon: follow `docs/redesign/voice/README.md`. He needs an ElevenLabs Starter account and key in `.env.local`, with `STORY_CONTENT_DIR=docs/redesign/private/season-1` so the lab reads the real Chapter 1. He records the consent statement and about 3 minutes of reading, the voice is made, and he hears Chapter 1. Optional: a fal.ai key to compare Chatterbox.
4. Update `docs/redesign/voice/README.md` where it says the real Chapter 1 doesn't exist yet.
5. Bring Jon the open decisions below.
6. Later: the remaining 57 chapters of Season 1 via the prompt kit, and the MVP build.

## Open decisions for Jon

- **Season shape:** 12 weekly parts of 5 nightly chapters (60 a season) is Claude's working assumption. Confirm.
- **Parents away:** in Season 1 the children stay with Grandma while Mom and Dad are "away on the winter drove", home for the final feast. Confirm, or ask for another setup.
- **Founding price:** $39/yr for the first 500 families, for how long?
- **Real English place names** (Wardlow, Ashcombe, Honeybourne and others) and the mentor's name Hild (fallback: Wynn). Keep?
- **Family pet** as a second companion beside Ember. Confirm.
- **Hardcover:** one per season, family picks which. Confirm.
- **Voice:** ElevenLabs' terms bar products aimed at under-13s and reselling on lower plans; real families need a written OK or Enterprise deal. Illinois BIPA needs a signed release from each speaker. Self-hosted Chatterbox costs about $0.07 a chapter against about $0.58 on ElevenLabs.
- **Trademark:** "GRIT AND GRACE" is registered to Westminster School for educational materials. Attorney check before launch.
- More: `feature-plan.md` section 12, `bible.md` section 11, `prompts.md` section 15.

## Commands

```bash
# setup on a new machine
git clone https://github.com/jon-tidd/virtueforge.git virtueforge-redesign
cd virtueforge-redesign && git checkout claude/grit-grace-phase0
npm install

# app checks
npx tsc --noEmit
npx vitest run
npm run build
npm run lint            # 8 old errors in non-voice files are known and out of scope

# voice lab (after creating .env.local per docs/redesign/voice/README.md)
npm run dev             # then open http://localhost:3000/voice-lab
node scripts/voice-cost.mjs

# mockup screens: markup, sizes, stale content
python3 docs/redesign/tools/check-dc.py

# build the private mockup copy (real names on in-app screens), then publish it to the artifact
python3 docs/redesign/tools/build-private.py mockup <scratch-folder>

# render and check a chapter (N = 1, 2, 3)
S=docs/redesign/story
python3 docs/redesign/tools/render-chapter.py $S/season-1/source/s1-ch0N.json \
  --blocks $S/season-1/source/s1-ch0N.blocks.json \
  --pictures $S/season-1/source/s1-ch0N.pictures.json \
  --family $S/sample-family.json -o $S/season-1/s1-ch0N.md
python3 docs/redesign/tools/check-chapter.py $S/season-1/source/s1-ch0N.json \
  --blocks $S/season-1/source/s1-ch0N.blocks.json \
  --pictures $S/season-1/source/s1-ch0N.pictures.json \
  --md $S/season-1/s1-ch0N.md --family $S/sample-family.json

# private render for Jon's family: same render command with
#   --family docs/redesign/private/family-profile.json -o docs/redesign/private/season-1/s1-ch0N.md

# before any commit: no real names staged
git grep --cached -nwE "<real names>" -- . ':!docs/redesign/private'
```

## Files that exist only on the Mac mini

These are not in git on purpose. Copy them by AirDrop or a USB stick, never through the repo.

| Path | Size | What it is |
|---|---|---|
| `docs/redesign/private/family.json` | 590 bytes | Jon's kids' real names mapped to the sample-family slots. Needed by `build-private.py` and the voice lab (`VOICE_FAMILY_FILE`). |
| `docs/redesign/private/family-profile.json` | 2,690 bytes | Jon's family in the prompt kit's FAMILY format, for `render-chapter.py`. Looks and favorites are blank on purpose. |
| `~/.claude/projects/-Users-jontidd-code/memory/grit-grace-redesign.md` | 1,252 bytes | Claude's memory note for this project. Optional: this file covers it. |
| `~/.claude/projects/-Users-jontidd-code/memory/public-repo-kids-names.md` | 978 bytes | Claude's memory note on the names rule. Optional: this file covers it. |

There is no `.env.local` and no `.voice-data/` on the Mac mini: no keys were ever set and no voice was recorded. Both private JSON files can be rebuilt by hand in a minute if they are lost (the shapes are in `docs/redesign/tools/build-private.py` and `docs/redesign/story/sample-family.json`).
