# Bedtime Virtues: Full Product Plan
*Features, the reason for each, and the complete user flow. Draft for review, Sept 2026. Nothing gets built until you approve.*

---

## 1. The problem we're solving (what the research says)

| # | Finding | Source | What it means for the product |
|---|---|---|---|
| R1 | Daily reading among 5–8-year-olds fell from 64% to 52% since 2017 | Common Sense Census 2025 | The habit is eroding. Retention matters more than features. |
| R2 | Read-aloud collapses after ages 6–8, yet 40% of 6–11-year-olds wish it continued | Scholastic KFRR | Serve 6–9 deliberately (chapter books, older-kid tone), not just toddlers. |
| R3 | Bedtime is the most stressful time of day for many parents | Industry surveys (weak) + Pew 2025 (42% wish they managed screens better) | The parent at 7:45pm has zero spare energy. Every choice is friction. |
| R4 | A story with the child's photo and name increased sharing; name-only did nothing | ECEJ 2025 (n=315); Kruse 2021 | Consistent visual likeness is core, not a nice-to-have. |
| R5 | Human characters teach better than animals; stories that are too familiar teach less | Larsen 2018; Reading Psychology 2024 | Your kids are the heroes in a story world, not re-enactments of their day. Animals can be sidekicks. |
| R6 | Honesty rewarded beats lying punished | Lee 2014; Liang 2025 | Editorial rule: show the good outcome of virtue. |
| R7 | Asking kids to explain the lesson beats telling them | Walker & Lombrozo 2017 | "Why do you think…?" prompts built into every chapter. |
| R8 | Pause-and-ask reading has moderate, reliable effects | Dialogic reading meta-analyses | Structured questions during reading, not just after. |
| R9 | Modeling one concrete behavior can transfer, even at age 3 | PLOS One 2023 | Each chapter shows one copyable action ("three deep breaths"). |
| R10 | Serialized stories sustain engagement; stand-alone ones decline | Lu, Green et al. 2025 | A continuing saga with cliffhangers, not one-off stories. |
| R11 | Routine benefits grow with each night; 5+ nights/week is the threshold | Mindell 2015 | Target 5 of 7 nights. Rest nights are built in; no guilt streaks. |
| R12 | Material rewards for helping reduced later helping; praise didn't | Warneken & Tomasello 2008 | Reward showing up and reading, never "being good." Recognition, not prizes. |
| R13 | Screens before bed delay sleep; AAP says no screens 1 hour before | AAP; 2024 RCT | Print, audio and nightlight modes. The phone faces the parent, not the child. |
| R14 | Kids' brains respond far more to a parent's voice | Abrams 2016 PNAS | Recorded family voices, including grandparents. |
| R15 | Parents accept AI illustrations if text is human-written and reviewed; most dislike AI-written text | NC State 2025 | Human-written stories + AI-drawn kids. AI text only where the parent approves it. |
| R16 | Free AI storybooks exist (Gemini), but likeness drifts and there's no series | Google; reviews | Our edge: consistent likeness × ongoing series × virtue curriculum. |
| R17 | Education apps: median $43.94/yr; only ~24% of annual plans renew; 55% of trial cancels happen day 0 | RevenueCat 2025–26 | Price ~$49. The "wow" must land in session 1. Renewal needs a reason (the saga, the book). |
| R18 | Child photos = COPPA personal info; AI avatar apps sued under BIPA; 72% of parents rate photo privacy important | FTC; Lensa suit; UK surveys | Avatar builder, never photo upload. Say so loudly. |
| R19 | Grandparents spend ~$2,654/yr on grandkids | AARP 2026 | Grandparents are a buyer, a narrator, and the growth channel. |
| R20 | 3.4M homeschoolers; classical ed growing ~5%/yr; Read-Aloud Revival 110K newsletter | NHERI; Arcadia; RAR | Early-adopter community to launch into. |
| R21 | Personalized print books are a proven market (Wonderbly 11M+ sold) | PRH 2025 | A printed "year of stories" hardcover is a real product. |
| R22 | A competitor (Lulawe) already turns family memories into stories | Lulawe | The "story remembers" mechanic alone isn't a moat. The combination is. |

**The one-sentence strategy:** A nightly, human-written story series that draws your actual kids in, teaches one virtue a week at each child's level, and carries the lesson into the day. It's built so a tired parent can do it in one tap, off-screen where possible, and grandparents can join in.

---

## 2. Design principles (each traces to research)

