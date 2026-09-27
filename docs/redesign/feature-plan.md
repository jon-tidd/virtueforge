# Grit & Grace: Full Product Plan
*Updated September 26, 2026. Settled decisions are in [decisions.md](decisions.md); the story world lives in [story/canon.md](story/canon.md).*

This plan follows `decisions.md`. Where they differ, `decisions.md` wins.

---

## 1. The problem we're solving (what the research says)

| # | Finding | Source | What it means for the product |
|---|---|---|---|
| R1 | Daily reading among 5–8-year-olds fell from 64% to 52% since 2017 | Common Sense Census 2025 | The habit is eroding. Retention matters more than features. |
| R2 | Read-aloud collapses after ages 6–8, yet 40% of 6–11-year-olds wish it continued | Scholastic KFRR | Serve 6–9 on purpose (chapter layout, older-kid tone), not just toddlers. |
| R3 | Bedtime is the most stressful time of day for many parents | Industry surveys (weak) + Pew 2025 (42% wish they managed screens better) | The parent at 7:45pm has no spare energy. Every choice is friction. |
| R4 | A story with the child's photo and name increased sharing; name-only did nothing | ECEJ 2025 (n=315); Kruse 2021 | A consistent drawn likeness is core, not a nice-to-have. |
| R5 | Human characters teach better than animals; stories that are too familiar teach less | Larsen 2018; Reading Psychology 2024 | The kids are heroes in a story world, not re-enactments of their day. Ember the fox is a sidekick, not the hero. |
| R6 | Honesty rewarded beats lying punished | Lee 2014; Liang 2025 | Story rule: show virtue rewarded, not just vice punished. |
| R7 | Asking kids to explain the lesson beats telling them | Walker & Lombrozo 2017 | A "Why do you think…?" question in every chapter. The mentor asks; nobody lectures. |
| R8 | Pause-and-ask reading has moderate, reliable effects | Dialogic reading meta-analyses | Questions during the reading, not just after. |
| R9 | Modeling one concrete behavior can transfer, even at age 3 | Picture-book study, 2023 (small; low-medium confidence) | Each chapter shows one copyable action ("a lantern breath"). |
| R10 | Serialized stories sustain engagement; stand-alone ones decline | Lu, Green et al. 2025 | A continuing season with cliffhangers, not one-off stories. |
| R11 | Routine benefits grow with each night; 5+ nights a week is the threshold | Mindell 2015 | Aim for 5 of 7 nights. Rest nights show a moon. No guilt streaks. |
| R12 | Material rewards for helping reduced later helping; praise didn't | Warneken & Tomasello 2008 | Lanterns count nights read together, never behavior. Legends, not prizes. |
| R13 | Screens before bed delay sleep; AAP says no screens 1 hour before; personalized print books showed a stronger learning edge than digital | AAP; 2024 RCT; Kucirkova 2014 | Printing is core. Paper nights still light a lantern. The phone faces the parent. |
| R14 | Kids' brains respond far more to their mother's voice than to a stranger's (small study) | Abrams 2016 PNAS | Recorded chapters and a family story voice, including grandparents. |
| R15 | Parents accept AI illustrations; most are uneasy with AI-written text they can't check | NC State 2025 | Stories are AI-drafted from a story bible and reviewed by a person. The parent previews anything personal. The FAQ explains AI use honestly. |
| R16 | Free AI storybooks exist (Gemini), but likeness drifts and there's no series | Google; reviews | Our edge: consistent likeness × an ongoing series × a real strengths curriculum × print. |
| R17 | Education apps: median $43.94/yr; only ~24% of annual plans renew; 55% of 3-day-trial cancels happen on day 0 | RevenueCat 2025–26 | Family at $49/yr. The "wow" lands in session 1. Paywall after Chapter 3, on a cliffhanger. Renewal needs a reason (the next season, the hardcover). |
| R18 | Child photos are COPPA personal info; AI avatar apps have been sued under BIPA; 72% of parents rate photo privacy important | FTC; Lensa suit; parent surveys (source not named in research) | Drawn avatar builder, never photos. Voiceprints are biometric data too, so the voice engine gets a privacy lawyer's review. |
| R19 | Grandparents spend ~$2,654/yr on grandkids | AARP 2026 | Grandparents are a buyer, a narrator and the growth channel. |
| R20 | 3.4M homeschoolers; about 677,500 classical students and 261,000 classical homeschoolers; the Read-Aloud Revival community | NHERI; Arcadia; RAR | An early-adopter community to launch into. |
| R21 | Personalized print books are a proven market (Wonderbly 11M+ sold) | PRH 2025 | A yearly printed hardcover is a real product. |
| R22 | A competitor (Lulawe) already turns family memories into stories | Lulawe | The "story remembers" idea alone isn't a moat. The combination is. |
| R23 | Children who gesture while they learn keep the lesson longer | Cook & Goldin-Meadow 2008 (not yet in the research files) | Each strength gets a power phrase and a hand move ("Not yet… keep going!" with hands climbing a ladder). |
| R24 | If-then plans help people follow through on goals | Gollwitzer & Sheeran 2006 (not yet in the research files) | Each child makes an if-then plan for the week's strength. |
| R25 | If-then planning also helped schoolchildren follow through | Duckworth et al. 2013 (not yet in the research files) | Kids build their own plan, in their own words, at their level. |
| R26 | Toddlers whose parents praised effort were more likely to enjoy challenges years later | Gunderson et al. 2013 (not yet in the research files) | "Spotted it" praise names the effort and the new way they tried, not how smart they are. |
| R27 | Spaced review beats cramming | Cepeda et al. 2006 (not yet in the research files) | Each strength comes back weeks later in "remember when" callbacks and on hero cards. |
| R28 | Character strengths group into strengths of heart, mind and will | Character Lab (not yet in the research files) | Grit = strengths of will. Grace = strengths of heart and mind. |
| R29 | Creative thinking, resilience, curiosity and empathy are among the skills expected to matter most by 2030 | World Economic Forum (not yet in the research files) | The four strengths R29 names (Bounce Back, Kind, Curious, Make Something New) are marked "future-ready" next to the classical ones. |

