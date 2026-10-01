export const meta = {
  name: 'grit-grace-mockup-sweep',
  description: 'Update all 63 mockup screens and canvas.json to the settled decisions and the Candlemere story canon, verifying each screen',
  phases: [
    { title: 'Edit', detail: 'one agent per screen applies the canon mapping' },
    { title: 'Verify', detail: 'independent check per screen, then fix' },
    { title: 'Consistency', detail: 'cross-screen facts must agree' },
    { title: 'Final fix', detail: 'fix cross-screen issues per file' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const D = REPO + '/docs/redesign'
const P = D + '/canvas/project'

const BOARDS = [
  ['Main.dc.html', 'Start here'], ['Home.dc.html', 'M1 · Homepage'], ['HowItWorks.dc.html', 'M2 · How it works'],
  ['Research.dc.html', 'M3 · The science, plainly'], ['Pricing.dc.html', 'M4 · Pricing'], ['Faq.dc.html', 'M5 · Questions'],
  ['About.dc.html', 'M6 · About / founder'], ['Grandparents.dc.html', 'M7 · For grandparents'],
  ['Homeschool.dc.html', 'M8 · Homeschool, classical & faith'], ['SampleChapter.dc.html', 'M9 · Free sample chapter'],
  ['Strengths.dc.html', 'V1 · The 16 strengths (Grit + Grace)'], ['StrengthDetail.dc.html', 'V2 · One strength, every age'],
  ['LanternLoop.dc.html', 'V3 · The Lantern Loop (the method)'], ['IfThen.dc.html', 'V4 · Kids build an if-then plan'],
  ['RememberWhen.dc.html', 'V5 · "Remember when": spaced review'], ['Welcome.dc.html', "O1 · Who's in the story?"],
  ['DrawHero.dc.html', 'O2 · Draw your hero'], ['Favorites.dc.html', 'O2b · The little details'], ['Sidekick.dc.html', 'O3 · Pick a sidekick'],
  ['Values.dc.html', 'O4 · What matters in your house'], ['MeetHeroes.dc.html', 'O5 · Meet your heroes'],
  ['SaveFamily.dc.html', 'O6 · Save your family'], ['Bedtime.dc.html', 'O7 · Set bedtime'], ['Tonight.dc.html', 'N1 · Tonight (home)'],
  ['ReaderPicture.dc.html', 'N2 · Reader: picture-book layout'], ['ReaderChapter.dc.html', 'N3 · Reader: chapter layout'],
  ['PauseAsk.dc.html', 'N4 · Pause & ask'], ['ChoosePath.dc.html', 'N5 · The kids choose the path'],
  ['LastPage.dc.html', 'N6 · Last page: missions + cliffhanger'], ['LampLit.dc.html', 'N7 · Lantern lit, goodnight'],
  ['LanternKit.dc.html', 'N8 · Lantern design'], ['SpottedIt.dc.html', 'D1 · Did you spot it?'],
  ['LegendApprove.dc.html', "D2 · Approve tonight's legend"], ['KidsIdea.dc.html', "D3 · The idea jar (kids' imagination)"],
  ['TalkCards.dc.html', 'D4 · Car & dinner questions'], ['SpecialCreate.dc.html', "D5 · Tonight's special: something happened"],
  ['SpecialPreview.dc.html', 'D6 · Parent previews the special story'], ['SundayPlan.dc.html', 'W1 · Sunday: the week ahead'],
  ['FridgeCard.dc.html', 'W2 · Fridge card (print)'], ['Booklet.dc.html', 'W3 · Weekly booklet (print)'],
  ['SaturdayTrial.dc.html', 'W4 · Saturday trial'], ['PrintHub.dc.html', 'R1 · Print something'],
  ['FoldGuide.dc.html', 'R2 · How to fold the book'], ['FoldSheet.dc.html', 'R3 · Fold-a-book print sheet (Letter)'],
  ['HeroCards.dc.html', 'R4 · Hero cards print sheet (Letter)'], ['StoryMap.dc.html', 'P1 · Story map'],
  ['Shield.dc.html', "P2 · Each child's shield"], ['HallOfDeeds.dc.html', 'P3 · Hall of Deeds'], ['SeasonFinale.dc.html', 'P4 · Season finale'],
  ['Hardcover.dc.html', 'P5 · Order the hardcover'], ['Classics.dc.html', 'L1 · Classics library'],
  ['RetoldShelf.dc.html', 'L2 · Classics retold, starring your kids'], ['ShareMessage.dc.html', 'G1 · The text Grandma gets'],
  ['ReadAlong.dc.html', 'G2 · Grandma reads along'], ['RecordChapter.dc.html', 'G3 · Record a chapter'], ['Gift.dc.html', 'G4 · Give a year'],
  ['VoiceIntro.dc.html', 'F1 · Family story voice'], ['VoiceCapture.dc.html', 'F2 · Grandma records (her phone)'],
  ['VoiceReady.dc.html', 'F3 · Story voice ready'], ['Paywall.dc.html', 'A1 · After chapter 3: keep going'],
  ['Settings.dc.html', 'A2 · Family settings'], ['Privacy.dc.html', 'A3 · Privacy & your data'], ['Voices.dc.html', 'A4 · Family voices'],
]

const RULES = `Read first:
1. ${D}/decisions.md (authoritative).
2. ${D}/story/canon.md, especially section 8 "MOCKUP MAPPING" (exact replacement content by screen ID such as N1, W1, P1), plus sections 1–7 for anything the mapping doesn't spell out.

What to change (visible copy AND strings inside the component script):
A. FAMILY. Every screen uses the sample family: Hugh (7, eldest boy), Alfie (5, boy with glasses), Clara (3, girl). Map old kids by AGE ROLE: old Theo (8) → Hugh (7); old June (5, she) → Alfie (5, he); old Max (3, he) → Clara (3, she). Fix pronouns (June's she/her → he/his; Max's he/him → she/her) and ages ("8" → "7", "age 8" → "age 7"). Age-level content follows the age role (the 5-year-old's "I can…" goes to Alfie, the 3-year-old's to Clara), using the canon's ladders.
   Portraits: Hugh = /_blob/49c6eb96321a54a534a7d5155073c868 (old Theo's, unchanged). Alfie = /_blob/89224e240d4677b215293a2283578be4 (this was Max's picture). Clara = /_blob/a40cd22c8b0131f6f805efbdc3aca9a8 (this was June's picture). So June's name with a40cd… becomes Alfie with 89224…; Max's name with 89224… becomes Clara with a40cd…. Update alt text. List the kids eldest first where order is free. Rename state keys and data keys consistently (e.g. this.state.kid default 'Theo' → 'Hugh').
   Avatar details must match the art: Hugh messy auburn curls, green hooded cloak; Alfie round glasses, blond, small backpack; Clara curly blond hair, red bow, cream pinafore.
B. SIDEKICK: Pip → Ember, a red fox, she/her.
C. WORLD AND STORY: Brindlewick → Candlemere; "The Lantern Road" → "The Last Light of Candlemere"; the land is the Westering; the beacon is on Wardlow. Every story title, line, recap, vote, legend, map stop, idea-jar item, special story and quote comes from the canon (section 8 first). The mockup's "now" is Week 6 = Part 6 "Fog on Sedgefen" (Keep Going); tonight = Chapter 28 "Something Crying in the Fog" (a Wednesday); except the homepage (M1), which shows Week 3 as section 8 says. No bridge anywhere in Season 1. No "chosen one" lines.
D. SEASONS: 12 weekly parts × 5 nightly chapters = 60 chapters per season; chapters advance by reading, never by date ("next time", not "tomorrow night", where it's about unlocking). Seasons read in order: 1 Brave "The Last Light of Candlemere", 2 Kind & Fair "The Broken Bridge", 3 Wise "The Silent Library", 4 Steady "The Long Winter". Ranks: Fireside Friend → Lantern Carrier → Wayfarer → Beacon-Keeper.
E. STRENGTHS: exactly the 16 names (Brave, Keep Going, Bounce Back, Truth-Teller; Pause Button, Wait Well, One Thing, Enough; Kind, Fair Play, Thankful, Better Together; Curious, Think It Through, Open Mind, Make Something New). Grit = Brave + Steady, Grace = Kind & Fair + Wise. Classic names (Courage, Temperance, Justice, Prudence) only as grown-up words.
F. LANTERNS, not lamps, for nights read: one lantern lit per night read together, never for behavior; rest nights show a moon; paper nights still light a lantern. A real lamp inside the story is fine. Never rename files or change href targets.
G. FAITH toggle = "a weekly verse and Bible stories in the library". Replace any "blessing at lights-out" wording; a verse on a page is "This week's verse" (shown because the faith toggle is on).
H. PRICES exactly: Free (first 3 chapters, draw every child); Family $49/yr or $5.99/mo; founding families "$39/yr for our first 500 founding families" (never "for life", "as long as you stay" or "first year, then $49"); Heirloom $89/yr or $9.99/mo = the family story voice + a yearly hardcover (not "a hardcover of each season"); gift a year. Paywall after Chapter 3.
I. AI HONESTY: "reviewed by a person", never "written by people" or "human-written". AI drafts each season from a story bible; a person reviews it; the parent previews anything personal first.
J. FAMILY STORY VOICE (F1–F3, A4, G3 and any mention): adults only, their own voice only, never a child's; a consent statement read aloud and kept with a timestamp; about 3 minutes of guided reading; created, then previewed; labeled "Made from [name]'s recording, with their permission"; the voice owner has an off switch; delete removes everything; it reads only our chapter text; no downloads.
K. CLASSICAL ENGINE: only on parent-facing explainer screens (M2, M3, M8, V1–V5) may you mention it lightly (e.g. "Brave sits between timid and reckless", a classical echo in every chapter, a mentor who only asks questions). Never lecture in story text.
L. COPY STYLE: plain, warm, short sentences, in the screen's existing voice. Keep each string about the same length as what it replaces (within about 20%): boards have fixed heights. No emoji, no invented statistics. Leave the founder's own words on the About page alone except where a rule above applies.

Markup rules (a broken screen fails silently):
- Keep the line <script src="./support.js"></script> exactly. Keep the <script type="text/x-dc" data-dc-script data-props='…'> block (classic JS, class Component extends DCLogic). data-props stays valid JSON.
- Do NOT change the root element's width/height or the $preview size. Do NOT rename files, change hrefs, or add/remove screens.
- Close every non-void element; quote every attribute. {{holes}} are dotted lookups into renderVals() only, never expressions; if you add a hole, add its key in renderVals.
- Keep inline styles and layout unless the new copy needs a change.
- Image srcs stay /_blob/<id> exactly (only the three portrait ids above swap between kids); never add a new image URL.

PRIVACY: never open anything under ${D}/private/. Never commit, push or switch branches.`

const ISSUES = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['high', 'medium', 'low'] },
      where: { type: 'string' },
      problem: { type: 'string' },
      fix: { type: 'string' },
    }, required: ['severity', 'where', 'problem', 'fix'] } },
  },
  required: ['issues'],
}

