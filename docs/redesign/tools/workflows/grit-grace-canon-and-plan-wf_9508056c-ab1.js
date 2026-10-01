export const meta = {
  name: 'grit-grace-canon-and-plan',
  description: 'Draft the Season 1 story canon via a judged panel, and rewrite feature-plan.md to match the settled decisions',
  phases: [
    { title: 'Propose canon', detail: '3 canon proposals from different lenses' },
    { title: 'Judge', detail: '3 judges score all proposals' },
    { title: 'Synthesize', detail: 'Write story/canon.md from the winner plus grafts' },
    { title: 'Critique canon', detail: '3 critics, then one revision' },
    { title: 'Rewrite plan', detail: 'Rewrite feature-plan.md' },
    { title: 'Verify plan', detail: '2 verifiers, then fix' },
    { title: 'Cross-check', detail: 'Align plan with the final canon' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const D = REPO + '/docs/redesign'
const SP = '/private/tmp/claude-501/-Users-jontidd-code/e9041387-0ea3-4317-b6a1-f7623c477615/scratchpad/wf1'
const CANON = D + '/story/canon.md'

const BASE = `You are helping build "Grit & Grace": nightly bedtime adventure stories starring a family's own kids (ages 3–9), teaching 16 character strengths rooted in the classical virtues.
Repo: ${REPO} (branch claude/grit-grace-phase0). Never commit, push, merge or switch branches.
AUTHORITATIVE decisions: ${D}/decisions.md. Read it fully first. It overrides everything else, including the older ${D}/feature-plan.md and the mockup.
Research: ${D}/research/research-findings.md (condensed) and ${D}/research/full-research-report.md.
Product mockup (62 phone screens as HTML): ${D}/canvas/project/*.dc.html, with the canvas index and "why" notes in ${D}/canvas/project/canvas.json.
PRIVACY RULE: never open anything under ${D}/private/. The repo is public. Use only the sample family names Hugh, Alfie and Clara for the kids.
Writing style for everything you produce: plain, warm, concrete English. Short sentences. No jargon, no filler, no invented statistics.`

const FAMILY = `The three heroes (sample family; the storybook art already shows them):
- Hugh, 7, eldest boy. In the art he holds up the lantern, wears a green hooded cloak, messy auburn curls. Reads at a 2nd-grade level and likes a challenge.
- Alfie, 5, middle boy with round glasses, blond, a small backpack. A Kindergartner who likes a challenge.
- Clara, 3, youngest girl, curly blond hair, a red bow, a cream pinafore.
- Ember, a red fox, is their sidekick (the fox in the art).
- Grandma Ruth is the grandparent character in the app.
In the product, each family's own kids fill these slots, so the kids are ordinary children, not chosen ones, and the story must work because of what they choose to do.`

const CANON_SPEC = `Write a "canon sheet" for the story world and Season 1. It has these sections, in this order:

1. CAST
- Hugh, Alfie, Clara: for each, personality (2 lines), what they're good at, one real age-true struggle, and how each of the four Season 1 strengths looks at their age.
- Ember the fox: pick ONE pronoun; voice and manner; what Ember can and can't do (decide whether Ember talks); Ember's gift: always finds the way home and remembers everything, which is the story's device for "remember when" callbacks weeks later. Ember is a sidekick, never the hero; the humans solve the problems.
- The mentor, who teaches Socratically: name (Old English roots), who they are, how they teach (only questions, never lectures; give 3 sample questions), when they appear. The kids must also act without them.
- Grandma Ruth: she is the real-world grandparent in the app (reads along, records chapters, gets share messages). Decide whether and how she can appear in the story, given every family has its own grandparents.
- At most 5 other recurring folk: name, role, one line each.
- What is dimming the lights of Candlemere: important, mysterious, but never terrifying at bedtime for a 3-year-old. No purely evil villain; if there is an antagonist, mercy toward them must be possible (Tolkien's mercy). Explain why the lights are failing and why relighting the old beacon fixes it.

2. THE WORLD
- Candlemere (the village), the Westering (the land), and the old beacon (name its hill or place). A short paragraph on how the world feels: grounded, old, cozy (hearths, hedgerows, mill streams, fells, fens, old roads).
- A gazetteer of 12–16 named places for Season 1: name, Old English root(s) and meaning, one-line description. Names must be easy for a 5-year-old to say, grounded and old-feeling like real English place names (-combe, -wold, -holt, -mere, -ford, -stead, -ley, -ton, -bury, -den, -fell), never whimsical, never Harry Potter-like, and never a Tolkien name or near-copy (no Bree, Bywater, Hobbiton, Rivendell, Weathertop, Shire-style echoes).
- Naming rules for future seasons: useful roots with meanings, and what to avoid.
- Do not make a bridge a Season 1 set piece or title: Season 2 is "The Broken Bridge".

3. SEASON SHAPE
- Season 1 = 12 parts (one per week) x 5 nightly chapters = 60 chapters. Each chapter is about 7 minutes read aloud (about 900–1,100 words in the chapter-book layout; a shorter picture-book telling for little ones).
- Parts 1–3 = Brave, 4–6 = Keep Going, 7–9 = Bounce Back, 10–12 = Truth-Teller.
- For each of the four strengths: the golden mean (the two failings it sits between, in kid words and grown-up words, e.g. Brave: between timid and reckless); the phrase and the gesture kids learn; one modeled behavior per part that a child can copy tomorrow.
- The weekly rhythm: which night carries the "choose the path" vote, where the idea-jar slot goes, where a "remember when" callback goes, the Saturday trial (a real-world challenge each part, pitched per child's level), and rest nights (the story waits; nothing breaks).

4. THE SEASON 1 ARC ("The Last Light of Candlemere")
- One paragraph on the overall shape: the journey there and home again (the Odyssey echo), the darkest moment and the sudden joyful turn (eucatastrophe), the homecoming.
- A table of the 12 parts: number, title, place, strength, Odyssey echo (which episode, retold quietly for small children), one other classical echo (Aesop, Arthurian legend, the Stoics, classic fairy tales; Scripture only when marked "faith toggle"), a 2–3 sentence summary, the modeled behavior.
- All 60 chapters: number, title, one-line beat, which child leads (share the lead fairly; the 3-year-old gets real, small, meaningful acts), classical echo tag, and the virtue tag with both failings (e.g. "Brave · between timid and reckless"). Chapter 1 must hook in the first minute. Chapter 3 ends on the strongest cliffhanger of the opening, because that's where the free chapters end. Mark the idea-jar slots and the choose-the-path votes.
- Rules that hold everywhere: virtue is shown rewarded (trust, honor, friendship), not just vice punished; no preaching; ordinary small folk showing quiet courage, hospitality, loyalty, mercy; gratitude to those who came before; owning mistakes. Original: no Tolkien names, places or plots.

5. "I CAN…" LADDERS for the four Season 1 strengths at three levels: Little (about 3–4), Middle (about 5–6, must stretch a Kindergartner who likes a challenge), Big (about 7–9, must stretch a 2nd grader who likes a challenge), plus one "stretch" rung above Big. Every rung is a concrete behavior a parent can actually see.

6. SEASONS 2–4: one paragraph each for "The Broken Bridge" (Kind & Fair), "The Silent Library" (Wise) and "The Long Winter" (Steady): premise, how it connects to Candlemere and Season 1, the finale image. Plus a one-line Season 2 teaser for the Season 1 finale screen.

7. HERO RANKS: rename the old ranks "Apprentice → Lantern-Bearer → Knight of the Road" (earned by nights read together, never by behavior) to fit this world. 3–5 ranks.

8. MOCKUP MAPPING. The product mockup shows story content from mid-season ("Week 6"). Give exact replacement content, consistent with everything above:
- Series "The Lantern Road" → "The Last Light of Candlemere". Village "Brindlewick" → "Candlemere". Sidekick "Pip" → "Ember".
- Story-map stops (the 12 parts' places), which are done by week 6, and the finale stop (replaces "The Lighthouse").
- Chapter 1 title (replaces "The Lantern in the Attic") and its first 3–4 sentences for the free sample-chapter page.
- "Tonight" = chapter 28 (the 3rd chapter of part 6, a Wednesday): its title, and a one-line "Last time…" recap (replaces "The Creaking Bridge" and "Pip was hurt, a storm was coming, and the only way home was across the ravine…").
- The five chapter titles of part 6 (Mon–Fri) replacing "The Creaking Bridge / The Dragon Who Was Afraid of the Dark / Lanterns in the Fog / The Keeper's Riddle / Home by Starlight", and part 6's Saturday trial (replaces "The Lantern Quest").
- The idea-jar chapter: the mockup shows the youngest child's idea, "a dragon who's scared of the dark". Keep a kid-style idea but ground it in the world's tone (for example a small, scared wyrm of the fells), credited to Clara. Give its title and one opening sentence (replaces "Deep in the Hollow, something was crying. Not roaring. Crying.").
- Tonight's "choose the path" vote: two options, one line each (replaces the cave vs the lighthouse).
- Tonight's "remember when" callback: Ember brings back one child's brave moment from part 2.
- Three legends (real deeds a parent spotted, told as legends), including a version of: "In the village of Candlemere they still tell of Hugh of the Lantern, who spoke the truth before anyone asked, even when it was hard to say."
- Ember's hero trading card: special power, and what Ember says.
- Season finale screen: "You made it to …", a two-sentence recap, and the Season 2 teaser line.
- The Season 1 hardcover title.
- The voice-capture sample line (one warm sentence set in Candlemere with Ember) and a voice-preview line.
- The "something happened today" example: two siblings fought over the red crayon and one said something mean. The mockup's special story is "The Last Red Feather" (two hedgehogs, Burr and Bramble, grab the last red feather at the market). Keep or improve it, set it in Candlemere's market; nobody is the villain; the kids help others make it right.
- Every other old name in the mockup → its replacement or "drop": "Dragon's Hollow", "Whispering Wood", "the Hollow", "The First Dark Village", "Pip and the Thornbush", "The Keeper's Riddle", "Lanterns in the Fog", "Home by Starlight", "The Tide Keepers" (old Season 2), "Knight of the Road".

Format: Markdown, tables where they help. Aim for completeness over length; no padding.`

const LENSES = [
  { key: 'mythic', text: `YOUR LENS: the mythic spine. Build the season like a small Odyssey told by a grandparent who loves Tolkien: the call, the road, hospitality tests (good hosts and bad hosts), a temptation to forget home (the lotus), cleverness against strength (the Cyclops), winds let loose by a careless moment (Aeolus), the long way home, the darkest hour and the sudden joyful turn, the homecoming. Every part carries a clear Odyssey echo retold for small children.` },
  { key: 'delight', text: `YOUR LENS: bedtime delight. Make a 3-, 5- and 7-year-old beg for "one more chapter" and still fall asleep: cozy danger, funny moments, Ember's personality, set pieces kids retell at breakfast, small mysteries, cliffhangers that are exciting but not scary. Each sibling gets moments where they are the hero at their own level; the 3-year-old's moments are real, not token.` },
  { key: 'teaching', text: `YOUR LENS: the teaching engine. Every chapter teaches one strength by showing it rewarded (never by preaching), with one modeled behavior a child can copy tomorrow, a "why do you think…?" question, and the Aristotle mean made visible (the too-little and too-much versions shown by characters, gently). Wire in the product: idea jar, choose the path, "remember when" callbacks, spotted legends, Saturday trials, and the chapter-3 cliffhanger where the free chapters end.` },
]

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    scores: { type: 'array', items: { type: 'object', properties: {
      proposal: { type: 'string', description: 'mythic | delight | teaching' },
      total: { type: 'number', description: 'score out of 100 using the rubric' },
      strengths: { type: 'array', items: { type: 'string' } },
      weaknesses: { type: 'array', items: { type: 'string' } },
    }, required: ['proposal', 'total', 'strengths', 'weaknesses'] } },
    winner: { type: 'string' },
    grafts: { type: 'array', items: { type: 'string' }, description: 'Specific elements from non-winning proposals worth grafting into the winner, each naming the source proposal' },
    must_fix: { type: 'array', items: { type: 'string' }, description: 'Problems the final canon must fix regardless of source' },
  },
  required: ['scores', 'winner', 'grafts', 'must_fix'],
}

const ISSUES_SCHEMA = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['high', 'medium', 'low'] },
      location: { type: 'string' },
      problem: { type: 'string' },
      fix: { type: 'string' },
    }, required: ['severity', 'location', 'problem', 'fix'] } },
  },
  required: ['issues'],
}