**The one-sentence strategy:** A nightly bedtime adventure, AI-drafted from a story bible and reviewed by a person, that draws your own kids in as the heroes, grows 16 classical strengths at each child's level, carries each one into the day, and works in one tap, on paper when you like, with grandparents welcome.

---

## 2. Design principles (each traces to research)

1. **One tap at bedtime.** Everything is ready before 7:30pm. *(R3, R17)*
2. **Your kids, recognizably, every time.** A drawn likeness, the same in every chapter. Never photos. *(R4, R16, R18)*
3. **AI drafts, a person reviews, the parent sees anything personal first.** Claude drafts each season from the story bible and Jon reviews it once. Nightly personal parts are woven in by AI with automatic safety checks, and the parent previews them. We say this plainly. *(R15, R16)*
4. **A story that continues.** Four seasons a year, a chapter a night five nights a week, cliffhangers. *(R10, R17)*
5. **Teach through the story, not at the child.** Virtue rewarded, one modeled action, a mentor who asks why. The classical machinery stays underneath; the surface stays warm, fun and modern. *(R5–R9)*
6. **Carry it into the day.** Missions, if-then plans, the fridge card and "spotted it". *(R9, R24, R25)*
7. **Screen-light bedtime. Paper counts.** Print, recorded voices and a nightlight reader; the parent holds the device. *(R13, R14)*
8. **Reward the ritual, not the child's behavior.** Lanterns for nights read together. Legends and effort praise for virtue, never prizes. Rest nights show a moon. *(R11, R12, R26)*
9. **Bring it back.** Each strength returns weeks later, so it sticks. *(R27)*
10. **Privacy as a feature.** Drawings, not photos. Voices only with spoken consent. The parent owns the account. *(R18)*
11. **Family-sized.** Siblings share one story at their own levels; grandparents are first-class. *(R2, R19)*

---

## 3. Who it's for

| Person | Role | What they need |
|---|---|---|
| **The tired parent** (primary) | Buyer + reader | One tap, a good story, a sense their kids are becoming good people, proof it's working |
| **The child, 3–9** | The hero | To see themselves, to find out what happens next, to be recognized |
| **The grandparent** | Buyer, narrator, audience | Connection from a distance, a meaningful gift, their voice at bedtime |
| **Homeschool, classical and faith families** (early adopters) | Buyer + evangelist | A real curriculum, the classics, a virtue framework, printables, a faith-friendly option |
| *Teacher (later)* | Buyer | Classroom version, not now |

---

## 4. What kids grow: 16 strengths

The four cardinal virtues are the backbone, renamed in words a 3-year-old can say. **Grit** is the strength to do hard things (strengths of will). **Grace** is the heart and mind to do them well (strengths of heart and mind). *(R28, R29)*

| Half | Family (kid word) | Classical virtue | Season | Strength (kid word) | Grown-up word | What kids say | Future-ready |
|---|---|---|---|---|---|---|---|
| Grit | **Brave** | Courage | 1 | Brave | Courage | I do the right thing while my knees shake | |
| Grit | Brave | Courage | 1 | Keep Going | Perseverance (grit) | Not yet… try again, a new way | |
| Grit | Brave | Courage | 1 | Bounce Back | Resilience | Fall down, feel it, get back up | Yes |
| Grit | Brave | Courage | 1 | Truth-Teller | Honesty and integrity | I say what's true, even when it's hard | |
| Grace | **Kind & Fair** | Justice | 2 | Kind | Compassion and empathy | I notice how you feel, and help | Yes |
| Grace | Kind & Fair | Justice | 2 | Fair Play | Fairness | Everyone gets a turn and a say | |
| Grace | Kind & Fair | Justice | 2 | Thankful | Gratitude | I see the good things people do for me | |
| Grace | Kind & Fair | Justice | 2 | Better Together | Teamwork | We can do more side by side | |
| Grace | **Wise** | Prudence | 3 | Curious | Love of learning | I wonder, I ask, I find out | Yes |
| Grace | Wise | Prudence | 3 | Think It Through | Good judgment | Stop, think, then choose the wise way | |
| Grace | Wise | Prudence | 3 | Open Mind | Humility | I might be wrong, and that's okay | |
| Grace | Wise | Prudence | 3 | Make Something New | Creativity and imagination | I dream it up and make it real | Yes |
| Grit | **Steady** | Temperance | 4 | Pause Button | Self-control | Stop, breathe, then choose | |
| Grit | Steady | Temperance | 4 | Wait Well | Patience | Good things can take a while | |
| Grit | Steady | Temperance | 4 | One Thing | Focus and attention | I put the rest down and do this | |
| Grit | Steady | Temperance | 4 | Enough | Contentment and moderation | Happy with what I have | |

**The rhythm.** One season per strength family, in this order: Brave, Kind & Fair, Wise, Steady. Every family starts with Season 1 (Brave). Each strength runs about 3 weeks, then comes back later in "remember when" callbacks and on hero cards. The app shows kid words by default, with a switch to grown-up words.

### The Lantern Loop (how each strength is taught)

| Step | What happens | Where it lives | Why |
|---|---|---|---|
| 1. Meet it | The child is the hero of a story where the strength matters | Nightly chapter | R5, R10 |
| 2. Name it | A power phrase and a hand move | Reader, strength page, fridge card | R23 |
| 3. Ask why | "Why do you think…?" instead of stating the moral | Pause & ask | R7, R8 |
| 4. Plan it | Each child makes an if-then plan ("If I want to quit, then I say 'not yet' and try a new way") | Last page, fridge card, if-then builder | R24, R25 |
| 5. Get spotted | A grown-up spots it in real life and praises the effort; it becomes a legend in tonight's chapter | Spotted it → legend | R12, R26 |
| 6. Remember when | Weeks later, the story brings the moment back | "Remember when" callbacks, hero cards | R27 |

### Reading levels and "I can…" ladders