async function editScreen([file, title]) {
  return agent(`You are updating ONE screen of the Grit & Grace product mockup to the settled decisions and the new story canon.
The screen: ${P}/${file} (board "${title}"). Edit it in place.

${RULES}

When done, run: python3 ${D}/tools/check-dc.py ${P}/${file}
It must report no ERROR. Fix every WARN unless it is truly fine (for example a real lamp inside the story, or the founder's words).

Return a short list of what you changed, and anything you were unsure about.`, { label: `edit:${file}`, phase: 'Edit' })
}

async function verifyScreen(editSummary, [file, title]) {
  const v = await agent(`You are a strict reviewer of ONE screen of the Grit & Grace product mockup, just updated by another agent: ${P}/${file} (board "${title}").
Its editor reported: ${String(editSummary).slice(0, 1500)}

${RULES}

Check the screen against every rule above and against canon.md section 8 for this screen ID. Look especially for: leftover old names or content; wrong pronouns, ages or portrait ids; story content that contradicts the canon; state/data keys renamed inconsistently (for example a default state that no longer matches any option); {{holes}} that no longer exist in renderVals; copy that no longer makes sense or is much longer than before; wrong prices; "lamp" used for the nightly marker. Run python3 ${D}/tools/check-dc.py ${P}/${file} and include any ERROR as a high issue.
Do not edit the file. Report only real problems, each with a concrete fix. An empty list is fine.`, { label: `verify:${file}`, phase: 'Verify', schema: ISSUES })
  const issues = (v && v.issues) || []
  if (!issues.length) return { file, fixed: 0 }
  await agent(`Fix these review issues in ONE mockup screen, in place: ${P}/${file} (board "${title}").

${RULES}

Issues (JSON):
${JSON.stringify(issues, null, 1)}

Afterwards run python3 ${D}/tools/check-dc.py ${P}/${file}: no ERROR allowed. Return what you changed.`, { label: `fix:${file}`, phase: 'Verify' })
  return { file, fixed: issues.length }
}