const RUBRIC = `Rubric (score each proposal out of 100): originality, and freedom from Tolkien names, places and plots (15); naming quality: Old English roots, grounded, old-feeling, easy to say, not whimsical (10); kid appeal and bedtime safety for ages 3, 5 and 7 (15); each sibling's real agency at their level (10); teaching fit: one strength per part, golden mean, modeled behavior, virtue rewarded, no preaching (15); classical depth: an Odyssey echo per part, other echoes, a Socratic mentor, hospitality, mercy, eucatastrophe (15); serial pull: mystery, cliffhangers, the chapter-3 hook (10); completeness and usability of the mockup mapping, and internal consistency (10).`

// ---------- Canon chain ----------
async function canonChain() {
  phase('Propose canon')
  const proposals = await parallel(LENSES.map(l => () => agent(
    `${BASE}\n\n${FAMILY}\n\n${l.text}\n\n${CANON_SPEC}\n\nBefore writing, read decisions.md and look at these mockup screens to see what story content the product surfaces: Tonight, StoryMap, SundayPlan, ReaderChapter, ReaderPicture, ChoosePath, LastPage, KidsIdea, SpottedIt, LegendApprove, RememberWhen, HeroCards, SeasonFinale, SampleChapter, SpecialPreview, IfThen, StrengthDetail, SaturdayTrial, FridgeCard (all under ${D}/canvas/project/, as .dc.html).\n\nWrite your COMPLETE proposal as Markdown to ${SP}/proposal-${l.key}.md (create the folder if needed). Cover every section, even the ones outside your lens. Return only a 5-line summary: the mentor, what dims the lights, the beacon's place, the 12 part titles, and Ember's pronoun.`,
    { label: `propose:${l.key}`, phase: 'Propose canon', effort: 'high' })))
  log('Canon proposals written: ' + proposals.filter(Boolean).length + '/3')

  phase('Judge')
  const JUDGE_LENSES = [
    'You judge as a children\'s book editor who loves Tolkien and the Odyssey: story quality, originality, naming, serial pull.',
    'You judge as a child-development specialist and a parent of a 3-, 5- and 7-year-old: bedtime safety, age fit, sibling agency, whether the teaching would actually change behavior (research: virtue rewarded beats vice punished; asking why beats telling; one modeled behavior; the Aristotle mean).',
    'You judge as the product lead: fit with every item in decisions.md, the 12-part x 5-chapter structure, the four strengths in order, the chapter-3 paywall cliffhanger, and how complete and usable the mockup mapping (section 8) is.',
  ]
  const judgments = await parallel(JUDGE_LENSES.map((jl, i) => () => agent(
    `${BASE}\n\n${jl}\n\nRead decisions.md, then read all three canon proposals: ${SP}/proposal-mythic.md, ${SP}/proposal-delight.md, ${SP}/proposal-teaching.md.\n\n${RUBRIC}\n\nPick a winner. List specific grafts from the other two (name the source) and the must-fix problems. Be concrete.`,
    { label: `judge:${i + 1}`, phase: 'Judge', schema: JUDGE_SCHEMA, effort: 'high' })))
  const valid = judgments.filter(Boolean)
  const totals = {}
  for (const j of valid) for (const s of j.scores) totals[s.proposal] = (totals[s.proposal] || 0) + s.total
  const winner = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0]
  log('Judge totals: ' + JSON.stringify(totals) + ' -> winner: ' + winner)

  phase('Synthesize')
  await agent(
    `${BASE}\n\n${FAMILY}\n\n${CANON_SPEC}\n\nThree proposals exist: ${SP}/proposal-mythic.md, ${SP}/proposal-delight.md, ${SP}/proposal-teaching.md. The judges' combined winner is "${winner}". Their full judgments (JSON):\n${JSON.stringify(valid, null, 1)}\n\nWrite the FINAL canon sheet to ${CANON} (create the folder). Start from the winner, graft the listed best elements from the others where they make it better, and fix every must-fix item. Resolve any conflicts so the result is one consistent world. Keep every section of the spec, in order. Open the file with a short header: title "Grit & Grace: Story canon", "Season 1: The Last Light of Candlemere", a one-line note that this is the canon the story bible (story/bible.md) and the Season 1 arc build on, and that it uses the sample family (Hugh, Alfie, Clara); each real family's kids fill the same slots.\n\nReturn a short changelog: what came from where, and the key choices made.`,
    { label: 'synthesize-canon', phase: 'Synthesize', effort: 'high' })

  phase('Critique canon')
  const CRITICS = [
    'LENS: originality and naming. Flag any Tolkien name, place or plot (or near-copy), any whimsical or Harry-Potter-like name, any name a 5-year-old would stumble on, any wrong or doubtful Old English etymology, and any clash with Season 2 "The Broken Bridge".',
    'LENS: kids and bedtime. Flag anything too scary for a 3-year-old at bedtime, chapters where a child is passive or token, the 3-year-old doing things no 3-year-old could, preaching or moralizing, vice punished instead of virtue rewarded, weak cliffhangers (especially chapter 3), and "I can…" rungs that are vague, unobservable, too easy for a challenge-loving Kindergartner or 2nd grader, or developmentally wrong.',
    'LENS: decisions and completeness. Check every relevant item in decisions.md is honored (Ember a fox; Grandma Ruth; Candlemere and the Westering; the beacon; strengths and their order; golden-mean tags on all 60 chapters; a classical echo on every chapter; the Odyssey echo; a Socratic mentor; faith-toggle marking for Scripture; the lantern motif; "something happened today" rule). Check all 60 chapters exist and are numbered, 12 parts x 5, parts map to strengths correctly, and every item in section 8 (mockup mapping) is present, specific and consistent with sections 1–7. Flag internal contradictions.',
  ]
  const crits = await parallel(CRITICS.map((c, i) => () => agent(
    `${BASE}\n\n${c}\n\nRead ${D}/decisions.md, then critique ${CANON}. Report only real problems, each with a concrete fix. Do not edit the file.`,
    { label: `critic:${i + 1}`, phase: 'Critique canon', schema: ISSUES_SCHEMA, effort: 'high' })))
  const issues = crits.filter(Boolean).flatMap(c => c.issues)
  const serious = issues.filter(x => x.severity !== 'low')
  log(`Canon critique: ${issues.length} issues (${serious.length} high/medium)`)
  const revision = await agent(
    `${BASE}\n\n${FAMILY}\n\nRevise ${CANON} in place to fix these critique issues. Fix every high and medium issue; fix low issues where the fix is clearly better. Keep everything else as it is, and keep the file internally consistent (if you rename something, rename it everywhere in the file).\n\nIssues (JSON):\n${JSON.stringify(issues, null, 1)}\n\nReturn a short list of what you changed, and any issue you deliberately did not fix with the reason.`,
    { label: 'revise-canon', phase: 'Critique canon', effort: 'high' })
  return { winner, totals, issues: issues.length, serious: serious.length, revision }
}

