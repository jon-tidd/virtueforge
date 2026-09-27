# Family story voice: provider research

**Date:** September 26, 2026
**For:** Jon
**Scope:** Which voice-cloning provider should read Heirloom chapters in a parent's or grandparent's own voice, what it costs per family against the $89/yr plan, and what the privacy lawyer needs to see.

How to read this:

- Unless a line says otherwise, every price was read from the provider's own official page on **26 September 2026**. Where a page gives an effective date or publish date, it is shown next to the price.
- **[unverified]** means the price or fact could not be confirmed on an official page. It comes from a third party, is inferred, or the official page contradicts itself. Do not budget on these without a quote.
- This is research, not legal advice. Section 4 is written so it can be handed to counsel.

Our design assumptions, used throughout:

- A consenting adult (parent or grandparent, never a child) records a spoken consent statement and about 3 minutes of guided reading.
- The cloned voice reads **only our chapter text**. It is streamed paragraph by paragraph, generated once per chapter per family, and cached. There are no downloads.
- Each chapter is about 1,000 words, about 7 minutes of audio, and about **5,750 characters**. There are about **240 chapters a year** (60 per season x 4 seasons).
- Chapters are personalized with each family's kids' names, so audio can never be shared between families.

---

## 1. The short answer

**Prototype first with ElevenLabs.**

- Use Instant Voice Cloning (IVC) with the **Multilingual v2** model for paragraph-by-paragraph streaming.
- Run **Eleven v3** side by side as the "best quality" comparison.

Why ElevenLabs first:

- **It is self-serve today.** Most rivals with strong consent controls make you wait for approval: Microsoft Azure and Google through sales and allowlists, and OpenAI through sales with a 20-voice cap.
- **It has the best independently measured cloned-voice quality of anything we can actually use.** On Artificial Analysis's blind "cloned voice" leaderboard, Eleven v3 scores 1073 (rank 6) and Multilingual v2 scores 1002. Chatterbox scores 934 (rank 33).
- **It fits our design closely:**
  - IVC wants 1–2 minutes of clean audio, and our 3-minute reading covers that.
  - There is no training wait.
  - Voices are created and deleted through the API.
  - Streaming works over HTTP and WebSocket.
  - "Request stitching" keeps the voice consistent across separately generated paragraphs. This works on Multilingual v2 but not on v3.

**Compare against Chatterbox (Resemble AI), self-hosted.**

- It is MIT-licensed open source and adds a watermark to every output in code.
- It costs roughly **$0.07 per chapter** on a rented GPU. ElevenLabs costs $0.58 at list price.
- The voice never leaves our own servers. That makes the Illinois BIPA vendor-sharing problem and "delete removes everything" much simpler.
- Its trade-offs:
  - Lower independent quality scores.
  - It only uses about 10–15 seconds of the recording.
  - Chapters have to be split into sentence-sized pieces of about 250–350 characters to avoid garbled output.
- Test it first on fal.ai or Replicate using your own voice (no infrastructure to set up). Move it to Modal only if it sounds good enough.

**Run two cheap tracks in parallel:**

- **Apply for Microsoft Azure "personal voice" now.** It has the best policy fit of anything found:
  - Its approved use case describes our product almost word for word ("output constrained and defined by customers", "not publishable or shareable").
  - It requires the speaker's recorded consent statement.
  - It watermarks output.
  - It costs about $0.14 per chapter.
  - The catch is that access is limited to "customers managed by Microsoft", so approval is uncertain and slow.
- **Spend a day testing Speechify.** It is self-serve and very cheap (about $0.05 per chapter). It has a mandatory spoken-challenge consent step that Speechify keeps as a record, and a documented watermark. Its voice quality was not independently benchmarked, and its terms on children were not checked.

**The two biggest risks:**

1. **Provider terms may not allow a children's product.**
   - ElevenLabs' Prohibited Use Policy §9(r) (17 Aug 2026) bans "bundled solutions that target anyone under the age of 13".
   - ElevenLabs' OEM Terms bar Free, Starter, Creator and Pro customers from offering the service to their own users. They also describe end users as businesses using the product for "internal business operations", which does not describe a family.
   - Cartesia's policy bans output that "relates to... individuals under the age of 18".
   - Fish Audio's terms ban sending personal information of children under 13.
   - **Before any real family records a voice**, we need a written OK from whichever provider we pick, most likely an Enterprise or written agreement with ElevenLabs. Internal testing with your own voice is low risk, but ask ElevenLabs on day one anyway, because policy §9(i) also requires "prior written authorization" to build on the API.
2. **Illinois BIPA.**
   - A voice clone very likely involves a "voiceprint".
   - Before collecting one, BIPA requires written notice, a signed written release **from the speaker personally** (so grandma signs for herself, not the parent), a published retention and destruction schedule, and consent before sharing the voice with a vendor.
   - Anyone affected can sue for $1,000 per negligent violation or $5,000 per intentional or reckless violation, plus lawyers' fees.
   - Nine voiceprint class actions were filed in May 2026, one of them against ElevenLabs.

**On cost, in one line:** at list price, ElevenLabs fits inside $89 only if a family uses the voice about **one night a week** (two nights on the cheaper Flash model). Self-hosted Chatterbox, Azure and Speechify fit comfortably even if every chapter is read. See section 3.

---

## 2. Candidates

"Realistic tier" means the plan we would actually need in order to offer the voice to paying families, not a hobby tier. Prices were checked 26 Sep 2026 unless noted. Quality scores are Elo ratings from Artificial Analysis's blind listening tests: the **cloned-voice** board where one exists, otherwise the main board, which uses stock voices and is marked as such.

### Hosted providers