1. **One tap at bedtime.** Everything is decided before 7:30pm. *(R3, R17)*
2. **Your kids, recognizably, every time.** The same face every chapter. *(R4, R16)*
3. **People write, AI draws.** Human-written stories; AI for illustration and small parent-approved personal touches. *(R15, R16)*
4. **A story that continues.** Seasons and cliffhangers. *(R10, R17)*
5. **Teach through the story, not at the child.** Reward virtue, model one behavior, ask them to explain. *(R5–R9)*
6. **Carry it into the day.** The lesson leaves the screen via missions and the fridge card. *(R9, R12)*
7. **Screen-light bedtime.** Print, audio, nightlight; the parent holds the device. *(R13, R14)*
8. **Reward the ritual, not the child's behavior.** Lamps and unlocks for reading together; recognition (legends) for virtue. *(R11, R12)*
9. **Privacy as a feature.** No photos, minimal data, parent is the account holder. *(R18)*
10. **Family-sized.** Siblings share one story at their own levels; grandparents are first-class. *(R2, R19)*

---

## 3. Who it's for

| Person | Role | What they need |
|---|---|---|
| **The tired parent** (primary) | Buyer + reader | One tap, a good story, a sense their kids are becoming good people, proof it's working |
| **The child, 3–9** | The hero | To see themselves, to find out what happens next, to be recognized |
| **The grandparent** | Buyer, narrator, audience | Connection from a distance, a meaningful gift, hearing their voice read to the kids |
| **Homeschool / classical family** (early adopter) | Buyer + evangelist | A real curriculum, classics, a virtue framework, printables |
| *Teacher (later)* | Buyer | Classroom version, not now |

---

## 4. The full feature list

Priority key: **MVP** = needed to test the core promise with ~10–50 families · **V1** = launch to the public · **V2** = after revenue and retention are proven · **Later** = after $10K/month recurring revenue or legal review.
"Exists" = the current app already has a version to reuse.

### A. Family & characters
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| A1 | **Avatar builder** | Tap-to-choose skin, hair, eyes, glasses, freckles, clothes, one favorite thing → storybook portrait | Likeness drives behavior (R4); no photo risk (R18); the day-0 "wow" (R17) | **MVP** |
| A2 | **Character sheet per child** | One locked reference image and description used for every illustration | Solves the "page drift" that sinks Gemini (R16) | **MVP** |
| A3 | **Siblings in one story** | Up to 4 kids co-star; one flat family price | Multi-kid families; each child grows at their own level (R2) | **MVP** |
| A4 | **Per-child reading profile** | Age → auto-sets word richness, page layout (picture ↔ chapter), length; adjustable, set once | Serves 3-year-olds and 8-year-olds together (R2); no nightly choices (R3). *Exists: reading level + length* | **MVP** |
| A5 | **Sidekick** | Pet or animal companion (fox, the family dog) | Delight and continuity; animals as sidekicks, humans as heroes (R5) | V1 |
| A6 | **Grown-ups as characters** | Optional Mom/Dad/Grandpa cameos in the story | Connection; the grandparent hook (R19) | V2 |
| A7 | **Birthday age-up** | Avatar and reading level grow each year | Keeps the story fitting the child as they grow; a renewal moment (R17) | V2 |

### B. Stories & curriculum
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| B1 | **Season saga** | A human-written serialized adventure (~8–12 chapters per virtue arc, 4 seasons/year = 4 cardinal virtues) with the family's kids inserted | Serialization sustains engagement (R10); human text (R15); the reason to renew (R17) | **MVP** (Season 1) |
| B2 | **Virtue of the week** | 16 sub-virtues rotated one per week, rolling up to the 4 cardinal virtues | Fewer concepts, repeated (poster research); Franklin's one-at-a-time method. *Exists: 16-virtue data model* | **MVP** |
| B3 | **"I can…" per child per week** | Age-scaled behavior statement for each kid (3 / 5 / 8) | Your poster framework; shared vocabulary across siblings | **MVP** |
| B4 | **Story craft rules** (editorial bible) | Human hero; virtue rewarded; one modeled behavior; explain-why prompt; cliffhanger; no preaching | R5–R10, all in one spec | **MVP** |
| B5 | **Retold classics shelf** | Public-domain Aesop, Andersen, Grimm retold with the kids in them; instant and reviewed once | Alternative when the saga isn't wanted; cheap to serve; trusted | V1 |
| B6 | **"Something happened today" story** | Parent describes a real struggle → a story on that theme, guardrailed, **parent previews before reading** | Your original big idea, kept but made safe: parents dislike raw AI text (R15), so the parent approves it | V1 (Family plan) |
| B7 | **Classic book pairing** | Each chapter pairs with a real book from the 60+ library (with Bookshop/Amazon links) | Keeps your curated library central; small affiliate revenue. *Exists: book library + virtue mapping* | **MVP** |
| B8 | **Human review queue** | Every generated image and every AI-touched line is reviewed (parent-approved for personal lines) | Brand safety (R15); a single bad story loses a family | **MVP** (process) |