phase('Edit')
const canvasJob = agent(`Update the canvas index ${P}/canvas.json (JSON; keep every key and entry you are not changing; keep it valid JSON; do not change any board x, y, w or h).
Read ${D}/decisions.md and ${D}/story/canon.md first.
1. Board titles: update only titles whose wording is now wrong. "O3 · Pick a sidekick" → "O3 · Meet Ember (and your pet)". Check the others against the canon (e.g. N7 is already "N7 · Lantern lit, goodnight").
2. The sticky notes s1–s12 (the blue "WHY" notes): update any stale content to match the decisions and canon (for example the season shape, lanterns not lamps, "I can…" scaled to ages 3, 5 and 7, the faith toggle as a weekly verse and Bible stories, founding families at $39/yr without a duration, Heirloom = family story voice + yearly hardcover, Ember the fox, the Candlemere story, the sample family Hugh, Alfie and Clara, stories drafted by AI from a bible and reviewed by a person). Keep each note's research citations and its length roughly the same. Keep the plain style.
3. In note s2 (or s4), mention in one sentence that every chapter is tagged with its strength and the two failings it sits between (Aristotle's mean), and carries a quiet classical echo.
Never open anything under ${D}/private/. Validate with: python3 -c "import json;json.load(open('${P}/canvas.json'))". Return what you changed.`, { label: 'edit:canvas.json', phase: 'Edit' })