// ---------- Plan chain ----------
const PLAN_SPEC = `Rewrite ${D}/feature-plan.md from top to bottom so it matches decisions.md exactly. Keep the plain, table-driven style of the current file. Title: "Grit & Grace: Full Product Plan", with "Updated September 26, 2026. Settled decisions are in decisions.md; the story world is in story/canon.md."

Sections:
1. The problem we're solving: keep the research table R1–R22 (fix any row the decisions changed, e.g. R15 now supports "AI-drafted, reviewed by a person, parent previews anything personal"). Add rows only for sources already cited in canvas.json notes or the research files (e.g. Cook & Goldin-Meadow 2008 on gesture; Gollwitzer & Sheeran 2006 on if-then plans; Duckworth 2013; Gunderson 2013 on praise; Cepeda 2006 on spacing; Character Lab's strengths of heart, mind and will; the WEF's 2030 skills). Never invent a statistic. Update the one-sentence strategy (the stories are AI-drafted from a bible and reviewed by a person; never say "human-written").
2. Design principles (update principle 3 and anything else the decisions changed).
3. Who it's for.
4. What kids grow: the 16 strengths table (Grit = Brave + Steady; Grace = Kind & Fair + Wise; kid words and grown-up words; season order Brave, Kind & Fair, Wise, Steady; each strength about 3 weeks, then it comes back), the Lantern Loop, and reading levels plus "I can…" ladders as difficulty ranges with a stretch setting for kids who like a challenge (must work for a Kindergartner and a 2nd grader who like a challenge).
5. The story: Candlemere and the Westering; the four seasons and titles; the season shape (12 weekly parts x about 5 nightly chapters = about 60 chapters; flag this as Claude's working assumption for Jon to confirm, as decisions.md does); the content model (Claude drafts each season from the bible; Jon reviews once per season; nightly personal parts woven in by AI with automatic safety checks; the parent previews anything personal; Jon never reviews daily stories); the classical story engine in brief (Aristotle's mean tags, virtue rewarded, a classical echo every chapter, the Odyssey in Season 1, a Socratic mentor, Tolkien's influence without borrowing, core values, the machinery stays under a warm modern surface); the "something happened today" rule. Point to story/canon.md and the coming story/bible.md. Do not include the 60 chapter titles.
6. The full feature list: update tables A–J (keep the MVP / V1 / V2 / Later key and the "Exists" notes). Sidekick is Ember the fox. Printing is core (fold-a-book, hero trading cards, weekly fridge card, staple booklet), and paper nights still light a lantern. Faith-friendly toggle = a weekly verse and Bible stories in the library. Lanterns count nights read together, never behavior; rest nights show a moon. Pricing exactly as decided (Free; Family $49/yr or $5.99/mo; founding families $39/yr for the first 500, duration not yet decided; Heirloom $89/yr or $9.99/mo with the family story voice and a yearly hardcover; gift a year). Paywall after Chapter 3 on a cliffhanger. Add a new table K "Family story voice" covering the whole voice flow and rules from decisions.md (consent read aloud and timestamped; about 3 minutes of guided reading; create then preview; the label; the owner's off switch; delete removes everything; adults only, own voice, never a child's; reads only our chapter text; no downloads; watermark where supported; generate once and cache; stream paragraph by paragraph; keys in .env.local; behind a feature flag, off in production; privacy lawyer review before any launch because voiceprints are biometric data under Illinois BIPA and similar laws). Priority: prototype now behind a flag; ships with Heirloom only after legal review. Note the cost risk to model in step 4: about 60 chapters a season x 4 seasons, each personalized, so each family's audio is generated separately.
7. Deliberately not building (update: e.g. cloning a child's voice, free-text voice, voice downloads; keep the still-valid rows).
8. The user experience: five loops (update names and details).
9. Full screen inventory: list the actual boards in canvas.json (62 screens plus the "Start here" board), grouped into the 12 rows of the canvas (use the notes t1–t12 as row titles; assign boards to rows by their y coordinate), using the board titles as they appear.
10. What already exists vs. what's new (keep; update names).
11. Phasing: Phase 0 now = decisions, story canon, story bible, Season 1 arc, drafts of chapters 1–3, and the voice-engine prototype behind a flag; then MVP pilot, V1, V2, Later. Add the legal gates: trademark attorney on "Grit & Grace" (the mark GRIT AND GRACE is registered to Westminster School for educational materials) before launch; COPPA review before storing child data on a server; privacy lawyer on the voice engine (BIPA) before any public launch.
12. Decisions: "Settled" (a short summary pointing to decisions.md) and "Still open" (trademark check; founding-price duration; confirm the season shape assumption; the provider for the voice engine after the step-4 comparison; anything else you find genuinely open).

Never use "Bedtime Virtues", "human-written" or "written by people", and never use the old names Theo, June, Max, Pip, Brindlewick or "The Lantern Road". The sample family is Hugh (7), Alfie (5) and Clara (3); the plan rarely needs kid names at all.`