### C. The reading experience
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| C1 | **Nightlight reader** | Warm, dim, large type, parent-facing; page turns | Screen-light bedtime (R13) | **MVP** |
| C2 | **Picture ↔ chapter layout** | Toddler: 1–2 lines and a big image; 8-year-old: chapter text and 1 image | One product, ages 3–9 (R2) | **MVP** |
| C3 | **Pause & ask prompts** | 1–2 inline questions per chapter, one "why do you think…?" | Dialogic reading (R8); explanation (R7) | **MVP** |
| C4 | **"Last time…" recap** | One-line recap at the start of each chapter | Retrieval and continuity (R10) | **MVP** |
| C5 | **Printable booklet** | Fold-and-staple PDF of the week's chapters with illustrations | Screen-free (R13); print shows a stronger learning edge (Kucirkova). *Exists: print/PDF* | **MVP** |
| C6 | **Family voice recording** | Parent or grandparent records a chapter from their own phone; plays at bedtime | Parent-voice effect (R14); grandparent hook (R19) | V1 (Heirloom) |
| C7 | **Narrator voice (AI)** | Warm narration for nights the parent can't read | Coverage for travel nights; cost ~$0.35–0.70/chapter so Heirloom only | V2 |
| C8 | **Yoto / MP3 export** | Send audio to a Yoto Make-Your-Own card | Screen-free audio families already own | V2 |
| C9 | **Offline + install to home screen** | Works without signal; installs like an app (PWA) | Bedtime reliability; the roadmap already lists PWA | V1 |

### D. The habit loop (getting families back every night)
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| D1 | **Tonight home screen** | One card, one button; the chapter is already written | One tap (R3); pre-generated so there's no loading | **MVP** |
| D2 | **Bedtime reminder** | Gentle notification or email at the time the parent picks | Habit cue anchored to routine (Lally; R11) | **MVP** |
| D3 | **Weekly lamps (5 of 7)** | Visual week; rest nights built in; no punishment for a miss | Routine dose-response (R11); avoids streak guilt (Duolingo downside) | **MVP** |
| D4 | **Cliffhanger unlocks** | The next chapter unlocks tomorrow night | Serial pull comes from the kid asking "what happens next?" (R10) | **MVP** |
| D5 | **Hero ranks** | Ranks earned by reading together (Apprentice → Lantern-Bearer → Knight of the Road) | Rewards the ritual, not the child's behavior (R12) | V1 |
| D6 | **Season finale + next season** | Celebration at the end of each arc; the new season opens with a new virtue | Natural renewal moments (R17) | V1 |

### E. Carrying it into the day
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| E1 | **Tomorrow's mission** | One small, concrete action per child, matching their "I can…" | Modeled behavior + plan (R9); the Alpha "show it, don't display it" idea | **MVP** |
| E2 | **Weekly fridge card** | Printable page: the virtue, each child's "I can…", boxes to check | Off-screen reminder in the kitchen; research on visual routines | **MVP** |
| E3 | **"Spotted it" → legend** | Parent logs a real virtuous act (text or voice); it opens tonight's chapter as a legend; the **parent approves the line** | Recognition not prizes (R12); the loop that makes this more than a story app | **MVP** |
| E4 | **Saturday trial** | End-of-week real-world challenge per child ("do one brave thing") | Demonstrated skills (Alpha AlphaTest idea); a weekly climax | V1 |
| E5 | **Parent coaching tips** | One tip a week: how to praise, how to ask, what's normal at each age | Parents want guidance; praise research shows general praise works | V1 |
| E6 | **Car & dinner question cards** | 3 conversation questions per week for daytime | More practice at no extra cost; reaches the day without a screen | V2 |

### F. Progress & keepsakes
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| F1 | **Virtue shield per child** | The existing compass/shield, filled by chapters read and deeds spotted | Parents want proof of growth. *Exists: ShieldTracker / Compass* | V1 (reskin) |
| F2 | **Hall of Deeds** | Each child's collected legends | Recognition that lasts; emotional reason to stay | V1 |
| F3 | **Weekly recap email** | "This week: 5 nights, courage, 3 deeds spotted" plus the next week's card | Re-engagement; brings the fridge card to the inbox | V1 |
| F4 | **Year-in-review hardcover** | The kids' season(s) printed as a real book | Proven print market (R21); Heirloom value; renewal anchor | V2 |