Both are **difficulty ranges, not fixed ages**. The reading-level ranges overlap on purpose. The app sets a starting point from age; the parent can move it. A **stretch setting** moves a child one step up for kids who like a challenge. It must work for a Kindergartner and a 2nd grader who both like a challenge.

**Reading levels** (the page layout the family reads from):

| Level | Usual ages | What the page looks like | With stretch on |
|---|---|---|---|
| Picture book | about 3–5 | 1–2 short lines and a big picture on each page | Moves up to Early chapter |
| Early chapter | about 5–7 | Short paragraphs, a picture on most pages, a few new words explained by the story | Moves up to Chapter |
| Chapter | about 7–9 | Full chapter pages, one picture, richer words | Richer words and a harder "why" question in their Pause & ask |

The canon writes each chapter in two tellings with the same events, choices and Pause & ask: a chapter-book telling (about 900–1,100 words, about 7 minutes read aloud) and a picture-book telling (about 300–450 words over 8–12 pictures). Picture book uses the picture-book telling. Early chapter and Chapter both use the chapter-book telling, laid out differently.

Siblings share one story. The parent sets the family layout, starting from the oldest child's level. Each child's own level and stretch set their pause-and-ask wording, their "I can…" rung and their if-then plan.

**"I can…" ladders** (four rungs per strength; example: Keep Going):

| Rung | Usual ages | I can… | If-then plan |
|---|---|---|---|
| 1. Little | about 3–4 | "I can try one more time." | If it's hard, then I take a lantern breath and try one more time. |
| 2. Middle | about 5–6 | "I can keep going when something is tricky, and try a new way." | If I want to quit, then I say "not yet" and try a new way. |
| 3. Big | about 7–9 | "I can break a hard thing into small steps and stick with it for days." | If it feels too big, then I do just the next small step. |
| 4. Stretch | one step up, for kids who like a challenge | "I can make my own plan for a big goal and keep it up, even on days I don't feel like it." | If it gets boring or hard, then I do one small step and check my plan. |

All four Season 1 ladders (Brave, Keep Going, Bounce Back, Truth-Teller) are in the canon, section 5.

In the sample family, Alfie (5, Kindergarten) starts on rung 2 and moves to rung 3 with stretch on. Hugh (7, 2nd grade) starts on rung 3 and moves to rung 4. Clara (3) starts on rung 1.

---

## 5. The story

The story world lives in `story/canon.md`: the cast, the places, the Season 1 arc part by part and every chapter title. The full rules and classical engine go in the coming `story/bible.md`. This section is the summary.

**The world.** The kids live in **Candlemere**, a village in the land of **the Westering**. Names are Tolkien-inspired, built from Old English roots (-combe, -wold, -holt, -mere, -ford, -stead): grounded and old-feeling, never whimsical or Harry Potter-like. The sidekick is **Ember, a fox** (she/her). The grandparent character is **Grandma Ruth**. The mentor is **old Hild the wick-seller**, who only asks questions. **The lantern** is the story object and the brand mark: the logo, and one lantern lit per night read.

**The seasons:**

| Season | Strength family | Title | Status |
|---|---|---|---|
| 1 | Brave | **The Last Light of Candlemere** | Settled. The village's lights are going out. The kids and Ember carry the last flame across the Westering to relight the old beacon on Wardlow. |
| 2 | Kind & Fair | The Broken Bridge | Draft title |
| 3 | Wise | The Silent Library | Draft title |
| 4 | Steady | The Long Winter | Draft title |

