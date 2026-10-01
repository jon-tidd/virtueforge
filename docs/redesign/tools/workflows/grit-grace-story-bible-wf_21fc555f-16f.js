export const meta = {
  name: 'grit-grace-story-bible',
  description: 'Write the story bible, the 16-strength spec and the AI prompt kit from the canon; critique, revise, and dry-run the prompts',
  phases: [
    { title: 'Draft', detail: 'bible.md, plus strengths for Grit and Grace in parallel' },
    { title: 'Merge strengths', detail: 'one consistent strengths.md' },
    { title: 'Critique', detail: '3 expert critics' },
    { title: 'Revise', detail: 'apply critique' },
    { title: 'Prompts', detail: 'write prompts.md from the final bible' },
    { title: 'Dry run', detail: 'use the prompts on 4 test tasks, judge the output' },
    { title: 'Tune prompts', detail: 'fix prompts from dry-run findings' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const D = REPO + '/docs/redesign'
const S = D + '/story'
const SP = '/private/tmp/claude-501/-Users-jontidd-code/e9041387-0ea3-4317-b6a1-f7623c477615/scratchpad/wf-bible'

const BASE = `You are writing the story engine for "Grit & Grace": nightly bedtime adventure stories starring a family's own kids (ages 3–9), teaching 16 character strengths rooted in the classical virtues.
Repo: ${REPO} (branch claude/grit-grace-phase0). Never commit, push, merge or switch branches. Never open anything under ${D}/private/ (the repo is public; kids in examples are the sample family Hugh 7, Alfie 5, Clara 3).
Read these first, fully: ${D}/decisions.md (authoritative), ${S}/canon.md (the settled story world, cast, rules and all 60 Season 1 chapters; the bible must agree with it and must not contradict it), ${D}/research/research-findings.md.
Who reads these documents: (1) Claude, drafting each season and doing the nightly personalization, so rules must be precise and testable; (2) Jon, the founder, who reviews each season once, so write in plain English with short sentences and concrete examples. No jargon, no filler, no invented statistics. Where the canon already settles something, restate it briefly and point to the canon section rather than inventing a different version.`

const BIBLE_SPEC = `Write ${S}/bible.md, "Grit & Grace: Story bible". Sections, in order:
1. What this is and how to use it (for drafting a season; for the nightly AI layer; for Jon's once-a-season review). What wins when documents disagree: decisions.md > canon.md > bible.md.
2. The promise: what every chapter must do. Expand the canon's chapter recipe into a checklist a reviewer can tick, with one short good example and one bad example for the trickiest items (the mean made visible; Pause & ask; the reward shown; the last page).
3. Voice and style. The narrator (a warm grandparent's voice, modern and funny on the surface, old underneath). Read-aloud rhythm: sentence length, refrains, sound words, repetition kids join in on. Dialogue rules. Humor rules (Ember's jokes, gentle slapstick, never mocking a child). Word choice for each telling: picture-book telling (about 300–450 words over 8–12 pictures, one or two lines a picture) and chapter-book telling (about 900–1,100 words, about 7 minutes). How to stretch a Kindergartner and a 2nd grader who like a challenge: rich words explained by context (how many per chapter), a harder "why", no talking down. Words and things that never appear (brands, screens and phones, modern slang, sarcasm aimed at kids, weapons used on anyone, romance, bodily harm, death on the page, scary imagery lists). Names and spelling conventions. Show a before-and-after rewrite of one flat paragraph into the house voice.
4. The classical engine in full: Aristotle's mean (how every chapter shows the too-little and too-much gently, with the tag format from the canon); right and wrong are real; virtue rewarded with trust, honor and friendship, not prizes; the classical echo in every chapter (how to echo quietly: a shape, an image, a line, never a lesson about Homer), with a source shelf (Homer's Odyssey and Iliad scenes suitable for small kids, a list of about 25 Aesop fables mapped to strengths, fairy tales, Arthurian legend and Malory, the Stoics (Epictetus, Marcus Aurelius, Seneca, Cicero's lamp), and Scripture (only when the faith toggle is on) with how to handle the toggle); the Socratic mentor rules (Hild: only questions, when she appears, how questions move from mentor to child); Tolkien's influence (ordinary small folk, hospitality, loyalty, mercy, the sudden joyful turn) and the originality rules (no Tolkien names, places or plots; a short list of images to avoid, from the canon); the core values (duty to family and neighbors, gratitude to those who came before, telling the truth, owning mistakes, mercy, courage in service of others) with how each shows up in plot, not speeches.
5. The Lantern Loop in the story: meet it (the child is the hero), name it (the phrase and gesture appear in the chapter), ask why (Pause & ask), plan (if-then, the Tuesday build, Ember's Thursday reminder), spotted (legends open a chapter), remember when (Ember's callbacks weeks later). Exactly where each lands in the weekly rhythm (point to canon section 3).
6. Characters as slots. The product fills the hero slots with each family's own kids: 1 to 4 children, ages 3 to 9, any gender, any look from the avatar builder (glasses, freckles, and so on; also a child who uses a wheelchair or hearing aids, written as capable, with routes and scenes that work for them). How leads rotate with 1, 2, 3 or 4 kids; twins; big age gaps; an only child (Ember and a friend from the story take the sibling beats). What each age band can plausibly do on the page (3–4, 5–6, 7–9) so the youngest's acts are real and possible. Pronouns and names from the family's settings. Then the fixed cast: Ember (full rules from the canon), Hild, the grandparent slot (Grandma Ruth; other family setups from the canon), the parents away on the drove, recurring folk. Never invent real-life facts about the family.
7. The world: Candlemere (a walk through the village: the mere, the Moot Hall, Grandma's cottage, the mill, the bakehouse, the green), the Westering, the Keepers' Way, the calendar (seasons, Beacon Night on the longest night), daily life (food, work, clothes, light, travel), what magic exists (small folk-magic only: tied winds, a talking fox understood by children, fire that knows its family; the fire rules), animals, technology level (pre-industrial, no weapons used on anyone), naming rules (point to the canon). Keep it consistent with canon sections 1–2.
8. The nightly personal layer (AI, with automatic safety checks; the parent previews anything personal; Jon never reviews daily stories). For each kind of personal content, the slot it fills in a chapter, the rules and the length: names and pronouns; drawn-likeness details (only what the avatar builder captured); favorites ("little details"); spotted deeds turned into legends (told true, not bigger; tagged with a strength; opens a chapter; parent approves the exact line); the idea jar (the world-true conversion table from the canon; the page credit line; limits); "remember when" callbacks; the grandparent's real words from a voice note (quoted only as given); "something happened today" specials (never retold as it happened; an adventure where the kids help others make it right; nobody is the villain; the child who did wrong gets the gentle noticing role; set on a market day before the lights went out; the parent previews the whole story). What can never be personalized (real places, schools, other people's names, health, family troubles, anything a child could be teased about).
9. Safety and bedtime rules: restate the canon's bedtime rules and add an automatic safety-check list (what the checker flags: fear level, harm, shaming, identity praise, preaching, stereotypes, unsafe acts a child could copy, fire safety, strangers, water, personal data) with pass/fail examples.
10. Faith toggle: a weekly verse (the canon's four for Season 1) and Bible stories in the library; Scripture echoes only when on; tone (reverent, simple, never preachy); what the story looks like with the toggle off (no gaps).
11. Making a season: the production steps (outline → parts → 60 chapters in both tellings → Pause & ask, missions, last pages, trials, fridge card and booklet text → review packet), the review packet Jon gets (what to read in full, what to skim, a checklist, how to leave notes), and how a season is versioned and locked.
12. Glossary of story terms (part, chapter, telling, slot, legend, idea jar, remember when, Saturday trial, the Carrying, the Keepers' Way, banking words, lantern breath, and so on).
Aim for about 9,000–12,000 words. Tables where they help.`

const STRENGTH_SPEC = (half, fams) => `Write the ${half} half of the 16-strength spec as Markdown to ${SP}/strengths-${half.toLowerCase()}.md (create the folder). Cover these strength families and their strengths: ${fams}.
For EACH of the strengths, a section with:
- Kid name, grown-up name, one-line kid definition (use the existing lines from the mockup's Strengths screen, ${D}/canvas/project/Strengths.dc.html, where they fit).
- The golden mean: the two failings it sits between, in kid words and grown-up words, and the exact chapter tag format "Name · between X and Y". For the four Season 1 strengths (Brave, Keep Going, Bounce Back, Truth-Teller) COPY the canon's pairs, phrases and gestures exactly.
- The phrase and the gesture kids learn (short, sayable by a 3-year-old, doable sitting in bed).
- Three modeled behaviors a child can copy tomorrow.
- The "I can…" ladder: Little (about 3–4), Middle (about 5–6, must stretch a Kindergartner who likes a challenge), Big (about 7–9, must stretch a 2nd grader who likes a challenge), Stretch; each rung with what a parent can actually see. For Season 1 strengths copy the canon's ladders exactly.
- An if-then plan example for each level.
- Classical echoes: 2–3 Aesop fables or fairy tales, 1 Stoic or Aristotle line (accurately attributed, with the work), 1 Arthurian or Homeric moment, and a Scripture story and verse for the faith toggle (quote accurately, give the reference).
- 2–3 real children's books that pair well (real titles and authors only; if unsure a book exists, leave it out).
- What it can be confused with, and a note on where it sits in the seasons (Season 1 Brave, 2 Kind & Fair, 3 Wise, 4 Steady; about 3 weeks each).
Check every quotation and attribution; if you are not sure of an exact quote, paraphrase and say so.`

const ISSUES = {
  type: 'object',
  properties: { issues: { type: 'array', items: { type: 'object', properties: {
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    file: { type: 'string' }, location: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
  }, required: ['severity', 'file', 'location', 'problem', 'fix'] } } },
  required: ['issues'],
}

phase('Draft')
await parallel([
  () => agent(`${BASE}\n\n${BIBLE_SPEC}\n\nReturn a 5-line summary.`, { label: 'draft:bible', phase: 'Draft', effort: 'high' }),
  () => agent(`${BASE}\n\n${STRENGTH_SPEC('Grit', 'Brave (Courage): Brave, Keep Going, Bounce Back, Truth-Teller; Steady (Temperance): Pause Button, Wait Well, One Thing, Enough')}\n\nReturn a 3-line summary.`, { label: 'draft:strengths-grit', phase: 'Draft', effort: 'high' }),
  () => agent(`${BASE}\n\n${STRENGTH_SPEC('Grace', 'Kind & Fair (Justice): Kind, Fair Play, Thankful, Better Together; Wise (Prudence): Curious, Think It Through, Open Mind, Make Something New')}\n\nReturn a 3-line summary.`, { label: 'draft:strengths-grace', phase: 'Draft', effort: 'high' }),
])

phase('Merge strengths')
await agent(`${BASE}\n\nMerge ${SP}/strengths-grit.md and ${SP}/strengths-grace.md into ONE document, ${S}/strengths.md, "Grit & Grace: The 16 strengths". Open with a one-screen overview table (all 16: family, kid name, grown-up name, golden-mean pair, phrase, gesture, season). Then Grit (Brave, Steady) and Grace (Kind & Fair, Wise), each strength in the same section format. Harmonize style, rung names and formats so both halves read as one. Make sure the Season 1 strengths match ${S}/canon.md exactly, and that no two strengths share a phrase or gesture. The Kind pair should replace the canon's working pair "between cold and pushy" only if yours is clearly better; say which you chose. Return a 3-line summary.`, { label: 'merge-strengths', phase: 'Merge strengths', effort: 'high' })

phase('Critique')
const CRITICS = [
  `LENS: early literacy and child development. Reading levels and the two tellings; whether the stretch for a Kindergartner and a 2nd grader is real; dialogic reading and Pause & ask quality; whether the "I can…" rungs are observable and age-true (3–4, 5–6, 7–9); sibling dynamics; bedtime arousal and fear; praise and reward rules (effort, not identity; recognition, not prizes); inclusion of kids with disabilities.`,
  `LENS: classical education and accuracy. Aristotle's mean stated correctly (and where a strength doesn't map neatly, is that handled honestly?); every quotation and attribution (Aristotle, Cicero, Epictetus, Marcus Aurelius, Seneca, Aesop, Malory, Homer book numbers, Scripture references) is accurate; fables mapped to the right strength; the Socratic mentor rules; Tolkien influence without borrowing; right and wrong are real without preaching; the faith toggle is respectful and optional.`,
  `LENS: product, safety and the AI layer. Are the rules precise enough that another model could follow them and a checker could test them? Is the nightly personal layer safe (privacy, no invented real-life facts, parent previews), and does every personal-content type have a slot, a length and a rule? Is the safety-check list complete (fear, harm, shame, stereotypes, copyable unsafe acts, fire, water, strangers, personal data)? Does everything agree with decisions.md and canon.md (names, ranks, season shape, pricing mentions, Ember she/her, Grandma slot, parents on the drove)? Is the season production and review process realistic for one founder reviewing once a season?`,
]
const crits = await parallel(CRITICS.map((c, i) => () => agent(`${BASE}\n\n${c}\n\nCritique ${S}/bible.md and ${S}/strengths.md. Report only real problems with concrete fixes. Do not edit.`, { label: `critic:${i + 1}`, phase: 'Critique', schema: ISSUES, effort: 'high' })))
const issues = crits.filter(Boolean).flatMap(c => c.issues)
log(`Critique: ${issues.length} issues, ${issues.filter(i => i.severity !== 'low').length} high/medium`)

phase('Revise')
const bibleIssues = issues.filter(i => /bible/i.test(i.file))
const strengthIssues = issues.filter(i => !/bible/i.test(i.file))
await parallel([
  () => agent(`${BASE}\n\nRevise ${S}/bible.md in place to fix these issues (all high and medium; low where clearly better). Keep it consistent with canon.md and strengths.md.\nIssues (JSON): ${JSON.stringify(bibleIssues, null, 1)}\nReturn what you changed and anything you deliberately left.`, { label: 'revise:bible', phase: 'Revise', effort: 'high' }),
  () => agent(`${BASE}\n\nRevise ${S}/strengths.md in place to fix these issues (all high and medium; low where clearly better). Keep Season 1 strengths identical to canon.md.\nIssues (JSON): ${JSON.stringify(strengthIssues, null, 1)}\nReturn what you changed and anything you deliberately left.`, { label: 'revise:strengths', phase: 'Revise', effort: 'high' }),
])

phase('Prompts')
const PROMPTS_SPEC = `Write ${S}/prompts.md, "Grit & Grace: Prompt kit". These are the prompts the product will send to Claude. The machinery lives here and in the bible; the story surface stays warm and modern. Each prompt is a copy-ready block with clearly marked {{variables}}, a short note on when it runs, its inputs and outputs (give an output JSON shape where the app needs structure), and its length limits. Prompts must reference the bible's rules by restating the essential ones inline (the model won't see the whole bible every night; say which bible sections to include as context for season drafting).
Prompts:
1. Season drafting (system prompt + per-part and per-chapter prompts): produce both tellings, the virtue tag, classical echo, Pause & ask, last page (who they were tonight, missions per child, tell-it-back, the hook), picture-book pages with an image description per picture.
2. Nightly personalization: take a canon chapter with slot markers and the family profile; fill names, pronouns, likeness details, favorites; keep length; output the personalized text plus a list of every change.
3. Legend from a spotted deed: from the parent's note (text or transcribed voice) produce one legend line "In the village of Candlemere they still tell of…", true not bigger, strength tag, and a plain-language version for the parent to approve.
4. Idea jar: convert a child's idea into a world-true side scene for Wednesday's chapter using the conversion table, with the credit line; never change the main road.
5. Remember when: pick and write Ember's callback from the family's story history and Hall of Deeds.
6. "Something happened today" special: from the parent's sentence, a complete special story (both tellings) following every special-story rule, plus a parent-facing summary of how the real event was transformed.
7. Illustration prompt: from the character sheets (drawn avatar choices only) and a scene description, an image prompt that keeps each child's likeness consistent; the style lock; things never drawn.
8. Safety check (a separate pass that runs on every generated piece): outputs pass/fail per rule with reasons, and a severity; anything failing is regenerated or held for the parent.
9. The weekly paper pieces: fridge card text, booklet text layout, Saturday trial card, talk cards.
Each prompt must forbid real-life facts not given, keep the sample-family-agnostic slots, and follow the faith toggle.`
await agent(`${BASE}\n\nAlso read the final ${S}/bible.md and ${S}/strengths.md.\n\n${PROMPTS_SPEC}\n\nReturn a 5-line summary.`, { label: 'write:prompts', phase: 'Prompts', effort: 'high' })

phase('Dry run')
const TESTS = [
  { key: 'legend', task: 'Use prompt 3 (legend) on this parent note: "Alfie gave his last cookie to Clara when she dropped hers, and didn\'t make a fuss about it." Then run prompt 8 (safety check) on your output.' },
  { key: 'ideajar', task: 'Use prompt 4 (idea jar) for Chapter 13 "Only Their Backs" (see canon) with Clara\'s idea: "a unicorn that is scared of sheep". Write the side scene exactly as it would appear in the chapter-book telling. Then run prompt 8.' },
  { key: 'special', task: 'Use prompt 6 ("something happened today") on this parent sentence: "Hugh lied about brushing his teeth and then got upset when I found out." Produce the full special story in the chapter-book telling and the picture-book telling, plus the parent summary. Then run prompt 8.' },
  { key: 'personalize', task: 'Use prompt 2 (nightly personalization) on the canon\'s sample page for Chapter 1 (canon section 8, "Chapter 1 and the free sample chapter") for a DIFFERENT family: an only child, Maya, 6, she/her, glasses and two puffs of curly black hair, loves otters; grandparent "Grandpa Joe"; faith toggle off. Then run prompt 8.' },
]
const runs = await parallel(TESTS.map(t => () => agent(`${BASE}\n\nRead ${S}/prompts.md, ${S}/bible.md and ${S}/canon.md. Act exactly as the product would: follow the prompt text literally, as a model receiving only that prompt and its stated context would. ${t.task}\nWrite your full output to ${SP}/dryrun-${t.key}.md. Then, separately, list every place where the prompt was ambiguous, missing a rule, or pushed you toward a worse result. Return that list.`, { label: `dryrun:${t.key}`, phase: 'Dry run', effort: 'high' })))
const judged = await parallel(TESTS.map((t, i) => () => agent(`${BASE}\n\nJudge a dry run of the Grit & Grace prompt kit. The task was: ${t.task}\nThe output is in ${SP}/dryrun-${t.key}.md. The runner's notes on the prompt: ${String(runs[i]).slice(0, 3000)}\nJudge the output against ${S}/bible.md and ${S}/canon.md (voice, bedtime safety, the classical engine, the personal-layer rules, privacy, length). Then say what in ${S}/prompts.md should change so the next output is better. Do not edit files.`, { label: `judge:${t.key}`, phase: 'Dry run', schema: ISSUES })))
const promptIssues = judged.filter(Boolean).flatMap(j => j.issues)
log(`Dry run: ${promptIssues.length} prompt issues`)

phase('Tune prompts')
await agent(`${BASE}\n\nImprove ${S}/prompts.md in place based on these dry-run findings (fix all high and medium). Keep prompts copy-ready. If a finding shows a gap in bible.md, fix bible.md too, minimally.\nFindings (JSON): ${JSON.stringify(promptIssues, null, 1)}\nAlso add a short final section "Dry-run results" to prompts.md: the four tests, what went well, what was changed. Return what you changed.`, { label: 'tune-prompts', phase: 'Tune prompts', effort: 'high' })

return { critiqueIssues: issues.length, promptIssues: promptIssues.length }