### G. Grandparents & sharing
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| G1 | **Share card** | One tap sends "Theo, June & Max crossed the bridge tonight" with the illustration | Grandparent channel (R19); cheapest growth test | **MVP** |
| G2 | **Grandparent read-along link** | Grandma reads the chapter without an account; can react or leave a voice note | Connection; turns an audience into a buyer | V1 |
| G3 | **Record-a-chapter invite** | Grandparent records narration from their phone | Parent-voice effect extends to grandparents (R14) | V1 |
| G4 | **Gift a year** | Grandparent buys Family or Heirloom for the family | $805/yr average gift spend (R19) | V1 |
| G5 | **Referral** | Give a month, get a month | On the roadmap; word of mouth | V2 |

### H. Plans & payments
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| H1 | **Free** | Draw every child, first 3 chapters, fridge cards, library | The "wow" before paying (R17) | **MVP** |
| H2 | **Family, $49/yr or $5.99/mo** | Everything nightly, all siblings | Market-rate price (R17). *Exists: Stripe checkout* | **MVP** |
| H3 | **Heirloom, $89/yr** | Plus voice recording and one printed hardcover a year | Raises spend per family without raising the entry price | V1 |
| H4 | **Founding-family price** | $39/yr for the first 500 families, locked for life | Early adopters and urgency; tests price sensitivity | **MVP** |
| H5 | **Price test** | $39 / $49 / $59 variants | Validate before committing | **MVP** (experiment) |

### I. Trust, safety & privacy
| # | Feature | What it is | Why | Priority |
|---|---|---|---|---|
| I1 | **No-photo guarantee** | Avatar only; stated everywhere | R18; also a selling point | **MVP** |
| I2 | **Parent-approved personal lines** | Anything AI-personalized is shown to the parent first | R15; brand safety | **MVP** |
| I3 | **Minimal data + parental consent** | Parent is the account holder; first names only; data export and delete | COPPA 2025. *Exists: consent modal, local storage* | **MVP** |
| I4 | **Content safety filters** | On any generated text or image | *Exists: generation safety rules*; extend to images | **MVP** |
| I5 | **COPPA legal review** | Before storing child data on a server | $2–5K; the one place not to cut corners | Before V1 |

### J. Marketing website
| # | Page | Why | Priority |
|---|---|---|---|
| J1 | **Homepage** (5 sections as mocked) | Leads with the kids as heroes; one button | **MVP** |
| J2 | **How it works** (the full loop, explained) | Parents want to understand the method | V1 |
| J3 | **The research** (plain-language findings + sources) | Credibility for skeptical, education-minded parents (R20) | V1 |
| J4 | **About / founder** | Parents buy from people; already on your roadmap | V1 |
| J5 | **Grandparents page** (gift + record) | Dedicated landing page for the growth channel (R19) | V1 |
| J6 | **Homeschool & classical page** | Early-adopter community; curriculum view of the 16 virtues (R20) | V1 |
| J7 | **Virtue guides (SEO)** | "How to teach courage to a 5-year-old," each with a sample chapter; already on your roadmap | V2 |
| J8 | **Pricing & FAQ** | "Is this AI?", "photos?", "ages?" | **MVP** |

### Deliberately not building (and why)
| Idea | Why not |
|---|---|
| Photo upload for likeness | COPPA + biometric-law risk, and 72% of parents worry about photo privacy (R18). Revisit only after legal review. |
| Freeform AI generator as the main product | Commoditized (Gemini is free) and parents distrust AI text (R15, R16). It stays as B6, parent-previewed. |
| Badges, points or prizes for good behavior | Material rewards undermine prosocial behavior (R12). |
| Leaderboards or social comparison | Wrong for 3–9-year-olds and for this brand. |
| Hard daily streaks | Guilt-driven, hollow engagement; 5 of 7 is the research threshold (R11). |
| Podcast as the growth channel | No evidence it converts; grandparent sharing and homeschool communities are better bets. |
| Multilingual, native apps, classroom mode | Later. Focus first. |

---

## 5. The user experience: five loops

