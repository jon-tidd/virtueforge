export const meta = {
  name: 'grit-grace-season1-drafts',
  description: 'Write the Season 1 arc (12 part sheets) and full drafts of Chapters 1-3 via the prompt kit, with a judged writer panel, safety checks, render tools and a review packet',
  phases: [
    { title: 'Tools', detail: 'sample family, renderer and checker' },
    { title: 'Part sheets', detail: 'prompt 1c for all 12 parts' },
    { title: 'Arc', detail: 'continuity pass and arc.md' },
    { title: 'Draft', detail: '3 writers draft Chapters 1-3 (1d + 1f)' },
    { title: 'Judge', detail: '3 judges score every draft' },
    { title: 'Synthesize', detail: 'final Chapters 1-3 source' },
    { title: 'Pictures', detail: 'prompt 1e picture-book tellings' },
    { title: 'Check', detail: 'code checks, safety check, critics' },
    { title: 'Revise', detail: 'fix, re-check, render' },
    { title: 'Packet', detail: 'test families and the review packet' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const D = REPO + '/docs/redesign'
const S = D + '/story'
const S1 = S + '/season-1'
const SP = '/private/tmp/claude-501/-Users-jontidd-code/e9041387-0ea3-4317-b6a1-f7623c477615/scratchpad/wf-s1'

const BASE = `You are producing Season 1 of "Grit & Grace" ("The Last Light of Candlemere"): nightly bedtime adventures starring a family's own kids, teaching strengths rooted in the classical virtues.
Repo: ${REPO} (branch claude/grit-grace-phase0). Never commit, push, merge or switch branches. Never open anything under ${D}/private/ (the repo is public; the sample family is Hugh 7, Alfie 5, Clara 3).
Authority, in order: ${D}/decisions.md > ${S}/canon.md > ${S}/bible.md > ${S}/strengths.md > ${S}/prompts.md. The prompt kit (${S}/prompts.md) is the production method: follow its prompts literally, including the shared blocks (section 2), the slot markers (section 3), the FAMILY object (section 4) and the output schemas. Where the kit and the canon differ on story facts, the canon wins; note it in flags_for_jon.
Chapter 1's free sample text in canon section 8 is used word for word where the kit says so.`

const ISSUES = {
  type: 'object',
  properties: { issues: { type: 'array', items: { type: 'object', properties: {
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    file: { type: 'string' }, where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
  }, required: ['severity', 'file', 'where', 'problem', 'fix'] } } },
  required: ['issues'],
}

// ---------- Tools and part sheets run in parallel ----------
phase('Tools')
const toolsJob = agent(`${BASE}\n\nBuild the production tools for chapters.
1. ${S}/sample-family.json: the FAMILY object from prompts.md section 4 (the sample family), exactly.
2. ${D}/tools/render-chapter.py: python3, standard library only. Input: a chapter source JSON (prompt 1d's CHAPTER_SCHEMA), its variant blocks JSON (prompt 1f), its pictures JSON (prompt 1e, optional), and a FAMILY JSON. It fills every slot marker per prompts.md section 3 (children, pronouns, blocks chosen by rule, looks from the builder values, grandparent, parents, cast alternates, Tier C slots with their reviewed defaults, vote routes: render route A by default, or --route B). Output: a Markdown chapter in EXACTLY the format the voice engine's loader reads: see ${REPO}/lib/voice/chapters.ts and the fixture ${REPO}/lib/voice/__fixtures__/s1-ch01.md (front matter id/season/part/chapter/title/tag/lead; "## Chapter-book telling" paragraphs with a "[[Pause & ask]]" paragraph at pause_and_ask.after_paragraph; "## Picture-book telling"; "## Pause & ask" with "**Question:**", "**Answers first:**", "**For the grown-up:**" and the other fields; "## Last page"), then extra sections after those for the reviewer ("## For the grown-up" (echo note, rich words, join-in, your line, big-print words, fear level), "## Vote", "## Remember when", "## Pictures" (one line per picture with its pinned paragraph and image description), "## Defaults" (Tier C defaults), "## Flags for Jon"). It must fail loudly on an unknown marker or a missing block. Usage: render-chapter.py <source.json> --blocks <blocks.json> [--pictures <pictures.json>] --family <family.json> [--route A|B] -o <out.md>.
3. ${D}/tools/check-chapter.py: python3, standard library only. Implements the plain code tests in prompts.md section 14 (production column) and the bible's numeric Must rules: chapter-book telling 900–1,100 words (jar chapters per the kit's rule), no sentence over 28 words, one speaker per paragraph where checkable, no em dashes, the ellipsis character, picture-book 300–450 words over 8–12 pictures with sentences of 15 words or fewer, every picture pinned to a paragraph, the youngest's act and the Pause & ask each with a picture, 3–5 rich words each appearing at least twice, a join-in line, a "your line", big-print words, the Pause & ask question 20 words or fewer, the refrains spelled exactly, never-words (brands, slang, "little ones", "kids" in narration, "blow out"), subject pronouns for children only inside blocks, and every marker known. Input: the source JSON (+ blocks, pictures) and optionally a rendered .md. Prints PASS/FAIL per test with the reason; exit 1 on any FAIL.
Test both tools on a small hand-made fixture under ${SP}/tool-fixture/ until they work. Return usage lines and the test results.`, { label: 'tools', phase: 'Tools', effort: 'high' })

phase('Part sheets')
const PARTS = Array.from({ length: 12 }, (_, i) => i + 1)
const sheetsJob = parallel(PARTS.map(n => () => agent(`${BASE}\n\nRun prompt 1c (the part sheet) from ${S}/prompts.md section 5.3 for Part ${n}, with the drafting system prompt (1a, section 5.1) as your instructions and the context listed in section 5.0. {{part_outline}} = canon section 4's Part ${n} row, its part-engine row and its five chapter rows (plus Saturday trials and ladders from canon section 3 and 5, and strengths.md). {{previous_part_sheet}}: you don't have it (parts are drafted in parallel and a continuity pass follows), so use the canon's Part ${n - 1 || 'none'} rows instead.
Write the JSON output (the kit's exact shape) to ${S1}/parts/part-${String(n).padStart(2, '0')}.json (create folders). Return a one-line summary.`, { label: `part:${n}`, phase: 'Part sheets', effort: 'high' })))

const [tools] = await parallel([() => toolsJob, () => sheetsJob])

phase('Arc')
const arc = await agent(`${BASE}\n\nAll 12 part sheets are in ${S1}/parts/. Do a continuity pass across them: week words never repeat across parts and are genuinely everyday words; trials fit each band and include safety lines where needed; hosts' voices match the canon; clues land in the canon's order; "In real life" lines exist wherever the kit requires them; "I can…" lines are copied exactly from strengths.md; nothing contradicts canon.md. Fix the JSON files in place.
Then write ${S1}/arc.md, "Season 1 arc: The Last Light of Candlemere": the one-paragraph shape (from the canon), a 12-row overview table (part, place, strength, echo, modeled behavior, week words, trial), then each part's sheet in readable form (not JSON), and at the end every chapter (1-60) in one table with title, lead, tag, echo and marks, copied from the canon. Return a list of continuity fixes you made.`, { label: 'arc', phase: 'Arc', effort: 'high' })

// ---------- Chapters 1-3: writer panel ----------
phase('Draft')
const WRITERS = [
  { key: 'kit', angle: 'Follow the kit exactly as written; your only goal is a chapter that passes every checklist item cleanly and reads warmly.' },
  { key: 'performer', angle: 'You are also a gifted read-aloud performer: within the kit\'s rules, make every page sing aloud (rhythm, sound words, the rule of three, the join-in line landing, Ember\'s comic timing, a page turn that pulls).' },
  { key: 'heart', angle: 'You are also a children\'s author known for emotional truth and wonder: within the kit\'s rules, make the children feel real and specific at 3, 5 and 7, make the fox at the window and the first night on the road genuinely magical, and make the Chapter 3 ending the kind of hook a child begs to continue.' },
]
const drafts = await parallel(WRITERS.map(w => () => agent(`${BASE}\n\n${w.angle}\n\nWrite Chapters 1, 2 and 3, in order, each by running prompt 1d (section 5.4) and then prompt 1f (variant blocks, section 5.6), with the drafting system prompt 1a as your instructions and the context in section 5.0. Inputs: the canon rows for chapters 1-3, the part sheet ${S1}/parts/part-01.json, the story so far (your own previous chapter), rich words already used, vote 1 (Chapter 3 ends with it; the free chapters end at Chapter 3 on the canon's hook), and the week's verse. Chapter 1 uses canon section 8's sample text word for word where the kit says so.
Write each chapter's JSON to ${SP}/${w.key}/s1-ch0N.json and its blocks to ${SP}/${w.key}/s1-ch0N.blocks.json (N = 1, 2, 3). Then render each with: python3 ${D}/tools/render-chapter.py <source> --blocks <blocks> --family ${S}/sample-family.json -o ${SP}/${w.key}/s1-ch0N.md and run python3 ${D}/tools/check-chapter.py on it; fix your drafts until the checks pass (if a tool itself is wrong, note it and work around it). Return the check results and a two-line note on each chapter.`, { label: `draft:${w.key}`, phase: 'Draft', effort: 'high' })))
log('Drafts done: ' + drafts.filter(Boolean).length + '/3 writers')

phase('Judge')
const JUDGE = {
  type: 'object',
  properties: {
    chapters: { type: 'array', items: { type: 'object', properties: {
      chapter: { type: 'number' },
      scores: { type: 'array', items: { type: 'object', properties: {
        writer: { type: 'string' }, total: { type: 'number' }, best_moments: { type: 'array', items: { type: 'string' } }, problems: { type: 'array', items: { type: 'string' } },
      }, required: ['writer', 'total', 'best_moments', 'problems'] } },
      winner: { type: 'string' },
    }, required: ['chapter', 'scores', 'winner'] } },
    grafts: { type: 'array', items: { type: 'string' } },
  },
  required: ['chapters', 'grafts'],
}
const JUDGES = [
  'You judge as the bible\'s reviewer: every item on the chapter checklist (bible section 2), the Must rules, the classical engine done quietly (the mean made visible, virtue rewarded, the echo), the slot and block rules, and the Pause & ask quality.',
  'You judge as a parent reading aloud at 7:30pm to a 7-year-old, a 5-year-old and a 3-year-old: Would they laugh? Would the 3-year-old follow the picture-book telling? Would the 7-year-old beg for Chapter 4? Is anything too scary or too flat? Read the rendered .md files aloud in your head, page by page.',
  'You judge for canon and product fidelity: every beat of canon section 4 rows 1-3 and the section 8 sample text; Ember, Grandma Ruth, Hild, Will and Reeve Osric in character; fire safety; the clue in Chapter 3; the vote; the paywall hook; defaults for every personal slot; nothing a family could be hurt by.',
]
const judgments = await parallel(JUDGES.map((j, i) => () => agent(`${BASE}\n\n${j}\n\nThree writers drafted Chapters 1-3: ${SP}/kit/, ${SP}/performer/, ${SP}/heart/ (each has s1-ch0N.json, .blocks.json and rendered .md). Score each writer's version of each chapter out of 100, name the winner per chapter, and list specific grafts (a line, a beat, a joke) from the others worth taking. Do not edit.`, { label: `judge:${i + 1}`, phase: 'Judge', schema: JUDGE, effort: 'high' })))
const valid = judgments.filter(Boolean)
const tally = {}
for (const j of valid) for (const c of j.chapters) for (const s of c.scores) { const k = c.chapter + ':' + s.writer; tally[k] = (tally[k] || 0) + s.total }
log('Judge tallies: ' + JSON.stringify(tally))

phase('Synthesize')
await agent(`${BASE}\n\nWrite the FINAL Chapters 1-3. The drafts are in ${SP}/kit/, ${SP}/performer/, ${SP}/heart/. The judges' full results (JSON): ${JSON.stringify(valid, null, 1)}\nTallies (chapter:writer → total): ${JSON.stringify(tally)}\nFor each chapter start from its highest-scoring draft, graft the judges' listed best moments where they make it better, fix every problem the judges named, and make the three chapters one continuous story (the last paragraph of each flows into the next; rich words come back within the part). Keep the kit's JSON shape exactly.
Write ${S1}/source/s1-ch01.json, s1-ch02.json, s1-ch03.json and their .blocks.json files. Render each with python3 ${D}/tools/render-chapter.py … --family ${S}/sample-family.json -o ${S1}/s1-ch0N.md and run python3 ${D}/tools/check-chapter.py until they pass. Return what came from where.`, { label: 'synthesize', phase: 'Synthesize', effort: 'high' })

phase('Pictures')
await parallel([1, 2, 3].map(n => () => agent(`${BASE}\n\nRun prompt 1e (section 5.5: the picture-book telling and its pictures) for Chapter ${n}, from the finished master ${S1}/source/s1-ch0${n}.json and its blocks. Write ${S1}/source/s1-ch0${n}.pictures.json in the kit's exact shape. Then re-render ${S1}/s1-ch0${n}.md with --pictures and run the checker until it passes. Return the picture count, word count and check results.`, { label: `pictures:${n}`, phase: 'Pictures', effort: 'high' })))

phase('Check')
const checks = await parallel([
  ...[1, 2, 3].map(n => () => agent(`${BASE}\n\nRun prompt 8 (the safety check, section 12) exactly as the product would, on Chapter ${n}: ${S1}/s1-ch0${n}.md (and its source). Report every rule that fails or is borderline as an issue with a fix. Do not edit.`, { label: `safety:${n}`, phase: 'Check', schema: ISSUES })),
  () => agent(`${BASE}\n\nLENS: early literacy and child development. Read Chapters 1-3 (${S1}/s1-ch01.md to s1-ch03.md): does the chapter-book telling stretch a 2nd grader and a Kindergartner who like a challenge (the "your line", big-print words, rich words met twice)? Would the picture-book telling hold a 3-year-old? Are the Pause & ask questions real why-questions with good follow-ups? Is Clara's act real and possible for a 3-year-old? Report issues with fixes. Do not edit.`, { label: 'critic:literacy', phase: 'Check', schema: ISSUES, effort: 'high' }),
  () => agent(`${BASE}\n\nLENS: the classical engine and the canon. Read Chapters 1-3 (${S1}/s1-ch01.md to s1-ch03.md and sources): the golden mean shown (timid and reckless) without preaching; virtue rewarded with trust and welcome; the echoes (Odyssey 1 and 2, the Little Red Hen, Belling the Cat, Vesta) quiet but present; Hild only asks; Ember never solves; fire safety; the mystery clues; everything consistent with canon.md. Report issues with fixes. Do not edit.`, { label: 'critic:classical', phase: 'Check', schema: ISSUES, effort: 'high' }),
])
const issues = checks.filter(Boolean).flatMap(c => c.issues)
log(`Checks: ${issues.length} issues (${issues.filter(i => i.severity === 'high').length} high)`)

phase('Revise')
const forCh = n => issues.filter(x => new RegExp('ch0?' + n + '\\b|chapter ' + n + '\\b', 'i').test(x.file + ' ' + x.where) || !/ch0?[123]\b|chapter [123]\b/i.test(x.file + ' ' + x.where))
await parallel([1, 2, 3].map(n => () => agent(`${BASE}\n\nA previous revision pass was cut off part-way, so some of these fixes may already be in the files: check each issue against the CURRENT files and fix only what is still wrong.\nRevise Chapter ${n} only: edit ${S1}/source/s1-ch0${n}.json, .blocks.json and .pictures.json, re-render ${S1}/s1-ch0${n}.md with the sample family (render-chapter.py … --pictures … --family ${S}/sample-family.json), and re-run check-chapter.py until it passes. Fix all high and medium issues, and low ones where clearly better. Do not touch the other chapters' files; if a fix needs a change in another chapter, say so in your reply instead.\nIssues for this chapter (JSON): ${JSON.stringify(forCh(n), null, 1)}\nReturn what you changed, any cross-chapter change needed, and the final check output.`, { label: `revise:ch${n}`, phase: 'Revise', effort: 'high' })))
await agent(`${BASE}\n\nChapters 1-3 were just revised separately (${S1}/source/ and ${S1}/s1-ch0N.md). Make them one continuous story again: the last paragraph of each flows into the next, facts and names agree, rich words come back within the part, the clue and vote carry through, and any cross-chapter change the revisers asked for is made. Re-render all three with the sample family and run check-chapter.py on each until all pass. Also make sure ${S1}/outline.json, if present, is either used by the tools or removed. Return what you changed and the final check output for each chapter.`, { label: 'revise:continuity', phase: 'Revise', effort: 'high' })

phase('Packet')
const packet = await agent(`${BASE}\n\n1. Prove the slot system: create three test FAMILY files in ${S1}/test-families/ (an only child who is a girl, 6, with glasses, with a grandfather and no parents set; three children with a girl as eldest; two children with one parent and no grandparent set), render Chapter 1 for each to ${S1}/test-families/<name>-s1-ch01.md, run the checker, and fix any source or tool problem that shows up (then re-render the sample family too).
2. Write ${S1}/README.md, the review packet for Jon (bible section 11): what to read in full (Chapters 1-3, in order; about 25 minutes aloud) and what to skim (arc.md); a checklist he can tick while reading; where the classical engine shows (a short table per chapter: golden mean, echo, virtue rewarded); the open questions that need his call (collect from the chapters' flags_for_jon, bible section 11's open items and prompts.md section 15; group and dedupe, most important first); how to leave notes; how the private copy with his own kids' names is made (python3 docs/redesign/tools/render-chapter.py with a private FAMILY file in docs/redesign/private/, never committed); and how to hear Chapter 1 in his own voice (docs/redesign/voice/README.md, with STORY_CONTENT_DIR pointing at the private rendered chapters). Plain English, short.
Return a 6-line summary: word counts, check status, and the top 3 open questions.`, { label: 'packet', phase: 'Packet', effort: 'high' })

return { tools: String(tools).slice(0, 600), arc: String(arc).slice(0, 800), issues: issues.length, packet }