async function planChain() {
  phase('Rewrite plan')
  await agent(`${BASE}\n\n${PLAN_SPEC}\n\nRead decisions.md, the current feature-plan.md, research-findings.md and canvas.json (for the board list and the "why" notes) before writing. Write the file in place. Return a 5-line summary of what changed.`,
    { label: 'rewrite-plan', phase: 'Rewrite plan', effort: 'high' })

  phase('Verify plan')
  const VERIFIERS = [
    `LENS: decision coverage. Go through decisions.md line by line. For each decision, check feature-plan.md states it correctly (prices, plan contents, paywall, content model, copy rule, faith toggle, printing, grandparents, lanterns, the 16 strengths and their grouping and order, the Lantern Loop, the classical engine, the voice engine flow and rules and legal review, the guardrails, the working assumptions). Report each missing or wrong one.`,
    `LENS: staleness and consistency. Flag any leftover old content ("Bedtime Virtues", "human-written", "written by people", "People write, AI draws", Theo, June, Max, Pip, Brindlewick, "Lantern Road", "Knight of the Road", "46 screens", "lamp" where it should be "lantern", "a short blessing at lights-out"), wrong screen counts versus canvas.json (count the boards yourself), internal contradictions (a price or priority that differs between sections), broken research references (an R-number cited that doesn't exist), and any statistic that isn't in the research files.`,
  ]
  const vs = await parallel(VERIFIERS.map((v, i) => () => agent(`${BASE}\n\n${v}\n\nThe file to check: ${D}/feature-plan.md. Report only real problems with a concrete fix. Do not edit the file.`,
    { label: `verify-plan:${i + 1}`, phase: 'Verify plan', schema: ISSUES_SCHEMA })))
  const issues = vs.filter(Boolean).flatMap(v => v.issues)
  log(`Plan verification: ${issues.length} issues`)
  let fix = 'no issues'
  if (issues.length) {
    fix = await agent(`${BASE}\n\nFix these problems in ${D}/feature-plan.md, in place. Keep everything else. Issues (JSON):\n${JSON.stringify(issues, null, 1)}\n\nReturn what you changed.`,
      { label: 'fix-plan', phase: 'Verify plan' })
  }
  return { issues: issues.length, fix }
}

const [canon, plan] = await parallel([canonChain, planChain])

phase('Cross-check')
const cross = await agent(`${BASE}\n\nTwo documents were written in parallel: the story canon ${CANON} and the product plan ${D}/feature-plan.md. Make the plan agree with the canon wherever they touch (hero rank names, the mentor, Ember's pronoun, season and part names, the beacon, place names, the season shape), editing ONLY feature-plan.md, and only where needed. Also confirm the plan never contains 60 chapter titles and never uses old names (Theo, June, Max, Pip, Brindlewick, "The Lantern Road"). Return the list of edits (or "none").`,
  { label: 'cross-check', phase: 'Cross-check' })

return { canon, plan, cross }