const results = await pipeline(BOARDS, editScreen, verifyScreen)
const canvasResult = await canvasJob
const fixedCount = results.filter(Boolean).reduce((n, r) => n + r.fixed, 0)
log(`Edited ${results.filter(Boolean).length}/${BOARDS.length} screens; ${fixedCount} review issues fixed`)

phase('Consistency')
const cons = await agent(`All 63 screens of the Grit & Grace mockup in ${P} were just updated to a new story canon (${D}/story/canon.md, section 8) and decisions (${D}/decisions.md). Each screen was checked on its own; your job is CROSS-SCREEN consistency.
Dump the text of every screen (e.g. python3 - that strips <style> blocks and tags from each ${P}/*.dc.html but keeps the component script strings) and compare the shared facts:
- The mockup's "now": Week 6, Part 6 "Fog on Sedgefen", Keep Going, tonight = Chapter 28 "Something Crying in the Fog" (Wednesday), and the counts (27 chapters read, 5 trials stamped, lanterns this week), the "last time" line, the vote options, the "remember when", the idea-jar chapter credited to Clara. The homepage (M1) shows Week 3 on purpose.
- Kid names, ages, pronouns and portrait ids (Hugh 7 = 49c6eb96…, Alfie 5 = 89224e24…, Clara 3 = a40cd22c…), Ember she/her, Grandma Ruth.
- Legend names and texts, Hall of Deeds counts (9 legends), season finale numbers, hero cards, ranks.
- Prices and plan contents on every screen that shows them (M1, M4, M7, A1, G4, P5, A2, R1…).
- Season names and order; strength names; the faith toggle wording; lanterns vs lamps.
- Links: every href="X.dc.html" must point to a file that exists.
Also run python3 ${D}/tools/check-dc.py (all screens) and report every ERROR and any WARN that is a real problem.
Do not edit files. Report each inconsistency against the specific file that should change, with the exact fix.`, { label: 'consistency', phase: 'Consistency', schema: {
  type: 'object',
  properties: { issues: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string', description: 'file name like Tonight.dc.html or canvas.json' },
    problem: { type: 'string' }, fix: { type: 'string' },
  }, required: ['file', 'problem', 'fix'] } } },
  required: ['issues'],
}, effort: 'high' })

phase('Final fix')
const byFile = {}
for (const i of (cons && cons.issues) || []) (byFile[i.file] = byFile[i.file] || []).push(i)
const titleOf = Object.fromEntries(BOARDS)
const finals = await parallel(Object.entries(byFile).map(([file, issues]) => () => agent(`Fix these cross-screen consistency issues in ONE file, in place: ${P}/${file}${titleOf[file] ? ` (board "${titleOf[file]}")` : ''}.

${RULES}

Issues (JSON):
${JSON.stringify(issues, null, 1)}

Afterwards: for a .dc.html file run python3 ${D}/tools/check-dc.py ${P}/${file} (no ERROR allowed); for canvas.json check it still parses. Return what you changed.`, { label: `final:${file}`, phase: 'Final fix' })))

return {
  screens: results.filter(Boolean).length,
  reviewFixes: fixedCount,
  canvas: canvasResult,
  consistencyIssues: ((cons && cons.issues) || []).length,
  finalFixedFiles: Object.keys(byFile),
}
