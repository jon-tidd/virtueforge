# Family story voice: the prototype

**For:** Jon
**Date:** 27 September 2026
**Status:** prototype. It runs only on your Mac, only while you run the dev server, and only when you switch it on. It's off in production and on every Vercel deployment.

This is the "family story voice" from `decisions.md`: a grown-up reads a permission statement and about 3 minutes of story text, and we make a voice that reads Grit & Grace chapters in their voice. The prototype exists for one reason: the **first milestone**, which is you recording your own voice and hearing Chapter 1 read in it. It also lets you compare ElevenLabs with the open-source Chatterbox on the same chapter, and check what it would cost per family.

Engineers: the technical design is in `engine-design.md`, and providers, prices and legal notes are in `provider-research.md`.

---

## 1. What it does, and what it doesn't

**It does:**

- Walks one grown-up through the flow in the mockups (VoiceIntro, VoiceCapture, VoiceReady): who's recording, the permission statement read aloud, about 3 minutes of guided reading, making the voice, a preview, then Chapter 1.
- Makes the voice with **ElevenLabs** (Instant Voice Cloning), and optionally with **Chatterbox** (hosted on fal.ai) so you can compare them.
- Plays the chapter **paragraph by paragraph**. Each paragraph is made once and saved, so listening again costs nothing. It stops at the "Pause & ask" question.
- Swaps the sample children (Hugh, Alfie, Clara, and Grandma Ruth) for your family's real names while it reads, using your private family file.
- Gives the voice owner a private **owner link** with an off switch and a "delete everything" button.
- Shows a side-by-side **compare page** with speed and cost, and a **cost script** that prices a family's year against the $89 Heirloom plan.

**It doesn't (yet):**

- **Read the real Chapter 1.** Season 1 chapters haven't been written yet. Until `docs/redesign/story/season-1/s1-ch01.md` exists, "Chapter 1" is the free sample page from canon §8: 6 paragraphs, about 1,200 characters. A full chapter is about 5,750. When the real file lands, the lab picks it up on its own.
- **Work inside the real app.** There are no accounts, no Supabase, and nothing on the live site.
- **Invite Grandma by text.** Whoever records has to sit at your computer.
- **Record real chapters in someone's actual voice** (the RecordChapter mockup), or offer a "Who reads tonight?" picker (the Voices mockup). Those are app features for later.
- **Check what was actually said.** The permission recording is timed, fingerprinted and stored, but nothing transcribes it or checks that there's only one adult speaker. The three tick boxes are the only guard against a child's voice.
- **Collect a written signature.** Illinois law needs one before any real family records (see section 9).
- **Use Replicate, Azure or Speechify.** Hosted Chatterbox runs on fal.ai only. Replicate hosts the same model at the same price but isn't wired in.

---

## 2. The rules it enforces