| Provider | Cloning (sample, quality) | Price at realistic tier | Commercial rights | Consent requirement | Watermark | Streaming | Verdict |
|---|---|---|---|---|---|---|---|
| **ElevenLabs** (IVC) | 1–2 min recommended; ElevenLabs warns against more than 3 min. No training step. Cloned-voice Elo: v3 1073 (#6), Multilingual v2 1002 (#22), Flash v2.5 993 (#24). IVC is "less consistent" when asked to speak unlike the sample. | **$0.10 per 1K chars** for v2/v3 and **$0.05 per 1K** for Flash, the same on every API plan (billed in dollars since 7 May 2026). Offering it to our users requires at least the **Scale** plan ($299/mo, 2.99M v2 chars included) under the OEM Terms. Paying yearly gives "two months free" (Scale works out to $249.17/mo), about **$0.083 per 1K** if the included characters are fully used. Enterprise is custom ("significant discounts at scale"). | Paid plans may use output commercially and keep the rights to it. The OEM Terms add restrictions (see risks). | User confirms they have the right and consent. The docs disagree on whether IVC also needs a spoken voice CAPTCHA. Users must be 18+, and voice data from anyone under 18 is banned. ElevenLabs says platforms must "build consent capture into your own flow". | A blog post (22 Sep 2026) says a SynthID watermark goes into "every generation". Current docs say only that ElevenLabs "embeds watermarks". **Whether paid, cloned-voice API output is watermarked is [unverified]**; get it in writing. A free detector exists. | HTTP and WebSocket for v2 and Flash. v3 streams only through the Text-to-Dialogue WebSocket, and cannot use stitching. | **Prototype first.** Launch depends on a written or Enterprise agreement. |
| **Microsoft Azure personal voice** | 5–90 s audio prompt plus a verbal consent statement; 91 languages. No independent cloned-voice score found. | **$24 per 1M chars ($0.024 per 1K)** plus **$0.60 per voice per month** storage. Voice creation is free. (Retail Prices API, effective 1 Feb 2024.) SSML tags beyond `<speak>` and `<voice>` are billed as characters. | Allowed within the use case Microsoft approves. | Limited Access: only "customers managed by Microsoft", with the use case approved at registration. The speaker reads a fixed statement naming our company, and Microsoft compares it with the voice sample. We must disclose to users that the voice is synthetic. | **Yes.** It is added automatically and identifies the voice used; detection is available on request. | Yes. | **Apply now.** Best policy fit; access is the risk. |
| **Speechify** (SpeechifyAI API) | 10–30 s sample. Cloned voices run on Simba 3.2 (English) and 3.0 (6 languages). No independent score found. | **$0.008 per 1K** on Pro ($99/mo, 13.5M chars included, then $8 per 1M). $0.010 on Starter ($10/mo) and $0.006 on Scale ($499/mo). Voice cloning requires Starter or above. | Not specifically checked. | **Mandatory since 23 Sep 2026:** Speechify issues a one-time phrase, the speaker reads it aloud, and Speechify checks it and keeps it as the consent record. | **Yes.** An inaudible watermark is documented (Detect page). Voices made before watermarking was switched on carry no mark. | Not checked. | **One-day test.** Cheap and self-serve with built-in consent. Quality and children's terms unknown. |
| **Google Chirp 3 Instant Custom Voice** | Up to 10 s reference; 30 locales. | **$0.06 per 1K** ($60 per 1M). No free tier. | Standard Google Cloud terms (not checked). | Allowlist through sales. Google's fixed consent script only. | Not mentioned in the docs. | Yes. | Expensive, gated, and no documented watermark. Hold. |
| **OpenAI custom voices** (gpt-4o-mini-tts) | 30 s or less; consent phrase required. | About $0.015/min, which is about $0.018 per 1K **[unverified; third-party estimate from token prices]**. Custom-voice pricing is not published. | Under the TTS Supplemental Agreement. | Eligible customers only, through sales. A fixed consent phrase. We must tell listeners the voice is AI. | Not documented. | Yes (chunked). | **Not viable as is:** hard cap of **20 voices per organization**. |
| **Fish Audio** | Instant clone from about 10 s, with **no ownership check**. Professional clone needs 10+ min and a live check. | **$0.015 per 1K UTF-8 bytes** ($15 per 1M), pay as you go with no subscription. | Premium subscribers, for verified voices they own. | None for instant clones. | Not documented. | WebSocket. | **Terms (18 Aug 2024) ban children's personal information.** Our chapters contain kids' names. Weak consent. Not recommended. |
| **Cartesia** Sonic 3.6 | 10–60 s. Main-board Elo 1277 (#1, stock voices, not cloned). | About $0.037–0.05 per 1K on included credits. Overage is $0.038–0.065 per 1K. | Pro plan ($5/mo) and up. | Own voice, or others' "with explicit consent". | Not documented. | SSE and WebSocket. | **Policy (23 Jul 2025) bans output relating to under-18s.** Needs written clarification. Hold. |
| **Hume Octave** | About 15 s minimum. | $0.05–0.15 per 1K. | Creator plan and up. | An attestation only. | Not documented. | HTTP and WebSocket. | Creating clones through the API appears to be Enterprise-only; also expensive. No. |
| **Inworld TTS-2** | 3–30 s. | TTS-2 $0.0125–0.025 per 1K; Flash $0.007–0.015 per 1K. | All tiers. | Checkbox only ("confirm you have the rights"). | Only a 2025 blog post claims a watermark **[unverified]**. | Realtime model (details not checked). | Cheap but weak consent. Backup only. |
| **Resemble AI hosted** (runs Chatterbox) | "5 seconds, no training"; the cloning API accepts 10 s to 3 min. | Official pricing page lists only detection plans. TTS at $0.0005 per second of audio (about $0.21 per chapter) is **[unverified; third-party, June 2026]**. The docs say the cloning API needs a "Business plan" ($1,000/mo on the current page). Clones: first free, then $2 each (changelog, 8 May 2026; one-time vs. monthly not stated). | Yes. | A consent clip verified against the training voice (Professional Clone). | PerTh watermark "available on every output". | WebSocket (about 200 ms) and HTTP. | Needs a sales quote. Self-hosting the same model is cheaper. |
| **Amazon Polly** | No self-serve cloning (custom "Brand Voice" engagements only). | n/a | n/a | n/a | n/a | n/a | Not viable. |
| **PlayHT** | Shut down after Meta's acquisition in July 2025. | n/a | n/a | n/a | n/a | n/a | Not viable. |

### Self-hosted / open models

| Model | Cloning (sample, quality) | Price (our GPU) | Licence | Consent | Watermark | Streaming | Verdict |
|---|---|---|---|---|---|---|---|
| **Chatterbox** (Resemble AI): original 500M, Turbo 350M, Nano 110M, Multilingual V3 500M | Zero-shot from a short clip. The code **reads only the first ~10 s (15 s for Turbo)**; Turbo rejects clips of 5 s or less. Cloned-voice Elo 934 (#33) for the May 2025 model; newer variants are not yet rated. On the main board, hosted "Chatterbox HD" scores 1101 (what it is is undocumented). Resemble's own blind tests claim wins over ElevenLabs' older and fast models. | About **$0.07 per chapter** on a Modal L4 GPU (planning estimate; range $0.02–0.26, see section 3), about $0.012 per 1K. Hosted: fal.ai $0.025 per 1K (HD $0.04), Replicate $0.025 per 1K. | **MIT** (commercial use OK). | Nothing built in; we build it. | **PerTh**, applied in code to every output. It is a present/absent signal only (no family ID), and whoever runs the code can remove it. | Official code generates about 40 s per call at most, so we generate paragraph by paragraph. A community streaming fork exists. | **Compare against ElevenLabs.** |
| Qwen3-TTS | 3 s reference plus transcript. | GPU time | Apache-2.0 | None | None | Yes (about 97 ms) | Worth a later look. |
| Zonos, Dia, Sesame CSM-1B, Orpheus | Short clips; Zonos about 30 s and Dia about 20 s per call. | GPU time | Apache-2.0 (Orpheus may also carry Llama terms) | None | None | Varies | Lower priority. |
| F5-TTS, XTTS-v2 | | | **Non-commercial** weights | | | | Not allowed. |
| IndexTTS-2.5 | | | bilibili licence; commercial use needs contact | | | | Not without a deal. |
| Kokoro | Cannot clone. | | Apache-2.0 | | | | Not applicable. |

**About our 3-minute recording.** Only ElevenLabs IVC (1–2 min) and Azure (up to 90 s) use a meaningful share of it. Chatterbox, Google, Speechify and OpenAI use 10–30 s. Keep the full recording as the master, and have the app pick the cleanest segment for each provider. Using all 3 minutes with Chatterbox would require per-family fine-tuning, which is untested, needs a GPU with 18 GB or more, and creates a model file that deletion must also remove.

---

## 3. Cost model per Heirloom family per year

### Inputs

- **Characters per chapter:** about 5,750.
- **Chapters available per year:** about 240, roughly 4.6 a week.
- **Revenue per family:** $89/yr, or $119.88/yr for monthly subscribers at $9.99/mo.
- **Usage scenarios.** Audio is generated only on nights the family picks the voice, and each chapter is generated at most once:

| Scenario | Voice nights | Chapters generated / yr | Characters / yr |
|---|---|---|---|
| Light | 1 night a week | 52 | 299,000 |
| Typical | 3 nights a week | 156 | 897,000 |
| Heavy | every chapter | 240 | 1,380,000 |

**Rule of thumb for "room for margin":** keep the voice at or below about **$30 per family per year**, about a third of $89. That leaves room for payment fees, story generation, hosting, support and profit. This threshold is my suggestion, not an industry figure.

### ElevenLabs (rates as of 26 Sep 2026; effective since 7 May 2026)

Per chapter: 5,750 chars x rate.

| Rate | Per chapter | Light (52) | Typical (156) | Heavy (240) |
|---|---|---|---|---|
| v2 / v3, list price, $0.10 per 1K | $0.575 | **$29.90** | **$89.70** | **$138.00** |
| v2 / v3, yearly plan fully used, about $0.083 per 1K | $0.479 | $24.92 | $74.75 | $115.00 |
| Flash v2.5, list price, $0.05 per 1K | $0.288 | $14.95 | $44.85 | $69.00 |
| Flash v2.5, yearly plan fully used, about $0.042 per 1K | $0.240 | $12.46 | $37.38 | $57.50 |

**The fixed plan fee matters while we are small.**

- Scale costs $2,990/yr (yearly billing) and includes 2.99M v2 characters a month, about 35.9M a year. That covers about **40 "typical" families**. With fewer families we pay for characters we don't use. For example, 10 typical families cost about $299 each per year.
- Business costs $9,900/yr, includes 9.9M characters a month, and covers about 132 typical families.
- Usage beyond the included characters is billed pay-as-you-go at the list rate.
- Enterprise discounts are unpublished.

**Verdict:**

- On v2/v3 at list price, only **Light** fits the $30 guide. Typical uses up the entire $89. Heavy loses money.
- On Flash, Light fits, Typical is tight at $45, and Heavy loses money.
- Flash is lower quality (cloned-voice Elo 993 vs 1073 for v3), and the quality of the voice is the whole feature.

### Chatterbox, self-hosted on Modal (GPU prices as of 26 Sep 2026)

How the estimate is built:

- **GPU seconds per chapter** = 420 s of audio x real-time factor (RTF, GPU time per second of audio). Published RTFs range from 0.135 (NVIDIA, RTX 4090) to about 0.5 (community fork, RTX 4090). An L4 is slower than a 4090, so we plan on **0.2–1.0**.
- **Planning case:** L4 at $0.000222 per second, RTF 0.5, 210 GPU-seconds, **$0.047**.
  - Add about $0.013 for CPU and memory (billed separately at $0.0000131 per core-second and $0.00000222 per GiB-second).
  - Add about $0.013 for a cold-start allowance (60 GPU-seconds).
  - Total **about $0.07 per chapter**.
- **Best case:** L4, RTF 0.2, about $0.02.
- **Worst case:** L40S at $0.000542 per second, RTF 1.0, about $0.23, plus overhead, about **$0.26**.

| Case | Per chapter | Light (52) | Typical (156) | Heavy (240) |
|---|---|---|---|---|
| Planning (L4) | about $0.07 | $3.64 | $10.92 | $16.80 |
| Worst case (L40S, slow) | about $0.26 | $13.52 | $40.56 | $62.40 |
| Hosted on fal.ai / Replicate, $0.025 per 1K (no GPU ops) | $0.144 | $7.48 | $22.43 | $34.50 |
| fal ChatterboxHD / Replicate chatterbox-pro, $0.04 per 1K | $0.230 | $11.96 | $35.88 | $55.20 |

Hidden costs of self-hosting:

- **Engineering time:** splitting text into chunks of about 250–350 characters, merging very short lines of dialogue, checking that the watermark actually loaded, and monitoring.
- **Keeping a GPU warm at bedtime** so the first paragraph starts fast. One L4 kept warm costs about **$0.80 an hour** ($0.000222 x 3,600). Three bedtime hours a night is about $876 a year, spread across all families.
- Modal's free plan includes $30/month of compute, which is enough for the prototype.

**Verdict:** the planning case fits every scenario with a lot of room. Even the worst case fits Light and Typical.

### Two strong alternatives

**Azure personal voice** ($24 per 1M chars, effective 1 Feb 2024, plus $0.60 per voice per month = $7.20 a year):

| | Per chapter | Light | Typical | Heavy |
|---|---|---|---|---|
| Synthesis | $0.138 | $7.18 | $21.53 | $33.12 |
| **Total including storage** | | **$14.38** | **$28.73** | **$40.32** |

SSML tags sent with each paragraph add a few percent. Light and Typical fit the $30 guide, and Heavy is still well inside $89.

**Speechify** (Pro plan overage rate $8 per 1M chars; plan fee $99/mo):

| | Per chapter | Light | Typical | Heavy |
|---|---|---|---|---|
| Synthesis | $0.046 | $2.39 | $7.18 | $11.04 |

The $99/mo Pro fee includes 13.5M characters a month, enough for about 180 typical families. Before that point the fixed fee dominates. The $10/mo Starter plan (1.9M characters a month) suits the prototype.

### One-time cost of creating a voice

| Option | One-time cost |
|---|---|
| ElevenLabs IVC | **$0** per clone, but each clone uses one voice slot: 660 on Scale and 2,200 on Business (slot counts read from the comparison table; medium confidence). More than that needs Enterprise. A one-paragraph preview (about 600 chars) costs about $0.06. |
| Chatterbox self-hosted | **About $0.** The "voice" is a saved reference clip. A preview costs less than $0.01 of GPU time. |
| Azure personal voice | **$0** to create; $0.60/month storage until deleted. |
| Speechify | No per-clone fee found on the pages checked **[unverified]**. |
| Resemble hosted | First clone free, then **$2 each** (changelog, 8 May 2026). Whether that is one-time or monthly is unclear **[unverified]**. |
| Our side (all options) | Storing the 3-minute recording and consent audio in Supabase, and a speech-to-text check of the consent statement. A few cents at most; not priced here. |

### Which scenarios fit inside $89 with room to spare (at or below about $30)

| Option | Light | Typical | Heavy |
|---|---|---|---|
| ElevenLabs v2/v3, list | Yes ($30) | **No** ($90) | **No** ($138) |
| ElevenLabs Flash, list | Yes ($15) | Tight ($45) | **No** ($69) |
| Chatterbox self-hosted | Yes ($4) | Yes ($11) | Yes ($17) |
| Chatterbox via fal/Replicate | Yes ($7) | Yes ($22) | Tight ($35) |
| Azure personal voice | Yes ($14) | Yes ($29) | Tight ($40) |
| Speechify | Yes ($2) | Yes ($7) | Yes ($11) |

### Levers to pull

1. **Cache once per chapter per family** (already planned). Also freeze each chapter's text before it is voiced: any later edit means paying to generate it again.
2. **Generate only on nights the voice is chosen**, not ahead of time for the whole season. This one lever is the difference between Light and Heavy.
3. **A fair-use allowance.** For example, include one voice night a week on v2/v3, or two on Flash, which stays under about $30 on ElevenLabs. Extra nights could be offered as an add-on.
4. **Cheaper model tiers.** ElevenLabs Flash costs half as much as v2/v3. Blind-test it with real grandparents before assuming the quality gap matters.
5. **Shorter picture-book tellings** for younger kids. A 2,500-character telling costs about 57% less than a full chapter.
6. **Self-hosting** (Chatterbox): 5–10x cheaper than ElevenLabs list price, at the cost of engineering work and some quality.
7. **Yearly prepay or an Enterprise discount** with ElevenLabs. Yearly billing cuts about 17% if the included characters are used. The Enterprise discount is unknown, so ask.
8. **Hybrid:** use ElevenLabs for the voice-creation preview and "wow" moments, and a cheaper engine for the nightly reading. This only works if the two sound alike, which needs testing.

---

## 4. Consent, watermark and legal notes (for the privacy lawyer)

This is background for counsel. It is not legal advice. All sources were checked 26 Sep 2026.

### What each provider requires

| Provider | Consent mechanism | Children | What they keep / deletion | Watermark |
|---|---|---|---|---|
| **ElevenLabs** | User confirms they have the right and consent. Docs conflict on whether IVC also needs a spoken CAPTCHA; ElevenLabs itself says verification "cannot guarantee that the provided recording truly belongs to the requester". The platform must capture its own consent. The OEM Terms (§2.D) put responsibility for obtaining consents on us; we must bind our users to terms "at least as restrictive" as ElevenLabs' and must indemnify ElevenLabs (§3.A, §7). | Account holders must be 18+ (ToS 31 Mar 2026). No voice data from anyone under 18 (Privacy Policy 20 May 2026). **§9(r) bans solutions targeting children under 13** (Use Policy 17 Aug 2026). | Generation history is kept by default; it can be deleted through the API, and backups roll off within 30 days. Voice-derived data is kept up to 3 years after the last interaction. A **perpetual licence to voice models** applies unless we opt out of training, and the opt-out only affects future data. Zero Retention Mode is Enterprise-only and **does not cover voice cloning**. Named in a pending BIPA suit (*Amer v. Eleven Labs*, N.D. Ill. 1:26-cv-05437). | Blog says "every generation" gets SynthID; docs are now generic. Confirm in writing. |
| **Microsoft Azure** | Verbatim statement: "I [name] am aware that recordings of my voice will be used by [company] to create and use a synthetic version of my voice." Speaker verification against the audio prompt. We must warrant we have explicit written permission, share Microsoft's disclosure with the speaker, and disclose the synthetic voice to users. | Microsoft advises clear disclosure to parents where use cases involve minors. | Microsoft keeps the consent statement "for as long as necessary to preserve the security and integrity" of its services. | **Yes**, and it identifies the voice. |
| **Google Chirp 3** | Fixed script: "I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model." Custom scripts are not allowed. | Not addressed. | The voice-cloning key is stored on **our** side and sent with each request. | Not documented. |
| **OpenAI** | Fixed phrase; the sample must match the speaker. We must tell listeners the voice is AI. | Not addressed. | Not checked. | Not documented. |
| **Speechify** | A spoken one-time challenge phrase, checked and **kept by Speechify as the consent record**. | Not checked. | Not checked. | Yes (documented). |
| **Resemble** | A consent clip in the cloned voice, speaker-verified (Professional Clone). | Not checked. | Not checked. | PerTh. |
| **Chatterbox self-hosted** | None; we build everything. | Our own rules. | Entirely ours; the easiest option to make "delete removes everything" true. | PerTh in code (present/absent only). |
| **Cartesia / Fish** | Explicit consent (Cartesia); none for instant clones (Fish). | **Cartesia bans output relating to under-18s; Fish bans children's personal information.** | Fish: deleted content may not be fully removed. | Not documented. |

### State and federal law (most important first)

1. **Illinois BIPA (740 ILCS 14)** is the highest risk.
   - "Voiceprint" is a biometric identifier (§10).
   - **Before collecting:** written notice that biometric data is collected, its specific purpose, and how long it is kept, plus a **written release from the speaker or their legally authorized representative** (§15(b)). Since 2 Aug 2024 an electronic signature counts (P.A. 103-769). A spoken statement alone is not clearly a "written release", so pair it with an e-signature.
   - **Retention:** a published retention and destruction schedule. Destroy when the purpose is met or within 3 years of the last interaction, whichever comes first (§15(a)).
   - **Sharing:** disclosing the data to a TTS vendor requires the speaker's consent (§15(d)). No selling or "otherwise profit[ing] from" the data (§15(c)); counsel should confirm a paid plan that *uses* the voice is not "profiting". Store it with reasonable care (§15(e)).
   - **Damages:** a private right of action, with $1,000 per negligent or $5,000 per intentional or reckless violation (or actual damages), plus fees (§20). Since 2024, repeat collection from the same person counts as one violation. The Seventh Circuit applied that retroactively in *Clay v. Union Pacific* (Apr 2026).
   - **Trend:** nine voiceprint class actions were filed in May 2026 (Amazon, Adobe, Google, Apple, Microsoft, Samsung, Meta, ElevenLabs, NVIDIA). In *Delgado v. Meta* (Aug 2026) the court held that data *capable* of identifying someone can be covered; *Carpenter v. McDonald's* went the other way. Whether a clone's speaker embedding is a "voiceprint" is unsettled.
2. **Texas CUBI (Bus. & Com. Code 503.001).**
   - Covers voiceprints. Requires notice and consent (not necessarily written).
   - No selling or disclosure except narrow exceptions.
   - Destroy no later than one year after the purpose ends.
   - Penalty up to $25,000 per violation, enforced only by the Attorney General (the AG's Meta settlement was $1.4B, 30 Jul 2024).
   - The 2026 TRAIGA amendment exempts AI training unless the system is used to identify people. Whether per-family cloning falls inside that exemption is untested.
3. **Washington.**
   - RCW 19.375 excludes audio recordings and is enforced only by the AG.
   - The **My Health My Data Act** (RCW 19.373) counts "voice recordings, from which an identifier template can be extracted" as consumer health data. It requires consent, plus a **separate consent to share**, and allows private suits through the Consumer Protection Act.
4. **Colorado (HB24-1130, in force 1 Jul 2025).**
   - Applies to any business regardless of size; covers voiceprints.
   - Requires consent and a written retention policy.
   - Delete at the earliest of: purpose met, **24 months of inactivity**, or 45 days after the data is no longer needed.
   - State enforcement only.
5. **California CCPA.** Voice recordings from which a voiceprint can be extracted are "biometric information" when used to identify someone, and are personal information either way. The law only applies above its thresholds (for example, $26,625,000 in revenue), so it probably doesn't apply yet.
6. **Tennessee ELVIS Act (2024).** Creates a property right in one's voice. Liability arises from unauthorized use, and from tools whose "primary purpose" is producing a particular person's voice without authorization. Our consent flow is the authorization.
7. **Digital-replica contract laws** (California AB 2602, New York, Illinois) target performers and workers, but set the norm of a "reasonably specific description of intended uses". Use that wording in our consent.
8. **After a grandparent dies.** California's deceased-personality law (Civ. Code 3344.1, as amended by AB 1836) likely covers only people whose voice had commercial value, so it probably does not apply to an ordinary grandparent. The pending federal NO FAKES Act would give everyone a post-death right (10 years, renewable, held by heirs). Ask each speaker in advance what should happen to their voice after death.
9. **Federal NO FAKES Act of 2026 (S.4591)** is **not law**. It was advanced unanimously by Senate Judiciary on 18 Jun 2026 and reported on 24 Jun 2026; no floor vote has been found. As reported, a license for a living adult:
   - must be in writing,
   - must be **signed by the individual personally**,
   - must describe the intended uses, and
   - may not last more than **10 years**.

   Plan to re-confirm consent periodically.
10. **California AI Transparency Act (Bus. & Prof. Code 22757, operative 2 Aug 2026).**
    - Large GenAI providers (over 1M monthly users) must embed hidden disclosures in AI audio and bind their licensees by contract to keep them intact. We are likely a licensee: **never strip watermarks**.
    - **SB 1000** is on the Governor's desk (presented 2 Sep 2026; no action as of 26 Sep 2026). It would drop the 1M-user threshold and could make us a "covered provider" if we self-host.
11. **FTC.**
    - The FTC says voice-cloning tool makers can be liable if they lack guardrails, and names watermarking as one (Apr 2024).
    - A proposed rule extending impersonation liability to tool providers is still not final.
    - The Alexa case ($25M, 2023) shows the FTC expects deletion to remove **all** derived copies, including transcripts.
12. **COPPA.**
    - It does not cover information *parents* give about their children, such as kids' names.
    - It **does** cover any audio of a child's voice and, since the 2025 amendments (compliance required by 22 Apr 2026), voiceprints.
    - A child's voice must never enter the recording flow.
    - Separately, counsel should consider whether the app as a whole is "directed to children".

### Recommended consent record (fields)

Each adult speaker completes their own consent. Grandma gets an invite link, signs, and records herself; a parent cannot consent for her.

1. **Speaker identity:** full name, relationship to the children, email, the family account it belongs to, and whether the speaker is also the account holder.
2. **Adult attestation:** "I am 18 or older", with a timestamp.
3. **Written notice shown**, stored as a snapshot plus a version ID:
   - what is collected (the recordings and voice model),
   - the exact purpose: "reads only Grit & Grace chapter text for the [Family] household; never free text; no downloads",
   - the retention period and destruction rules,
   - the **named vendors** that receive the voice (BIPA §15(d)),
   - and how to revoke.
4. **E-signature:** typed name plus an "I agree" action, the UTC timestamp, IP address and device.
5. **Separate consent to share** the voice with the named vendor(s) (Washington MHMDA, BIPA §15(d)).
6. **Spoken consent statement:**
   - the script version and exact text,
   - the audio (encrypted, stored separately),
   - a SHA-256 hash of the audio,
   - a transcript,
   - and a script-match result.

   Include the provider's required wording if it has one (Azure, Google, OpenAI, Speechify).
7. **Speaker match:**
   - Consent audio and guided reading are the same single speaker, with the method and score.
   - Reject recordings with more than one speaker.
   - Store any provider verification or challenge ID.
8. **Permitted-use scope:** our chapter text only, streamed in the app, cached per family, and not used to train our models. Also record whether the provider's training opt-out is set.
9. **Post-death choice:** delete the voice / keep it for the family for up to N years / name a person to decide.
10. **Re-consent date:** for example, every 3 years, which is well inside the proposed 10-year cap.
11. **Revocation and deletion log:** when revoked, what was deleted and where, the vendor's API confirmation, and when backups expired.

### Recommended retention and deletion policy

- **Publish** a written retention and destruction schedule (BIPA §15(a); Colorado).
- **Delete the voice** at the earliest of:
  - the speaker's revocation, or a parent's "delete voice" request (in both cases, start **immediately**);
  - the Heirloom subscription ending, after a 30-day grace period;
  - **12 months with no playback** of that voice (stricter than Colorado's 24 months and BIPA's 3 years);
  - the speaker's death, if they chose deletion.
- **What "delete" removes:**
  - the raw 3-minute recording,
  - the processed reference clip or embedding,
  - the provider voice (for ElevenLabs, `DELETE /v1/voices/{voice_id}`),
  - every cached chapter audio file in our storage **and** in the provider's history (`DELETE /v1/history/{id}`, or delete right after each generation once we have cached the audio),
  - transcripts,
  - and any fine-tuned model files.

  Backups roll off within 30 days.
- **What we keep after deletion:** a text-only consent and deletion log (who, when, which script version, the audio hash, deletion confirmations), with **no audio**, for a period counsel sets. Keeping the consent audio itself is a tension with "delete removes everything"; see open questions.
- **Contract terms to get from the vendor:**
  - a DPA that covers biometric data,
  - training switched off,
  - deletion of the voice model **and** the consent audio within a set number of days,
  - and written confirmation of watermarking.

  Without these, the in-app wording should say "we delete everything we hold and instruct our voice provider to delete theirs", not a flat "delete removes everything".
- **Label** the voice in the app as AI, for example "Grandma's story voice (AI, made with her permission)". OpenAI's policy and the FTC's guidance both point this way, and it is good practice everywhere.

---

## 5. Open questions

**For ElevenLabs (ask in writing, before any family records a voice):**

1. Does §9(r) ("bundled solutions that target anyone under the age of 13") cover a parent-subscribed bedtime app whose listeners are under 13?
2. Do the OEM Terms allow offering the service to consumer families, given the "internal business operations" wording? Is Enterprise or an OEM exhibit required?
3. What does §9(i) "prior written authorization" to build on the API require of us?
4. Is paid-tier, cloned-voice API output watermarked with SynthID today?
5. Does IVC ever trigger a voice CAPTCHA? The API returns `requires_verification`. Can our own recorded consent be passed to ElevenLabs as proof?
6. Can Enterprise switch off training on voice models by contract, delete voice-derived data sooner than 3 years, and delete everything within a set number of days?
7. What Enterprise discount applies to $0.10 per 1K at our volume, how many voice slots do we get above 2,200, and is there a per-slot cost?

**For other vendors:**

8. Azure: will Microsoft grant Limited Access to a small consumer app that is not a managed account? How long does it take?
9. Speechify: what do its terms say about children, what are its commercial rights, and does it support streaming? How good are its cloned voices in a blind test?
10. Cartesia: does the ban on output relating to under-18s cover adult-voiced stories that include children's first names?
11. OpenAI: can the 20-voices-per-organization cap be raised?
12. Resemble: what are the real hosted TTS and cloning prices, which plan unlocks API cloning, and is the $2 clone fee one-time or monthly?
13. Which vendors will commit in a DPA to delete both the voice model and the consent audio on request?
14. Alibaba's hosted Qwen-Audio-3.1-TTS-Plus leads the cloned-voice leaderboard (1177). It was not researched; is it worth a look?

**For counsel:**

15. Is a speaker embedding that is never used to identify anyone a BIPA "voiceprint"? (*Delgado v. Meta* vs. *Carpenter v. McDonald's*; *Amer v. Eleven Labs* is pending.)
16. Does charging for Heirloom count as "otherwise profit[ing] from" biometric data under BIPA §15(c)?
17. Does a spoken consent plus a checkbox e-signature satisfy BIPA's "written release"? Must the notice name each vendor?
18. How long may we keep the consent audio (or only its hash and a text log) after the voice is deleted, to prove consent without breaking "delete removes everything"?
19. Does Texas's 2026 AI-training carve-out cover per-family cloning, or is it a "commercial purpose"?
20. What should the default be after a speaker dies, and who controls the voice?
21. If SB 1000 is signed, does self-hosting Chatterbox make us a "covered provider" under the California AI Transparency Act?
22. Is the app "directed to children" for COPPA purposes? What flow guarantees no child's voice is captured (adult attestation, speaker match, single-speaker check)?

**For us (prototype tests):**

23. A blind test with real grandparents: ElevenLabs v3 vs. Multilingual v2 vs. Flash vs. Chatterbox vs. Speechify, on a full 7-minute chapter. Listen for drift, clicks at paragraph joins, and pronunciation of the kids' names.
24. Chatterbox: with a fixed seed and the same reference for every chunk, does a 20-chunk chapter hold together? Does a short per-family fine-tune on the 3-minute recording noticeably help?
25. Real usage: how many nights a week do families actually choose the voice? This decides whether ElevenLabs is affordable.

---

## 6. Sources

All retrieved 26 Sep 2026 unless another date is shown. The date in brackets is the page's own publish, update or effective date where one exists.

### ElevenLabs
- https://elevenlabs.io/pricing/api (API rates and plan characters; no page date)
- https://elevenlabs.io/pricing (creative plans, rollover, Enterprise card, voice slots)
- https://elevenlabs.io/blog/weve-lowered-api-agents-pricing-and-introduced-pay-as-you-go [published 2026-05-07, updated 2026-09-20]
- https://elevenlabs.io/docs/overview/administration/pay-as-you-go
- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/request-stitching
- https://elevenlabs.io/docs/api-reference/text-to-speech/stream
- https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/tts-vs-ttd-websockets
- https://elevenlabs.io/docs/product-guides/voices/voice-cloning/instant-voice-cloning
- https://elevenlabs.io/docs/api-reference/voices/ivc/create
- https://elevenlabs.io/docs/api-reference/voices/delete
- https://elevenlabs.io/docs/product-guides/voices/voice-cloning/professional-voice-cloning
- https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/professional-voice-cloning
- https://elevenlabs.io/docs/eleven-api/concepts/voice-cloning
- https://elevenlabs.io/blog/voice-cloning-api [published 2026-08-12, updated 2026-09-22]
- https://elevenlabs.io/terms-of-use [2026-03-31]
- https://elevenlabs.io/use-policy [2026-08-17]
- https://elevenlabs.io/oem-terms [2025-02-28]
- https://elevenlabs.io/privacy-policy [2026-05-20]
- https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode
- https://elevenlabs.io/docs/help-center/legal/audio-detector/what-is-watermarking-and-why-is-eleven-labs-using-it
- https://elevenlabs.io/docs/eleven-creative/audio-tools/audio-detector
- https://elevenlabs.io/safety
- https://help.elevenlabs.io/hc/en-us/articles/48099714323857-Is-my-audio-being-watermarked-right-now (could not be fetched: HTTP 403; claims from it are unverified)
- https://blog.google/innovation-and-ai/products/identifying-ai-generated-media-online/ [2026-05-19, modified 2026-05-20]

### Chatterbox, Resemble AI and GPU hosting
- https://github.com/resemble-ai/chatterbox
- https://github.com/resemble-ai/chatterbox/commits/master
- https://github.com/resemble-ai/chatterbox/blob/master/src/chatterbox/tts.py
- https://github.com/resemble-ai/chatterbox/blob/master/src/chatterbox/tts_turbo.py
- https://github.com/resemble-ai/chatterbox/issues/76 [opened 2025-05-30]
- https://github.com/resemble-ai/chatterbox/issues/97 [opened 2025-05-31]
- https://github.com/resemble-ai/chatterbox/pull/457 [2026-02-03]
- https://pypi.org/pypi/chatterbox-tts/json [release 2026-03-26]
- https://github.com/resemble-ai/Perth/blob/master/src/perth/perth_net/perth_net_implicit/perth_watermarker.py
- https://github.com/resemble-ai/Perth/blob/master/src/perth/__init__.py
- https://github.com/davidbrowne17/chatterbox-streaming
- https://www.resemble.ai/resources/chatterbox-multilingual-v3-tts-with-embedded-watermarking-for-25-languages [2026-06-10]
- https://www.resemble.ai/learn/models/chatterbox
- https://www.resemble.ai/learn/models/chatterbox-turbo
- https://www.resemble.ai/products/text-to-speech
- https://www.resemble.ai/products/voice-creation
- https://www.resemble.ai/pricing
- https://docs.resemble.ai/voice-creation/voices/clone-overview
- https://www.resemble.ai/changelogs/voice-cloning-pricing-first-clone-free-then-2-each-2026 [2026-05-08]
- https://www.resemble.ai/our-commitment-to-consent/ [2024-09-04]
- https://www.voiceflow.com/blog/resemble-ai [2026-06-30; third-party; source of the unverified Resemble TTS rate]
- https://docs.nvidia.com/nvigi-sdk/1.7.0/docs/ProgrammingGuideTTSChatterbox.html
- https://artificialanalysis.ai/text-to-speech/leaderboard/controlled-voice
- https://artificialanalysis.ai/text-to-speech/leaderboard
- https://fal.ai/models/fal-ai/chatterbox/text-to-speech
- https://fal.ai/models/resemble-ai/chatterboxhd/text-to-speech
- https://replicate.com/resemble-ai/chatterbox
- https://replicate.com/resemble-ai/chatterbox-turbo
- https://replicate.com/resemble-ai/chatterbox-pro
- https://replicate.com/resemble-ai/chatterbox-multilingual
- https://replicate.com/pricing
- https://modal.com/pricing
- https://www.runpod.io/pricing [updated 2026-09-13]
- https://huggingface.co/pricing (its H100 price conflicts with the docs page below; treat the $4.50/hr H100 figure as uncertain)
- https://huggingface.co/docs/inference-endpoints/pricing

### Other providers and open models
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/personal-voice-overview [2026-09-09]
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/personal-voice-create-consent
- https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/text-to-speech/transparency-note [2026-03-31, updated 2026-06-20]
- https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/text-to-speech/limited-access [2026-03-31, updated 2026-08-26]
- https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/foundry/responsible-ai/speech-service/text-to-speech/limited-access.md [2026-03-31]
- <https://prices.azure.com/api/retail/prices?$filter=armRegionName%20eq%20'eastus'%20and%20contains(meterName,'Personal')> [prices effective 2024-02-01]
- https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
- https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech
- https://docs.cloud.google.com/text-to-speech/docs/chirp3-instant-custom-voice [updated 2026-09-24]
- https://cloud.google.com/text-to-speech/pricing
- https://developers.openai.com/api/docs/guides/custom-voices
- https://developers.openai.com/api/docs/models/gpt-4o-mini-tts
- https://developers.openai.com/api/docs/guides/text-to-speech
- https://developers.openai.com/api/docs/pricing
- https://docs.speechify.ai/build/changelog/2026/8/13 [2026-08-13, updated 2026-09-23]
- https://docs.speechify.ai/build/guides/voice-cloning/overview
- https://speechify.ai/pricing
- https://speechify.ai/voice-cloning
- https://speechify.ai/detect
- https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits
- https://docs.fish.audio/developer-guide/models-pricing/models-overview.md
- https://docs.fish.audio/developer-guide/sdk-guide/javascript/voice-cloning
- https://fish.audio/blog/professional-voice-cloning/ [2026-06-15]
- https://fish.audio/terms/ [2024-08-18]
- https://fish.audio/plan/ ($11/$75/$749 are per-month prices on yearly billing; month-to-month is $15/$100/$999)
- https://docs.cartesia.ai/build-with-cartesia/capability-guides/clone-voices
- https://docs.cartesia.ai/pricing
- https://cartesia.ai/pricing
- https://cartesia.ai/legal/acceptable-use.html [2025-07-23]
- https://www.hume.ai/pricing
- https://dev.hume.ai/docs/text-to-speech-tts/overview
- https://dev.hume.ai/docs/voice/voice-cloning
- https://inworld.ai/pricing
- https://docs.inworld.ai/tts/voice-cloning
- https://inworld.ai/blog/introducing-inworld-tts [2025-08-15, modified 2025-10-17]
- https://docs.aws.amazon.com/polly/latest/dg/available-voices.html
- https://aitoolgraveyard.com/what-happened-to-play-ht (third-party)
- https://www.marktechpost.com/2026/09/21/best-voice-cloning-apis-in-2026-speaker-similarity-consent-checks-and-price-per-1m-characters/ [2026-09-21; third-party]
- https://github.com/QwenLM/Qwen3-TTS
- https://github.com/SWivid/F5-TTS
- https://huggingface.co/coqui/XTTS-v2/blob/main/LICENSE.txt
- https://github.com/index-tts/index-tts [IndexTTS-2.5 released 2026-08-10]
- https://huggingface.co/hexgrad/Kokoro-82M
- https://github.com/Zyphra/Zonos
- https://github.com/nari-labs/dia
- https://huggingface.co/sesame/csm-1b
- https://huggingface.co/canopylabs/orpheus-3b-0.1-ft

### Law and regulation
- https://www.ilga.gov/Legislation/ILCS/Articles?ActID=3004&ChapterID=57 (Illinois BIPA; §10 as amended by P.A. 103-769, effective 2024-08-02)
- https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57
- https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20260514-seventh-circuit-weighs-in-on-critical-bipa-retroactivity-question [2026-05-14]
- https://capitolnewsillinois.com/news/tech-giants-sued-over-stealing-voices-of-well-known-journalists-voice-actors-to-train-ai/ [2026-05-15]
- https://www.biometricupdate.com/202608/meta-loses-bid-to-end-bipa-voiceprint-suit-as-case-moves-forward [2026-08-25]
- https://tcss.legis.texas.gov/resources/BC/htm/BC.503.htm (as amended by HB 149, effective 2026-01-01)
- https://www.texasattorneygeneral.gov/news/releases/attorney-general-ken-paxton-secures-14-billion-settlement-meta-over-its-unauthorized-capture [2024-07-30]
- https://www.bracewell.com/resources/billion-dollar-liability-understanding-your-obligations-under-the-texas-capture-or-use-of-biometric-identifier-act/ [2024-08-12]
- https://app.leg.wa.gov/RCW/default.aspx?cite=19.375.010
- https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.010
- https://content.leg.colorado.gov/sites/default/files/documents/2024A/bills/2024a_1130_rer.pdf
- https://www.venable.com/insights/publications/2024/06/colorado-amends-state-privacy-law-to-include [2024-06-18]
- https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140
- https://cppa.ca.gov/regulations/cpi_adjustment.html
- https://www.capitol.tn.gov/Bills/113/Bill/HB2091.pdf [effective 2024-07-01]
- https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB2602 [effective 2025-01-01]
- https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240AB1836 [approved 2024-09-17]
- https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=3344.1
- https://www.grammy.com/advocacy/news/illinois-passes-ai-digital-replica-protections-law [2024-05-29]
- https://natlawreview.com/article/new-year-new-protections-new-york-artists-and-ai-generated-replicas
- https://www.hklaw.com/en/insights/publications/2026/06/senate-judiciary-committee-advances-legislation-to-protect-name [2026-06-22]
- https://www.govinfo.gov/content/pkg/BILLS-119s4591rs/html/BILLS-119s4591rs.htm [reported 2026-06-24]
- https://www.govtrack.us/congress/bills/119/s4591/text
- https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=8.&title=&part=&chapter=25.&article= (operative 2026-08-02)
- https://www.morganlewis.com/pubs/2026/08/new-california-ai-disclosure-rules-become-operative [2026-08-03]
- https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB1000
- https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260SB1000 (presented to Governor 2026-09-02; no action as of 2026-09-26)
- https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/2024/04/approaches-address-ai-enabled-voice-cloning [2024-04-08]
- https://www.ftc.gov/news-events/news/press-releases/2023/11/ftc-announces-exploratory-challenge-prevent-harms-ai-enabled-voice-cloning [2023-11-16]
- https://www.ftc.gov/news-events/news/press-releases/2024/02/ftc-proposes-new-protections-combat-ai-impersonation-individuals [2024-02-15]
- https://www.ftc.gov/news-events/news/press-releases/2023/05/ftc-doj-charge-amazon-violating-childrens-privacy-law-keeping-kids-alexa-voice-recordings-forever [2023-05-31]
- https://www.ftc.gov/legal-library/browse/cases-proceedings/192-3128-amazoncom-alexa-us-v
- https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312
- https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule [2025-04-22]