**The season shape** *(Claude's working assumption, for Jon to confirm; see decisions.md)*:

| Piece | Size |
|---|---|
| Weekly parts per season | 12 (about 12 weeks) |
| Nightly chapters per part | 5, Monday to Friday. Sunday is a rest night; Saturday is the Saturday trial, with no chapter. |
| Chapters per season | 60 |
| Parts per strength | 3 (one part a week, so each strength runs about 3 weeks; in Season 1: Parts 1–3 Brave, 4–6 Keep Going, 7–9 Bounce Back, 10–12 Truth-Teller) |
| Paywall | After Chapter 3 (night 3 of Part 1), on a cliffhanger |

This is the only shape that fits "a chapter every night, 5 nights a week", "each strength runs about 3 weeks" and "paywall after Chapter 3" at once. Chapters advance by reading, never by date: a missed night waits on the same page. The Season 1 canon is written to this shape. Its 12 parts, places and chapter titles live in the canon, not in this plan.

**The content model:**

| Layer | Who makes it | Who checks it | How often |
|---|---|---|---|
| The season (60 chapters) | Claude drafts it from the story bible | Jon reviews it once per season | 4 times a year |
| Nightly personal parts: names, drawn likeness, spotted deeds, idea jar, "something happened today" specials, favorites | AI weaves them into the reviewed chapter | Automatic safety checks, then the parent previews anything personal | Every night |
| Daily stories | — | Jon never reviews daily stories | — |

Copy says "reviewed by a person", never "written by people". The FAQ explains AI use honestly.

**The classical story engine** (underneath the stories, never preachy):

| Rule | What it means in a chapter |
|---|---|
| Aristotle's mean | Virtue is a habit and a mean between two failings. Every chapter is tagged with its virtue and both failings (Brave: between timid and reckless). |
| Right and wrong are real | Good acts earn trust and honor, not prizes. Show virtue rewarded, not just vice punished. |
| A classical echo every chapter | Quietly retell a motif from Homer, Aesop, Scripture (faith toggle on), Arthurian legend, the Stoics or classic fairy tales. Season 1 echoes the Odyssey: the journey there and home again. |
| A Socratic mentor | Old Hild the wick-seller asks questions and never lectures. She gives each child a "pocket question" to ask when she isn't there. |
| Tolkien's influence, not his stories | Ordinary small folk showing quiet courage, hospitality, loyalty, mercy, and the sudden joyful turn at the darkest moment. No Tolkien names, places or plots. |
| Core values | Duty to family and neighbors, gratitude to those who came before, telling the truth, owning your mistakes, mercy, courage in service of others. |
| Warm on top | The machinery lives in the bible and the prompts. The surface stays warm, fun and modern. |

**The "something happened today" rule.** A real event is never retold as it happened. It becomes an adventure where the kids help others make it right, and nobody is the villain. The parent previews it before reading. *(R5, R15)*

---

## 6. The full feature list

Priority key: **MVP** = needed to test the core promise with ~10–50 families · **V1** = launch to the public · **V2** = after revenue and retention are proven · **Later** = after $10K/month recurring revenue or legal review · **Proto** = prototype now, behind a feature flag, off in production.
"Exists" = the current app already has a version to reuse.

### A. Family & characters
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| A1 | **Avatar builder** | Tap-to-choose skin, hair, eyes, glasses, freckles, clothes → a storybook portrait | Likeness drives behavior (R4); no photo risk (R18); the day-0 "wow" (R17) | **MVP** |
| A2 | **Character sheet per child** | One locked reference image and description used for every illustration | Solves the likeness drift that sinks Gemini (R16) | **MVP** |
| A3 | **Siblings in one story** | Up to 4 kids co-star; one flat family price | Multi-kid families; each child grows at their own level (R2) | **MVP** |
| A4 | **Per-child level** | Age sets a starting reading level and "I can…" rung; the parent can move it | Serves 3-year-olds and 8-year-olds together (R2); no nightly choices (R3). *Exists: reading level + length* | **MVP** |
| A5 | **Stretch setting** | Moves a child one step up their own reading level and "I can…" ladder. That changes their pause-and-ask wording, their rung and their if-then plan. The shared page layout stays the parent's family setting. | Kids who like a challenge (a Kindergartner and a 2nd grader both) | **MVP** |
| A6 | **The little details** | Favorite animal, what they love, one worry (optional) | Makes each chapter feel made for them; feeds the nightly personal parts | **MVP** |
| A7 | **Ember the fox** | The sidekick in every chapter | Delight and continuity; animals as sidekicks, humans as heroes (R5) | **MVP** |
| A8 | **What matters in your house** | The family's values, anything hard lately (optional), and the faith-friendly toggle | Shapes the personal parts gently; nobody gets called out | **MVP** |
| A9 | **Grown-ups as cameos** | The family's own grandparent takes Grandma Ruth's place in the story (name, drawn likeness, what the kids call them); two grandparents can share the hearth. In Season 1, Mom and Dad are away on the winter drove and come home for the last chapter's feast. | Connection; the grandparent hook (R19) | V2 |
| A10 | **Birthday age-up** | Avatar, reading level and ladder rung grow each year | Keeps the story fitting the child; a renewal moment (R17) | V2 |

### B. Stories & curriculum
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| B1 | **Story bible + classical engine** | World, characters, the Lantern Loop, the mean tags, the classical echoes, the safety rules | One spec behind every draft and prompt (R5–R10) | **MVP** (Phase 0) |
| B2 | **The season** | 60 nightly chapters in 12 weekly parts of 5, AI-drafted from the bible, reviewed by Jon once per season | Serialization (R10); reviewed text (R15); the reason to renew (R17) | **MVP** (Season 1) |
| B3 | **16 strengths** | One season per strength family; each strength about 3 weeks, then it comes back | Fewer concepts, repeated and spaced (R27). *Exists: 16-virtue data model* | **MVP** |
| B4 | **"I can…" ladders + if-then plans** | Four rungs per strength; each child's plan at their rung | Plans help kids follow through (R24, R25) | **MVP** |
| B5 | **Power phrase + move** | A short phrase and a hand gesture for each strength | Gesture helps learning last (R23) | **MVP** |
| B6 | **Nightly personal parts** | Names, likeness, spotted deeds, idea jar, favorites woven into the reviewed chapter, with automatic safety checks | Personal every night without Jon reviewing daily stories | **MVP** |
| B7 | **"Something happened today" special** | Parent describes a real moment → an adventure where the kids help make it right; nobody is the villain; the **parent previews it** | The original big idea, made safe (R5, R15) | V1 (Family) |
| B8 | **Faith-friendly toggle** | A weekly verse, Scripture among the classical echoes, and Bible stories in the library | Serves faith families without changing the core for others | **MVP** (verse, echoes) · V1 (library) |
| B9 | **Classic book pairing** | Each strength pairs with real books from the 60+ library (with Bookshop/Amazon links); favors books where virtue is rewarded | Keeps the curated library central (R6); small affiliate income. *Exists: book library + virtue mapping* | **MVP** |
| B10 | **Classics retold, starring your kids** | Public-domain Aesop, Andersen, Grimm with the kids in them; reviewed once | Cheap to serve; trusted | V1 |

### C. Reading, on screen and on paper
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| C1 | **Nightlight reader** | Warm, dim, large type, parent-facing; page turns | Screen-light bedtime (R13) | **MVP** |
| C2 | **Picture ↔ chapter layout** | The three reading levels from section 4 | One product, ages 3–9 (R2) | **MVP** |
| C3 | **Pause & ask** | 1–2 questions per chapter, one "why do you think…?", at each child's level | Dialogic reading (R8); explaining (R7) | **MVP** |
| C4 | **"Last time…" recap** | One line at the start of each chapter | Continuity (R10) | **MVP** |
| C5 | **"Remember when" callbacks** | Weeks later, Ember whispers "Remember when…?" and hands a child back their own brave moment, from the story or from a legend | Spacing (R27) | **MVP** |
| C6 | **The kids choose the path** | One vote a week, at the end of Wednesday's chapter. Both choices are good. The vote changes Thursday's route and scenes, never the season arc. | Imagination and a reason to come back (R10) | V1 |
| C7 | **Print hub** | One place to print tonight's or this week's paper | Printing is core (R13) | **MVP** |
| C8 | **Fold-a-book** | Tonight's chapter on one sheet: fold, snip, an 8-page book | Screen-free and something to make and hold (R13). *Exists: print/PDF* | **MVP** |
| C9 | **Hero trading cards** | Cards of each child's legends and strengths, with the power phrase | Kids collect and show them off; each card is a spaced review (R27) | **MVP** |
| C10 | **Staple booklet** | The week's chapters, stapled, with coloring pages | Screen-free weeks (R13) | **MVP** |
| C11 | **Paper nights light a lantern** | "We read it on paper" counts as a night read | Paper counts (R11, R13) | **MVP** |
| C12 | **Recorded chapters** | A parent or grandparent records a real chapter on their phone | Parent-voice effect (R14) | V1 |
| C13 | **Family story voice** | A consented voice that can read any chapter (see table K) | Every chapter in a familiar voice (R14) | Proto → Heirloom after legal review |
| C14 | **Stock narrator** | A warm narrator for nights nobody can read, using the same voice layer as K | Travel nights | V2 |
| C15 | **Yoto export** | Real recorded chapters to a Yoto Make-Your-Own card; never the family story voice | Screen-free audio families already own | V2 |
| C16 | **Offline + install to home screen** | Works without signal; installs like an app (PWA) | Bedtime reliability | V1 |

### D. The habit loop (getting families back every night)
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| D1 | **Tonight home screen** | One card, one button; the chapter is already made | One tap (R3); no loading | **MVP** |
| D2 | **Bedtime reminder** | A gentle notification or email at the time the parent picks | A cue tied to the routine (R11) | **MVP** |
| D3 | **The lantern string** | One lantern per night read together, strung across the week. Two states only: lit (a night read together; paper counts) and moon (a rest night, not a gap). Legends show in the chapter and the Hall of Deeds, not on the lanterns. | Rewards the ritual, never behavior (R11, R12) | **MVP** |
| D4 | **Cliffhanger chapters** | Each chapter ends pulling toward tomorrow | The kid asks "what happens next?" (R10) | **MVP** |
| D5 | **Hero ranks** | Ranks earned by nights read together (screen, paper or recorded): Fireside Friend (1 night), Lantern Carrier (10), Wayfarer (25), Beacon-Keeper (45). Every child there that night earns it, and ranks never go down. | Rewards the ritual (R12) | V1 |
| D6 | **Season finale + next season** | A celebration at the end of each season; the next strength family begins | Natural renewal moment (R17) | V1 |

### E. Carrying it into the day
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| E1 | **Tomorrow's mission** | One small, concrete action per child, matching their "I can…" | Modeled behavior + plan (R9, R24) | **MVP** |
| E2 | **Weekly fridge card** | The strength, each child's "I can…" and if-then plan, boxes to check; plus a weekly verse with faith on | Off-screen reminder in the kitchen (R13) | **MVP** |
| E3 | **"Spotted it" → legend** | A grown-up logs a real act (text or voice); it becomes a legend in tonight's chapter; the **parent approves the line**; tips on praising effort | Recognition, not prizes (R12, R26) | **MVP** |
| E4 | **Idea jar** | Kids' ideas become a short side scene in Wednesday's chapter, and the child whose idea it was gets a small real part (Clara's "a dragon who's scared of the dark" becomes a little lost dragon from the hills) | Their imagination in the story; safety-checked like any personal part | **MVP** |
| E5 | **Saturday trial** | One real-world challenge a week, about 20 minutes, with a task for each child at their level. It can be done any day, it stamps the story map, and Monday's chapter remembers it. | Skills shown in real life; a weekly high point | V1 |
| E6 | **Parent coaching tips** | One tip a week: how to praise effort, how to ask why, what's normal at each age | Effort praise works best when parents know what to say (R26) | V1 |
| E7 | **Car & dinner questions** | 3 conversation questions a week for daytime | More practice, no screen | V2 |

### F. Progress & keepsakes
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| F1 | **Story map** | The season's journey across the Westering, one stop per part, from Candlemere to Wardlow Beacon and home again, with each Saturday trial stamped | Something to lose at renewal (R17) | V1 |
| F2 | **Each child's shield** | The existing compass/shield, filled by the strengths each child has met in the story, never by how "good" they were. Legends stay in the Hall of Deeds (F3). | Parents want proof of growth. *Exists: ShieldTracker / Compass* | V1 (reskin) |
| F3 | **Hall of Deeds** | Each child's collected legends | Recognition that lasts | V1 |
| F4 | **Sunday email** | The week ahead: the strength, each child's "I can…", the fridge card to print | Re-engagement; brings paper into the week | V1 |
| F5 | **Yearly hardcover** | The kids' season(s) printed and mailed | Proven print market (R21); part of Heirloom | V1 (with Heirloom) |

### G. Grandparents & sharing
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| G1 | **Share message** | One tap sends tonight's picture and a line to Grandma | Grandparent channel (R19); cheapest growth test | **MVP** |
| G2 | **Large-text read-along page** | Grandma reads along without an account; big type; can react or leave a voice note | Connection; turns an audience into a buyer | V1 |
| G3 | **Record-a-chapter invite** | A grandparent records a real chapter on their phone from a link | A familiar family voice (R14); grandparents weren't tested, but the bond is the point. | V1 |
| G4 | **Gift a year** | A grandparent buys a year for a family (see I5) | How grandparents already spend (R19) | V1 |
| G5 | **Family story voice invite** | A grandparent makes their own story voice from their own link (see K) | R14, R19 | Proto → Heirloom after legal review |
| G6 | **Referral** | Give a month, get a month | Word of mouth | V2 |

### H. Trust, safety & privacy
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| H1 | **No-photo guarantee** | Drawn avatar only; stated everywhere | R18; also a selling point | **MVP** |
| H2 | **Parent previews anything personal** | Legends, idea-jar lines, specials and personal touches are shown to the parent first | R15; brand safety | **MVP** |
| H3 | **Automatic safety checks** | On every AI-woven part and every image | Jon never reviews daily stories, so checks must run every time. *Exists: generation safety rules* | **MVP** |
| H4 | **Honest AI FAQ** | Says stories are AI-drafted from a bible and reviewed by a person, never "written by people"; how personal parts work | Trust (R15) | **MVP** |
| H5 | **Minimal data + parental consent** | The parent owns the account; first names and drawings only; export and delete anytime | COPPA 2025. *Exists: consent modal, local storage* | **MVP** |
| H6 | **COPPA legal review** | Before any child data is stored on a server | The one place not to cut corners | Gate (see section 11) |

### I. Plans & payments
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| I1 | **Free** | Draw every child; the first 3 chapters | The "wow" before paying (R17) | **MVP** |
| I2 | **Paywall after Chapter 3** | Lands on a cliffhanger, after the kids are drawn and a legend is earned | Day-0 matters (R17) | **MVP** |
| I3 | **Family, $49/yr or $5.99/mo** | Every chapter nightly, all siblings, printing, specials | Market-rate price (R17). *Exists: Stripe checkout* | **MVP** |
| I4 | **Founding families, $39/yr** | For the first 500 families. How long the price lasts is not decided; copy makes no "for life" or "first year" promise yet | Early adopters and urgency | **MVP** |
| I5 | **Gift a year** | Family or Heirloom, bought for another family | Grandparent channel (R19) | V1 |
| I6 | **Heirloom, $89/yr or $9.99/mo** | Everything in Family, plus the family story voice and a yearly hardcover | Raises spend per family without raising the entry price | V1, once the voice engine clears legal review |

### J. Marketing website
| # | Page | Why | Priority |
|---|---|---|---|
| J1 | **Homepage** | Leads with the kids as heroes; one button | **MVP** |
| J2 | **How it works** (the Lantern Loop, explained) | Parents want to understand the method | V1 |
| J3 | **The science, plainly** (findings + sources) | Credibility for skeptical, education-minded parents (R20) | V1 |
| J4 | **Pricing** | Free, Family, founding families, Heirloom, gift | **MVP** |
| J5 | **Questions** (FAQ) | "Is this AI?" answered honestly ("reviewed by a person", never "written by people"); "photos?"; "ages?"; "voices?" | **MVP** |
| J6 | **About / founder** | Parents buy from people | V1 |
| J7 | **For grandparents** (gift, record; the story voice is added once Heirloom clears legal review) | Landing page for the growth channel (R19) | V1 |
| J8 | **Homeschool, classical & faith** | Early adopters; the 16 strengths as a curriculum (R20) | V1 |
| J9 | **Free sample chapter** | Read one without signing up | **MVP** |
| J10 | **Strength guides (SEO)** | "How to teach perseverance to a 5-year-old," each with a sample chapter | V2 |

### K. Family story voice
**Priority: prototype now, behind a feature flag (Phase 0). It ships with Heirloom only after a privacy lawyer's review.** Jon tests it first with his own voice.

| # | Piece | What it is | Why |
|---|---|---|---|
| K1 | **Provider-agnostic voice layer** | One interface with adapters. Start with ElevenLabs voice cloning; add a self-hosted open-source adapter (e.g. Resemble's Chatterbox); compare quality and cost on the same chapter. Check current pricing and docs. | No provider chosen yet |
| K2 | **Own link** | The adult records on their own link, on their own phone. No app, no account. | Nobody can make a voice for someone else |
| K3 | **Spoken consent** | The consent statement is read aloud and stored with a timestamp. The consent record is kept. | Consent is part of the design (R18) |
| K4 | **Guided reading** | About 3 minutes of guided reading | Enough to make the voice |
| K5 | **Create, then preview** | The voice is made, then the owner hears a preview before it's used | No surprises |
| K6 | **The label** | Shown every time: "Made from [name]'s recording, with their permission" | Honesty |
| K7 | **Owner's off switch** | The voice owner can switch it off from their own link, any time. Switching it off also stops any cached chapters in that voice from playing. | The owner stays in control |
| K8 | **Delete removes everything** | Deleting removes the voice, the sample recordings and every cached chapter made in that voice (what happens to the consent record is open question 5) | Trust; biometric law (R18) |
| K9 | **Adults only, own voice only** | Never a child's voice. Kids are never recorded to make a voice. | Safety and law |
| K10 | **Reads only our chapter text** | No free text; nothing typed in | The voice can't be made to say anything else |
| K11 | **No downloads** | Audio plays in the reader only; no file export (so no Yoto export of this voice) | Stops misuse |
| K12 | **Watermark** | Where the provider supports it | Traceable if misused |
| K13 | **Generate once, cache, stream** | Each chapter is generated once and cached; the reader streams it paragraph by paragraph | Cost and speed |
| K14 | **Keys and flag** | Keys live in `.env.local` only, never committed. Behind a feature flag, off in production. | Safety while it's a prototype |
| K15 | **Cost model (step 4)** | About 60 chapters a season × 4 seasons, about 240 a year, each personalized, so each family's audio is generated separately. At the research's list prices (about $0.35–0.70 per 7-minute chapter) that could reach or pass the $89 Heirloom price. Model the per-family yearly cost for each provider. Cost scales with the number of story voices in a family, since each voice needs its own copy of every chapter. Model it per voice, then for 1, 2 and 3 voices per family, and decide whether Heirloom caps the number of voices. | The main business risk of this feature |
| K16 | **Legal review** | Voiceprints are biometric data under Illinois BIPA and similar laws. A privacy lawyer reviews this before any public launch. | Gate (see section 11) |
| K17 | **First milestone** | Jon records the consent statement and samples, Claude creates his voice, and Jon hears Chapter 1 read in it | Proves it end to end |

Real recorded chapters (C12, G3) stay the gold option. The story voice is for every other night.

---

## 7. Deliberately not building (and why)

| Idea | Why not |
|---|---|
| Photo upload for likeness | Never. Likeness comes only from the drawn avatar builder (R18). Photos carry COPPA and biometric-law risk, and 72% of parents rate photo privacy important (R18). |
| An open-ended AI story generator as the product | Commoditized (Gemini is free) and parents distrust unchecked AI text (R15, R16). Stories come from the reviewed season; personal parts are woven in and previewed. |
| Cloning a child's voice | Never. Kids are never recorded to make a voice. |
| Making a voice for someone else | Only the adult, on their own link, with spoken consent. |
| Free-text voice (typing words for a voice to say) | The story voice reads only our chapter text. |
| Voice downloads or export | No downloads of the story voice, including Yoto or MP3. |
| Badges, points or prizes for good behavior | Material rewards undermine helping (R12). Lanterns count nights read, never behavior. |
| Leaderboards or comparing kids | Wrong for 3–9-year-olds and for this brand. |
| Hard daily streaks | Guilt-driven and hollow; 5 of 7 is the research threshold (R11). Rest nights show a moon. |
| Retelling a hard day as it happened | Too-familiar stories teach less (R5), and nobody should feel called out. It becomes an adventure with no villain. |
| Stating the moral at the end | Asking why works better (R7). The mentor asks; the story never lectures. |
| Borrowing Tolkien's names, places or plots | His influence, not his stories. |
| Podcast as the growth channel | No evidence it converts. Grandparent sharing and homeschool communities are better bets. |
| Multilingual, native apps, classroom mode | Later. Focus first. |

---

## 8. The user experience: five loops

1. **Discover (once):** homepage → Who's in the story? → Draw your hero (each child) → the little details → meet Ember → what matters in your house (faith toggle) → Meet your heroes → Chapter 1 (free, no account yet) → save your family (email + consent) → set bedtime.
2. **Nightly (7:30pm, aim for 5 of 7):** reminder → Tonight → reader ("last time…" → story → pause & ask → on Wednesdays, the kids choose the path) → last page (missions, if-then plans, cliffhanger) → lantern lit → send tonight's picture to Grandma (optional). On paper nights: print the fold-a-book, read it, tap "we read it" and the lantern lights. On voice nights: pick who reads (a recorded chapter or a family story voice).
3. **Daily (daytime, optional, about 10 seconds):** "Did you spot it?" → log a deed (voice or text) → approve tonight's legend. Or: a kid drops an idea in the jar. Or: something happened → describe it → preview the special story before reading.
4. **Weekly (Sunday):** the week ahead (the strength, each child's "I can…" and if-then plan) → print the fridge card, booklet and new hero cards → Saturday trial → stamp the story map.
5. **Seasonal and family (now and then):** season finale → the next strength family begins → shields and Hall of Deeds → the hardcover (Heirloom) → grandparents gift, record or make a story voice → birthday age-up → renewal.

The paywall sits after Chapter 3 (night 3 of Season 1), on a cliffhanger. By then the family has drawn their kids, heard three chapters and earned a legend.

---

## 9. Full screen inventory (the mockup as it stands)

62 phone screens, plus the **Start here** board. Rows and titles match `canvas/project/canvas.json`.

Codes here are board codes from canvas.json, not the feature IDs in section 6.

**1 · The website: win over a skeptical, tired parent in one scroll (9)**
M1 · Homepage · M2 · How it works · M3 · The science, plainly · M4 · Pricing · M5 · Questions · M6 · About / founder · M7 · For grandparents · M8 · Homeschool, classical & faith · M9 · Free sample chapter

**2 · What they'll grow: 16 strengths, and how each one is taught (5)**
V1 · The 16 strengths (Grit + Grace) · V2 · One strength, every age · V3 · The Lantern Loop (the method) · V4 · Kids build an if-then plan · V5 · "Remember when": spaced review

**3 · The first two minutes: from stranger to "that's me!" (8)**
O1 · Who's in the story? · O2 · Draw your hero · O2b · The little details · O3 · Pick a sidekick · O4 · What matters in your house · O5 · Meet your heroes · O6 · Save your family · O7 · Set bedtime

**4 · Every night: one tap, one chapter, one question (8)**
N1 · Tonight (home) · N2 · Reader: picture-book layout · N3 · Reader: chapter layout · N4 · Pause & ask · N5 · The kids choose the path · N6 · Last page: missions + cliffhanger · N7 · Lantern lit, goodnight · N8 · Lantern design

**5 · During the day: what they did, what they dreamed, what happened (6)**
D1 · Did you spot it? · D2 · Approve tonight's legend · D3 · The idea jar (kids' imagination) · D4 · Car & dinner questions · D5 · Tonight's special: something happened · D6 · Parent previews the special story

**6 · Every week: one strength, every child at their own level (4)**
W1 · Sunday: the week ahead · W2 · Fridge card (print) · W3 · Weekly booklet (print) · W4 · Saturday trial

**7 · Print it, fold it, keep it (4)**
R1 · Print something · R2 · How to fold the book · R3 · Fold-a-book print sheet (Letter) · R4 · Hero cards print sheet (Letter)

**8 · Keepsakes & progress: why families stay and renew (5)**
P1 · Story map · P2 · Each child's shield · P3 · Hall of Deeds · P4 · Season finale · P5 · Order the hardcover

**9 · The library: real classics, paired and retold (2)**
L1 · Classics library · L2 · Classics retold, starring your kids

**10 · Grandparents: audience, narrator, gift-giver (4)**
G1 · The text Grandma gets · G2 · Grandma reads along · G3 · Record a chapter · G4 · Give a year

**11 · Family story voice: yes, with consent built in (3)**
F1 · Family story voice · F2 · Grandma records (her phone) · F3 · Story voice ready

**12 · Plans, family settings & privacy (4)**
A1 · After chapter 3: keep going · A2 · Family settings · A3 · Privacy & your data · A4 · Family voices

**Total: 62 screens + Start here.**

**Still to update in the mockup.** The board source in `canvas/project/` still predates decisions.md in these places. The full old-to-new list, board by board, is section 8 of `story/canon.md`.

- **The sample family.** Swap the old sample family for Hugh (7), Alfie (5) and Clara (3) on every board, pronouns included (Alfie is a boy, Clara a girl).
- **The sidekick.** The old sidekick becomes Ember, a fox (she/her).
- **The world.** The old series and village names become The Last Light of Candlemere (Season 1) and Candlemere (the village). The story map ends at Wardlow Beacon. Lines that make the kids chosen ones come out.
- **M1 Homepage.** "One virtue a week" becomes one strength for about 3 weeks.
- **M4 Pricing.** Remove "locked in for as long as you stay" until Jon decides how long the founding price lasts.
- **A1 After chapter 3.** Remove "first year, then $49", for the same reason.
- **O3 Pick a sidekick.** Becomes "Meet Ember" (see "The sidekick step" in section 12).
- **O4 What matters in your house.** Remove the season picker ("Pick the season your family needs first"). Every family starts with Season 1 (Brave).
- **N7 Lantern lit, goodnight.** The title now says "Lantern lit" in canvas.json. The board file is still named `LampLit.dc.html`.
- **N8 Lantern design.** Remove the "Lit + spotted" state. A lantern has two states: lit (a night read together, paper counts) and moon (a rest night).
- **P2 Each child's shield.** Drop the per-child legend counts ("6 chapters · 2 legends"). The shield shows the strengths each child has met, never deeds spotted.

---

## 10. What already exists vs. what's new

| Existing code | Becomes |
|---|---|
| StoryForge (AI generator, saved characters, lengths, print) | The engine that weaves nightly personal parts (B6) and the "something happened today" special (B7), plus the print engine (C7–C10) |
| ChildManager (saved children) | Per-child levels and stretch (A4, A5); character descriptions seed the character sheets (A2) |
| BookExplorer + 60-book virtue library | The classics library (board L1) + B9 pairings; Bible stories join it with faith on |
| ShieldTracker / Compass | F2 each child's shield (reskinned) |
| 16-virtue data model | The 16 strengths, renamed in kid and grown-up words (B3) |
| VirtueQuiz | Folded into "What matters in your house" (A8) |
| Stripe checkout, consent modal, local storage | I1–I6, H5 |
| Landing page | Replaced by J1–J10 |
| **New** | Avatar builder and character sheets; the story bible and season drafts; the reader; the lantern string; missions, if-then plans and ladders; spotted-it legends; idea jar; print hub, fold-a-book, hero cards; share and grandparent flows; the family story voice; the Sunday email |

The biggest new engines: (1) consistent-character illustration, (2) season production (bible → Claude's drafts → Jon's once-a-season review) plus nightly weaving with safety checks, (3) the voice layer, (4) accounts and cloud sync for multiple devices and grandparents.

---

## 11. Phasing

| Phase | What ships | Goal / gate to move on |
|---|---|---|
| **0: Now** | These decisions; the story canon (`story/canon.md`); the story bible (`story/bible.md`); the Season 1 arc (12 parts, every nightly chapter titled); drafts of Chapters 1–3 (sample family committed, Jon's copy in `private/`); the voice-engine prototype behind a flag | Jon would happily read Chapters 1–3 to his own three. Jon hears Chapter 1 in his own voice. The per-family voice cost is modeled. |
| **1: MVP pilot** (~10–50 families) | All **MVP** rows; manual behind the scenes where possible | Families read 4+ nights a week on average; kids ask for the next chapter; some shares turn into gifts |
| **2: V1 launch** | V1 rows; website pages; Heirloom once the voice clears legal review | 200+ paying families; 8%+ free-to-paid |
| **3: V2** | Stock narrator, Yoto export of real recordings, referral, strength guides, cameos, birthday age-up | $10K/month recurring; healthy renewal |
| **Later** | Classroom, multilingual, native apps | $30K/month recurring |

**Guardrails.** Phase 0 work happens on the branch `claude/grit-grace-phase0`. Nothing merges to `main` or touches the live site without Jon's OK. The production backup is the branch `backup/main-2026-09-26`. The repo is public, so every committed file (mockup source, canon, bible, drafts and this plan) uses the sample family: Hugh, Alfie and Clara. The marketing screens (boards M1–M9) always do. Jon's private copy is built from the committed source by `tools/build-private.py`, which swaps in the names from `private/family.json` (gitignored).

**Legal gates:**

| Gate | What | Must happen before |
|---|---|---|
| Trademark | A trademark attorney checks "Grit & Grace". The mark GRIT AND GRACE is registered to Westminster School for educational materials. | Launch |
| COPPA | A lawyer reviews what child data we collect and store | Storing any child data on a server |
| Voice (BIPA) | A privacy lawyer reviews the voice engine; voiceprints are biometric data under Illinois BIPA and similar laws | Any public launch of the voice (it stays behind the flag until then) |

---

## 12. Decisions

### Settled
Everything in [decisions.md](decisions.md): the name, the sample family, Ember, Grandma Ruth, Candlemere and the Westering, the four seasons and their order (every family starts with Season 1, Brave; the O4 season picker comes out of the mockup), the 16 strengths and the Lantern Loop, the classical story engine, the content model (Claude drafts, Jon reviews once per season, the parent previews anything personal), pricing and the paywall, printing, the faith toggle, lanterns, and the voice engine's flow and rules. Read that file first; it wins over this one.

### Still open
1. **Trademark check** on "Grit & Grace" with an attorney, before launch.
2. **Founding-price duration.** For life, or the first year? Two boards promise different things: M4 Pricing says "locked in for as long as you stay" and A1 After chapter 3 says "first year, then $49". Both lines go until Jon decides.
3. **Season shape.** Confirm Claude's working assumption: 12 weekly parts × 5 nightly chapters (Monday to Friday) = 60 chapters a season. The Season 1 canon is written to this shape.
4. **Voice provider**, after the step-4 comparison of ElevenLabs and a self-hosted open-source option on the same chapter, with the per-family cost against $89.
5. **Consent record vs. delete.** "Delete removes everything" and "keep the consent record" pull against each other. The privacy lawyer should say what, if anything, is kept after a delete.
6. **What stays free after Chapter 3.** decisions.md lists drawing every child and the first 3 chapters. The mockup also keeps the classics library and fridge cards free.
7. **Which plan gets real recorded chapters and a stock narrator.** Heirloom is settled as the story voice plus a hardcover; the other two aren't placed yet.
8. **The sidekick step.** With Ember settled, O3 "Pick a sidekick" becomes "meet Ember". The canon proposes that a family pet can join as a second companion: it keeps Grandma company by the hearth or trots alongside, but it doesn't talk or do Ember's jobs. Jon to confirm.
9. **Build pace.** Full-time or part-time sets the timing of each phase.