| Rule (decisions.md) | How the prototype keeps it |
|---|---|
| Any voice provider can be swapped in | Every provider sits behind one common interface. ElevenLabs, Chatterbox on fal.ai, a self-hosted Chatterbox server, and a free "Mock" hum for testing are the current adapters. |
| Permission read aloud and kept with the time | You read the statement on screen out loud. We keep the recording, the exact words, the wording version, when you started speaking, when we received it, and a fingerprint of it all. If the words shown don't match what the server expects, it refuses. |
| About 3 minutes of guided reading | Six short passages with a progress bar towards 3:00. It won't make a voice from less than 1 minute. |
| Make the voice, then preview it | First you hear one paragraph with the label. Then "Sounds like me. Read Chapter 1". |
| The label | "Made from [name]'s recording, with their permission" appears wherever the voice plays. |
| The owner has an off switch | Only the owner link can switch the voice off. When it's off, nothing plays, not even paragraphs already made. |
| Delete removes everything | This covers the voice at each provider, ElevenLabs' saved history of what it read, your recordings, and every saved paragraph. You get a receipt listing what was removed. |
| Adults only, their own voice, never a child's | There are three separate tick boxes: 18 or older; my own voice, and I'm the one recording; no child's voice in these recordings. The server checks them too. |
| Reads only our chapter text | Nothing accepts typed text. The player can only ask for "voice X, chapter Y, paragraph Z", and the words always come from our chapter files. A test fails if anyone adds a way around this. |
| No downloads | The audio only goes to the lab's own player, which has no download button or right-click menu. Opening an audio address directly is refused. This makes copying harder but can't stop it (section 9). |
| Watermark where the provider supports it | Each paragraph records its watermark: Chatterbox's "PerTh" mark, or ElevenLabs' claimed mark (not yet confirmed in writing). |
| Keep the consent record | After a delete, a text-only receipt stays. It holds the permission words (with the children's names removed), the times and the fingerprints, and no audio. What we may keep is a placeholder until the privacy lawyer decides. |
| Generate each chapter once and cache it | Each paragraph is saved per voice, provider, model and chapter version. Replays are free. |
| Stream it paragraph by paragraph | One paragraph at a time. The next one is fetched while the current one plays. |
| Keys only in `.env.local` | Keys are read from `.env.local` and never shown, logged or saved anywhere else. `.env.local` is never committed. |
| Behind a feature flag, off in production | The lab exists only when `VOICE_ENGINE_ENABLED=true` **and** the app is running in development. In production every lab page and API returns "not found", whatever the setting says. It also needs your lab password (below). |

---

## 3. One-time setup

### 3.1 ElevenLabs (required)

1. Create an account at elevenlabs.io.
2. **Plan: Starter or above.** ElevenLabs' pricing page (the source the research doc used, read 26 Sep 2026) lists Instant Voice Cloning from the **Starter** plan ($6 a month, or $5 a month billed yearly). The free plan doesn't include it. Starter is enough for this test. The **Scale** plan ($299 a month) only matters later: the research doc says ElevenLabs' OEM terms require at least Scale before we offer voices to families.
3. **Before recording,** look in your ElevenLabs account settings for a data-use or "improve our models" switch and turn it off. The research doc (§4) notes ElevenLabs takes a lasting licence to voice models unless you opt out, and opting out only covers data from then on.
4. Create an **API key** on ElevenLabs' API keys page. If it asks which permissions the key needs, allow Text to Speech, Voices and History (delete uses History). If it offers a monthly credit limit, set a small one.

### 3.2 Chatterbox on fal.ai (optional, for the comparison)

1. Create an account at fal.ai and add a little credit. The sample Chapter 1 costs about 3 cents there.
2. Create an API key.
3. Worth knowing: fal.ai gets a 12-second clip of your reading for each session. It expires after 1 hour, and fal.ai can't delete it sooner on request. The delete receipt says so.

(Running Chatterbox on your own GPU server is also supported: `scripts/chatterbox_server.py` has the instructions. Skip it for now.)

### 3.3 The `.env.local` file

Create a plain text file named `.env.local` in the project folder (`/Users/jontidd/code/virtueforge-redesign/.env.local`) with these lines:

```
VOICE_ENGINE_ENABLED=true
VOICE_LAB_SECRET=paste-a-long-random-password-here
VOICE_FAMILY_FILE=docs/redesign/private/family.json
ELEVENLABS_API_KEY=paste-your-elevenlabs-key-here
FAL_KEY=paste-your-fal-key-here
```

- `VOICE_LAB_SECRET` is a password for the lab, at least 16 characters. To make one, run `openssl rand -hex 24` in Terminal and paste the result. You type it once per browser.
- `VOICE_FAMILY_FILE` points at your private family file, which already exists (`build-private.py` uses it). It stays out of git. The lab reads it only while running, to swap in the real names.
- Leave out the `FAL_KEY` line if you skipped fal.ai.
- Optional: `VOICE_MAX_USD_PER_DAY=5` is the daily spending cap. The default is $5; above it the lab stops making new audio for the day, though saved paragraphs still play.
- `.env.local` is gitignored. Never commit it and never paste keys into chat.

### 3.4 Start it

In Terminal, in the project folder:

```
npm install
npm run dev
```

Then open **http://localhost:3000/voice-lab** in Chrome, and type your lab password when asked.

If you're on shared Wi-Fi (a café or an office), use `npm run voice:dev` instead of `npm run dev`. It's the same lab, but only this Mac can reach it.

---

## 4. The first milestone, step by step

**Optional dry run (free, 2 minutes).** Go through the steps below but tick only **Mock (a hum, no keys)** on the "make" step. You'll hear a hum instead of a voice, which is enough to see every screen, including the off switch and delete. Delete the mock voice afterwards from its owner link.

**The real run.** Use a quiet room, the same microphone throughout, and no music or TV. Allow the microphone when the browser asks.

1. **Who's recording.** Type your name and choose "Parent". Tick the three boxes: 18 or older; your own voice; no child's voice. Click **Next: your permission**.
2. **Your permission.** The card says, in your words: *"I'm Jon, and I'd like Grit & Grace to make my story voice, only for reading stories to [your children's names]. I can switch it off whenever I want."* Tap the red button, read it aloud, and tap again to stop. Listen back, then click **Sounds right, use this**. The time you started speaking is stored with it.
   - Check: if the card says "…reading stories to **my family**" instead of your children's names, the family file wasn't found. Check the `VOICE_FAMILY_FILE` line.
3. **Guided reading, about 3 minutes.** There are six short passages. Read them like bedtime: slow, with the voices and the whisper. Re-record any passage you stumble on. When the bar reaches about 3:00, or you've read all six, click **All done. Make my voice**. The passages use the sample names on purpose: they only need to capture how you read.
   - Try to finish within 30 minutes of reading the permission. If you don't, it asks you to read the permission again, and your reading is kept.
4. **Make the voice.** Tick **ElevenLabs** and, if you set it up, **Chatterbox on fal.ai**. Click **Save my recording**.
   - Your **owner link** appears. It's the only way to switch the voice off or delete it, and it's shown once. Save it somewhere private, such as your password manager, then tick "I've saved my owner link".
   - Click **Make my story voice**. Each provider takes a few seconds. If ElevenLabs says it wants extra verification, sign in on the ElevenLabs website, open your voices (ours is named `gg-v_…`) and follow its prompt.
5. **Preview.** You hear the first paragraph of Chapter 1 with the label "Made from Jon's recording, with their permission". If you made two voices, buttons let you switch between providers.
6. **Chapter 1.** Click **Sounds like me. Read Chapter 1**. It reads paragraph by paragraph, with your children's names, and stops at **Pause & ask**. Click **Keep reading** to go on. Under each paragraph you'll see how long it took to make, the character count and the estimated cost. On a second listen it says "cached", which costs nothing.

**Cost of the milestone:** about 12 cents on ElevenLabs at list price, plus about 3 cents on fal.ai.

To listen again later, open http://localhost:3000/voice-lab: your voice is listed under "Voices already made on this machine", with a **Listen** link.

---

## 5. Comparing with Chatterbox

Open **Compare** (top right), or http://localhost:3000/voice-lab/compare.

1. Choose your voice, the chapter, and a provider and model for side **A** and side **B**. For example, ElevenLabs Multilingual v2 against Chatterbox on fal.ai. ElevenLabs v3, ElevenLabs' best-quality model, is also in the list; try it as a third listen.
2. Play each side (only one plays at a time). Listen for:
   - whether it sounds like you from start to finish, or drifts;
   - clicks or jumps between paragraphs;
   - how your children's names sound;
   - the whisper, the loud line and the questions.
3. The table underneath shows, for each side: time to first audio, average time to make a paragraph, characters, the estimated cost of this chapter and of a full chapter, and the **cost per family per year** at 1, 3 and 7 nights a week, each against the $89 price.

To keep in mind: Chatterbox only uses about 12 seconds of your reading, while ElevenLabs uses all of it. So some difference in likeness is expected. The research doc covers why Chatterbox is still worth testing: it's 5 to 10 times cheaper, and self-hosted, the voice never leaves our servers.

---

## 6. Switching the voice off, and deleting it

Open your **owner link**.

- **Off switch.** Flip it off and nothing plays in your voice, not even chapters already made. Flip it back on whenever you like.
- **Delete everything.** Type `delete` to confirm. This removes:
  - the voice at ElevenLabs and ElevenLabs' history of what it read;
  - your permission recording and reading samples;
  - the voice record and every saved paragraph on this Mac.

  The fal.ai clip expires within an hour. You then see a receipt listing what was removed at each provider.
- **What stays:** a text-only receipt holding the permission words with the children's names removed, the times and the fingerprints. There's no audio in it, and the spending log keeps only counts and cost. Whether we may keep even this is a question for the privacy lawyer (research doc, open question 18).
- **Lost the owner link?** The voice ids are listed on the lab's first page. In Terminal, run `npm run voice:owner-link -- v_XXXXXXXXXXXX` to get a new link. The old one stops working.
- **A provider didn't confirm the delete?** The receipt says so, and the lab keeps retrying on its own. To retry now, run `npm run voice:purge-pending`.

---

## 7. Where files live, and how to wipe everything

Everything the lab makes lives in one folder, `.voice-data/`, inside the project folder. Git ignores it.

| Where | What |
|---|---|
| `.voice-data/voices/<voice id>/` | The permission recording (`consent.wav`) and its record (`consent.json`), the reading samples (`samples/`), the 12-second clip for Chatterbox (`reference.wav`), and the voice record. |
| `.voice-data/cache/<voice id>/` | Every paragraph made in that voice. |
| `.voice-data/deletions/` | Receipts from deleted voices: text only. |
| `.voice-data/pending-deletions/` | Provider deletes still being retried. |
| `.voice-data/ledger.jsonl` | The spending log: counts, timings and cost, with no text or audio. |
| `.env.local` | Your keys and lab password. |
| `docs/redesign/private/family.json` | Your family's real names. The lab only reads it. |

**What leaves your Mac:**

- **ElevenLabs** gets your reading samples, but never the permission recording or your name (the voice is named `gg-v_…`). For each paragraph, it also gets the chapter text **with your children's real names**. ElevenLabs keeps that text in its history until the voice is deleted. To clear it after every finished chapter, add `VOICE_PURGE_PROVIDER_HISTORY=after-chapter` to `.env.local`.
- **fal.ai** gets the 12-second clip (it expires after 1 hour) and the chapter text.

**To wipe everything:**

1. Delete each voice from its owner link. This is the step that removes the copies at ElevenLabs.
2. If any receipt says a provider didn't confirm, run `npm run voice:purge-pending` until it does.
3. Sign in to ElevenLabs and check that no voice named `gg-v_…` is left, and clear its history page if anything remains.
4. Stop the dev server (Ctrl+C), then run `rm -rf .voice-data` in the project folder.
5. If you're done for good, delete the voice lines from `.env.local` and revoke the keys on the ElevenLabs and fal.ai websites.

One caveat from the research doc (§4): ElevenLabs' privacy policy says it may keep voice-derived data for up to 3 years, and its backups roll off within 30 days. Only a written agreement with ElevenLabs changes that.

---

## 8. The cost model

Run `node scripts/voice-cost.mjs` (or `npm run voice:cost`). Its output today, before any real audio has been made:

```
Family story voice: cost per Heirloom family per year
Rates: lib/voice/rates.json (checked 2026-09-26). 5,750 characters a chapter; Light 52, Typical 156, Heavy 240 chapters a year; 1 voice per family.
Fit: yes = at or under the $30 margin guide; tight = under $60; no = over that; * = at or over the $89 Heirloom price (loses money).

Option                                              Per chapter       Light       Typical         Heavy
--------------------------------------------------  -----------  ----------  ------------  ------------
ElevenLabs v2/v3, list                                   $0.575  $29.90 yes    $89.70 no*   $138.00 no*
ElevenLabs v2/v3, yearly plan fully used                 $0.477  $24.82 yes     $74.45 no   $114.54 no*
ElevenLabs Flash v2.5, list                              $0.287  $14.95 yes  $44.85 tight     $69.00 no
ElevenLabs Flash v2.5, yearly plan fully used            $0.241  $12.56 yes  $37.67 tight  $57.96 tight
Chatterbox self-hosted, planning (L4)                    $0.070   $3.64 yes    $10.92 yes    $16.80 yes
Chatterbox self-hosted, worst case (L40S)                $0.260  $13.52 yes  $40.56 tight     $62.40 no
Chatterbox on fal.ai / Replicate                         $0.144   $7.48 yes    $22.43 yes  $34.50 tight
ChatterboxHD on fal.ai / chatterbox-pro                  $0.230  $11.96 yes  $35.88 tight  $55.20 tight
Azure personal voice (+$7.20/yr storage per voice)       $0.138  $14.38 yes    $28.73 yes  $40.32 tight
Speechify (Pro overage)                                  $0.046   $2.39 yes     $7.18 yes    $11.04 yes

Plan fees are not included (ElevenLabs Scale $2,990/yr, Speechify Pro $99/mo, a warm GPU at bedtime ~$876/yr): see provider-research.md §3.

Measured: no ledger at /Users/jontidd/code/virtueforge-redesign/.voice-data/ledger.jsonl. Generate some paragraphs in /voice-lab, then run this again.
```

**How to read it:**

- **Light, Typical and Heavy** mean a family choosing the voice 1 night a week, 3 nights a week, or for every chapter: 52, 156 or 240 chapters a year.
- **"yes"** means the voice costs $30 or less per family per year. That's about a third of $89, which leaves room for everything else. A **\*** means the voice alone costs $89 or more, so we'd lose money.
- **ElevenLabs** at list price fits only if a family uses the voice about one night a week (two nights on the cheaper Flash model). At three nights a week it eats the whole $89.
- **Chatterbox** fits comfortably at every level when self-hosted (the planning case), and at Light and Typical on fal.ai.
- These are list prices and leave out monthly plan fees. The research doc (§3) has the full picture.

After you've played real chapters, run it again: it adds a **Measured** section with what each provider actually did on your chapters (characters, speed and cost). For self-hosted Chatterbox, it also prices the GPU time. `npm run voice:cost -- --help` lists the options, such as a different chapter length or price.

---

## 9. Known limits (read before anyone else records)

- **This is a prototype, never for production.** It only runs under `npm run dev` on your Mac. In production, and on every Vercel deployment including previews, the lab doesn't exist, even if someone sets the flag.
- **Only you record, for now.** Internal testing with your own voice is the only use until the two items below are settled.
- **ElevenLabs' terms: get a written OK before any real family records.** ElevenLabs' use policy §9(r) bans products "that target anyone under the age of 13". Its OEM terms bar Free, Starter, Creator and Pro customers from offering the service to their own users. §9(i) asks for "prior written authorization" to build on the API. The research doc (§5, questions 1–7) lists what to ask them in writing. The likely outcome is an Enterprise or written agreement.
- **Illinois BIPA: every speaker signs their own release.** A voice clone very likely counts as a "voiceprint". Before collecting one, BIPA requires:
  - written notice;
  - a **signed written release from each speaker personally**, so Grandma signs for herself and a parent can't sign for her;
  - a published schedule for keeping and destroying the data;
  - consent before the voice goes to a vendor.

  Damages are $1,000 to $5,000 per violation. The prototype has a spoken statement and tick boxes, but no signature and no written notice naming the vendors. A privacy lawyer reviews all of this before any launch (research doc §4, questions 15–22).
- **No DRM.** The lab refuses downloads and hides the player's controls, but anyone can record their speakers, or dig the audio out of the browser's developer tools. That makes copying harder but can't stop it.
- **Watermarks aren't guaranteed.** ElevenLabs says it watermarks audio, but hasn't confirmed this in writing for paid, cloned-voice audio. Chatterbox's PerTh mark shows only that a mark is present, not which family the audio belongs to, and whoever runs the code can remove it.
- **No automatic check for a child's voice or a second speaker.** The tick boxes are the only guard until speech-to-text and speaker checks are added before launch.
- **Name swapping is literal.** It replaces whole words that match the sample names in the family file, so chapter text must use the sample family (Hugh, Alfie, Clara, Grandma Ruth).
- **Sample chapter only** until Season 1 chapters are written (section 1).
- **Chrome is the tested browser**, and it was tested with a simulated microphone, not a real one. Safari should work but hasn't been tried.

---

## For whoever works on the code next

- The code lives in `lib/voice/` (engine, providers, storage, consent), `app/api/voice/` (API routes), `app/voice-lab/` (pages), `components/voice-lab/` (screens) and `scripts/` (cost, owner link, delete retries, the Chatterbox server).
- `npm test` runs 158 tests covering the flag, consent, delete, the cache, the off switch, both provider adapters, the "no typed text" route check and the cost script. `npx tsc --noEmit` and `npm run build` pass. With the flag set, the built app (`next start`) still answers 404 to the lab's pages and API requests.
- The design, data formats and the plan for moving from local files to Supabase are in `engine-design.md`.