1. **Discover (once):** homepage → "Draw your child in" → avatar builder → Meet your heroes → Chapter 1 (free, no account yet) → save family (email) → set bedtime reminder.
2. **Nightly (7:30pm, 5–7×/week):** reminder → Tonight → reader (recap → story → pause & ask → story) → last page (who they were tonight + tomorrow's missions + cliffhanger) → lamp lit → share card (optional).
3. **Daily (daytime, optional, 10 seconds):** "Did you spot it?" → log a deed (voice or text) → preview the legend line → approve → it opens tonight's chapter.
4. **Weekly (Sunday):** recap email → next week's virtue and each child's "I can…" → print the fridge card and booklet → Saturday trial result → season progress.
5. **Seasonal / family (occasional):** season finale → next season → shield and Hall of Deeds → hardcover order → grandparent gift and record → birthday age-up → renewal.

The paywall sits after Chapter 3 (loop 2, night 3). By then the family has had the "wow," a cliffhanger, and a spotted deed.

---

## 6. Full screen inventory (what the complete mockup will show)

**Marketing site (9)**
M1 Homepage · M2 How it works · M3 The research · M4 Pricing · M5 FAQ · M6 About/founder · M7 Grandparents (gift + record) · M8 Homeschool & classical · M9 Sample chapter (read one free without signup)

**Onboarding (7)**
O1 "Who's reading tonight?" (number and ages of kids) · O2 Avatar builder (per child) · O3 Sidekick pick · O4 Meet your heroes · O5 Chapter 1 reader · O6 Save your family (email + consent) · O7 Set bedtime and reminder

**Nightly (7)**
N1 Tonight home · N2 "Last time…" recap · N3 Reader: picture-book layout (toddler) · N4 Reader: chapter layout (8-year-old) · N5 Pause & ask · N6 Last page: who they were + missions + cliffhanger · N7 Lamp lit + share prompt

**Daytime (3)**
D1 "Did you spot it?" · D2 Legend preview and approve · D3 Car/dinner question card

**Weekly (4)**
W1 Sunday: next week's virtue + "I can…" per child · W2 Fridge card (print view) · W3 Weekly booklet (print view) · W4 Saturday trial

**Progress & keepsakes (4)**
P1 Family shield · P2 Child's Hall of Deeds · P3 Season finale · P4 Hardcover preview and order

**Library & alternatives (3)**
L1 Classics library (virtue and age filters) · L2 Retold classics shelf (starring your kids) · L3 "Something happened today" (parent preview)

**Grandparents (4)**
G1 Share card received · G2 Read-along page · G3 Record a chapter · G4 Gift a year

**Account & plans (5)**
A1 Paywall after Chapter 3 · A2 Plans · A3 Family settings (kids, profiles, bedtime) · A4 Privacy & data · A5 Voice recordings

**Total: 46 screens.** About 25 are needed for the MVP test.

---

## 7. What already exists vs. what's new

| Existing code | Becomes |
|---|---|
| StoryForge (AI generator, saved characters, lengths, print) | B6 "Something happened today" + the print engine (C5); character descriptions seed A2 |
| BookExplorer + 60-book virtue library | L1 classics library + B7 chapter pairings |
| ShieldTracker / Compass | F1 family shield (reskinned) |
| 16-virtue data model | B2 virtue of the week |
| VirtueQuiz | Optional "Help me pick this season's virtue" |
| Stripe checkout, consent modal, local storage | H2, I3 |
| Landing page | Replaced by J1–J8 |
| **New** | Avatar builder and character sheets, season saga content, reader, lamps, missions, spotted-it legends, fridge card, share and grandparent flows, recap email |

The biggest new "engines" for later: (1) consistent-character illustration, (2) saga content production (writing ~12 chapters per season), (3) accounts and cloud sync for multi-device and grandparents.

---

## 8. Phasing

| Phase | What ships | Goal / gate to move on |
|---|---|---|
| **0: Content** (2–4 wks) | Editorial bible (B4), Season 1 outline + 12 chapters, avatar art style locked | You'd happily read it to your own three |
| **1: MVP pilot** (~10–50 families) | All **MVP** rows; manual behind the scenes where possible (e.g., you or AI generate illustrations offline) | ≥4 nights/week average; kids ask for the next chapter; ≥5% grandparent share-to-gift; price test result |
| **2: V1 launch** | V1 rows; homeschool and grandparent pages; legal review done | 200+ paying families; ≥8% free-to-paid |
| **3: V2** | Hardcover, AI narrator, Yoto export, referral, SEO guides | $10K/month recurring; healthy renewal |
| **Later** | Classroom, multilingual, photo-to-avatar (after counsel), native apps | $30K/month recurring |

---

## 9. Decisions I need from you

1. **Name:** Bedtime Virtues, or a new name before content and print exist?
2. **Your role in content:** do you write or edit Season 1, or should I draft it for your edit?
3. **Ambition:** full-time build or part-time (sets the phase timing)?
4. **Voice:** will you (or a grandparent) record the Season 1 sample narration?
5. **Faith framing:** stay secular-classical (broadest) or offer an optional faith-friendly track?
6. **The "something happened today" story (B6):** keep it in Family, or park it to keep the product purely human-written?
