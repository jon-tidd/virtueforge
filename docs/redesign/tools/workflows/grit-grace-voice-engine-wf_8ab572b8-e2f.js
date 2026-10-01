export const meta = {
  name: 'grit-grace-voice-engine',
  description: 'Design, build, test and review a provider-agnostic family-voice TTS prototype (ElevenLabs + Chatterbox + mock) behind a feature flag',
  phases: [
    { title: 'Design', detail: 'architect writes engine-design.md' },
    { title: 'Design review', detail: 'privacy/security and product reviewers, then revise' },
    { title: 'Setup', detail: 'install deps, baseline typecheck/build' },
    { title: 'Build core', detail: 'lib/voice: interface, providers, consent, cache, tests' },
    { title: 'Build app', detail: 'API routes and the voice lab pages, in parallel' },
    { title: 'Verify', detail: 'typecheck, lint, tests, build; fix until green' },
    { title: 'Code review', detail: '3 reviewers, then fix and re-verify' },
    { title: 'Docs', detail: 'setup guide, milestone steps, cost model' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const D = REPO + '/docs/redesign'
const DESIGN = D + '/voice/engine-design.md'

const BASE = `You are building the "family story voice" prototype for Grit & Grace, a Next.js 16 (App Router, React 19, TypeScript strict, Tailwind 4) app in ${REPO} (branch claude/grit-grace-phase0). Never commit, push, merge or switch branches. Never print, log or write API keys anywhere except reading them from process.env. Never open anything under ${D}/private/ yourself (the code may READ a file path given by an env var at runtime; see below).
Read first: ${D}/decisions.md (the "Family voice engine" section is the spec and is authoritative), ${D}/voice/provider-research.md (providers, prices, API notes, legal), and the mockup voice screens ${D}/canvas/project/VoiceIntro.dc.html, VoiceCapture.dc.html, VoiceReady.dc.html, Voices.dc.html, RecordChapter.dc.html (the UX to match).
Non-negotiable rules from decisions.md: provider-agnostic TTS layer (interface + adapters); start with ElevenLabs voice cloning and add a self-hosted open-source adapter (Resemble's Chatterbox) to compare quality and cost on the same chapter; consent statement read aloud and stored with a timestamp; about 3 minutes of guided reading; voice created, then previewed; labeled "Made from [name]'s recording, with their permission"; the voice owner controls an off switch; delete removes everything; adults only, own voice only, never a child's voice; reads ONLY our chapter text (no free-text endpoint, ever); no downloads; watermark where the provider supports it; keep the consent record; generate each chapter once and cache it; stream paragraph by paragraph in the reader; keys only in .env.local; behind a feature flag that is OFF in production.`

const ARCH = `Key architecture decisions (already made; build to these):
- lib/voice/: types (TTSProvider interface: id, capabilities {cloning, watermark, streaming, maxCharsPerRequest}, createVoice, deleteVoice, synthesize (one paragraph, with previous/next text for stitching where supported, returns audio bytes or a stream plus metadata: characters billed, model, latency, watermark kind)); providers/elevenlabs.ts (Instant Voice Cloning via the official REST API, Multilingual v2 by default with an option for v3 and Flash; request stitching where supported; verify every endpoint and field against the official docs with WebFetch before coding); providers/chatterbox.ts (hosted Chatterbox via Replicate or fal.ai, whichever the research doc recommends first, plus a generic self-hosted HTTP adapter for a CHATTERBOX_URL server; chunk text into sentence groups of about 250–350 characters as the research says); providers/mock.ts (no keys needed: returns a short generated WAV per paragraph, for tests and UI work); a registry that picks the provider.
- Feature flag: enabled only when VOICE_ENGINE_ENABLED === "true" AND the app is not in production (NODE_ENV !== "production" and VERCEL_ENV !== "production"). Every voice API route and page checks it and returns 404 when off.
- Storage: local-first, behind a small storage interface so Supabase Storage can replace it later. Default root VOICE_DATA_DIR or ${REPO}/.voice-data (add .voice-data/ to .gitignore). voices/<id>/voice.json (owner name, relationship, provider, providerVoiceId, enabled flag, ownerToken, label text, createdAt), consent audio and the exact consent text with an ISO timestamp and sha256 of the audio, samples; cache/<key>.<ext>; ledger.jsonl (every synthesis: provider, model, voice, chapter, paragraph, characters, latency, estimated cost).
- Delete removes everything: provider voice, samples, consent audio, cached audio. It leaves only a small deletion receipt (voice id, owner name, consented-at, deleted-at, audio hashes; no audio) and marks it clearly as a placeholder pending the privacy lawyer's call (decisions vs. "keep the consent record" tension is an open question in feature-plan.md).
- Chapter text only: synthesis takes a chapterId + paragraph index, never free text. A chapter loader reads Markdown chapter files from STORY_CONTENT_DIR (default ${D}/story/season-1) with this format: YAML front matter (id like s1-ch01, season, part, chapter, title, tag, lead) and sections "## Chapter-book telling", "## Picture-book telling", "## Pause & ask", "## Last page". The voice reads the chapter-book telling paragraphs; a Pause & ask marker pauses playback and shows the question. Until the real Chapter 1 exists, ship a fixture chapter (from canon.md section 8, "Chapter 1 and the free sample chapter") under lib/voice/__fixtures__/ and fall back to it. Personalization: if VOICE_FAMILY_FILE points to a JSON file shaped like {"slots":{"eldest":{"sample":"Hugh","real":"…"},…}}, swap each sample name for the real one (whole words) before synthesis; the cache key includes the final text so personalized audio is cached per family.
- Cache key = sha256(provider, model, providerVoiceId, chapter content hash, paragraph index, final text). Generate once; serve from cache after.
- Audio serving: GET route per paragraph returning audio with Content-Disposition inline, no-store for other origins, and never a download link in the UI (controlsList="nodownload"; note in docs that this is a deterrent, not DRM).
- Recording in the browser: capture PCM with the Web Audio API and encode 16-bit mono WAV client-side (works in Chrome and Safari and every provider accepts WAV). Show a level meter and a timer. Adults only: a clear confirmation that the speaker is an adult recording their own voice.
- Voice lab UI at /voice-lab (behind the flag), styled simply with the mockup's colors and fonts: 1) who is recording (name, relationship) and the adult/own-voice confirmation; 2) consent statement read aloud (text from the VoiceCapture mockup, with names from the family file or "your family"); 3) guided reading, about 3 minutes, several passages (warm-up, big feelings, and 3–4 short passages from the story world, total about 450 words); 4) choose provider(s) and create the voice; 5) preview with the label; 6) play Chapter 1 paragraph by paragraph (prefetch the next paragraph while one plays); 7) owner page /voice-lab/owner/[token] with the off switch and delete; 8) /voice-lab/compare: the same chapter in two providers side by side with latency, characters and estimated cost.
- Cost: scripts/voice-cost.mjs prints the per-family yearly cost table from the research doc's rates (parameterized: rates, characters per chapter, chapters per year, usage scenarios) and, if ledger.jsonl exists, measured averages.
- Tests: add vitest (devDependency) with unit tests for the flag, chapter loader and paragraph splitting, personalization, cache keys, chunking, consent record, delete, the mock provider end to end, and route guards (flag off → 404; no free-text path). Provider adapters get tests with mocked fetch.`

const ISSUES = {
  type: 'object',
  properties: { issues: { type: 'array', items: { type: 'object', properties: {
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
  }, required: ['severity', 'where', 'problem', 'fix'] } } },
  required: ['issues'],
}

phase('Design')
await agent(`${BASE}\n\n${ARCH}\n\nWrite the engine design as ${DESIGN}: goals and non-goals, the rules and where each is enforced in code, the TypeScript interfaces (exact), the file list, every API route (method, path, request, response, errors, flag check), the data model on disk, the recording and consent flow, the playback flow, provider specifics verified against official docs (cite URLs and the date), security and privacy notes, how Supabase Storage would replace local storage later, the test plan, and the first-milestone runbook (Jon records consent and samples, a voice is created, and he hears Chapter 1 in it). Plain English for the prose, precise for the code. Return a 5-line summary.`, { label: 'design', phase: 'Design', effort: 'high' })

phase('Design review')
const dr = await parallel([
  () => agent(`${BASE}\n\nLENS: privacy, security and the legal rules (BIPA, consent, adults-only, own voice, no free text, no downloads, off switch, delete, keys, flag off in production, path traversal in file storage, ids in URLs, token handling). Review ${DESIGN}. Report real problems with fixes. Do not edit.`, { label: 'review:privacy', phase: 'Design review', schema: ISSUES, effort: 'high' }),
  () => agent(`${BASE}\n\nLENS: product, UX and feasibility. Does the flow match the mockup screens and decisions? Will recording work in Chrome and Safari? Will Jon, a non-engineer, get to the first milestone without help? Are the provider API details right (check official docs)? Is the cost logging enough to model per-family cost? Review ${DESIGN}. Report real problems with fixes. Do not edit.`, { label: 'review:product', phase: 'Design review', schema: ISSUES, effort: 'high' }),
])
const drIssues = dr.filter(Boolean).flatMap(r => r.issues)
await agent(`${BASE}\n\nRevise ${DESIGN} in place to fix these review issues (all high and medium). Issues (JSON): ${JSON.stringify(drIssues, null, 1)}\nReturn what you changed.`, { label: 'revise-design', phase: 'Design review' })
log(`Design review: ${drIssues.length} issues addressed`)

phase('Setup')
const setup = await agent(`${BASE}\n\nPrepare the project for building. Run npm install (node_modules is empty). Add vitest as a devDependency and a "test" script ("vitest run"). Add ".voice-data/" to .gitignore. Record the baseline: run npx tsc --noEmit, npm run lint and npm run build, and report which errors or warnings already exist BEFORE any voice code (so later steps don't chase old problems). Don't fix pre-existing problems unless they block the build. Return the baseline results.`, { label: 'setup', phase: 'Setup' })

phase('Build core')
await agent(`${BASE}\n\n${ARCH}\n\nThe design is in ${DESIGN} (follow it; if the code must differ, update the design doc to match). Baseline notes from setup: ${String(setup).slice(0, 2000)}\n\nBuild everything under lib/voice/ (interface, providers, registry, flag, storage, consent, chapter loader, personalization, cache, ledger, fixtures) plus scripts/voice-cost.mjs and the unit tests. Run npx vitest run and npx tsc --noEmit until your code is clean. Return the file list and test results.`, { label: 'build:core', phase: 'Build core', effort: 'high' })

phase('Build app')
await parallel([
  () => agent(`${BASE}\n\n${ARCH}\n\nThe design is in ${DESIGN}; lib/voice/ is already built (read it; use its exports, don't duplicate logic). Build the API routes under app/api/voice/ exactly as the design specifies, each guarded by the flag, with no free-text path, safe ids (no path traversal), and route tests. Do NOT touch app/voice-lab/. Run npx vitest run and npx tsc --noEmit until clean. Return the route list.`, { label: 'build:api', phase: 'Build app', effort: 'high' }),
  () => agent(`${BASE}\n\n${ARCH}\n\nThe design is in ${DESIGN}; lib/voice/ is built (read it) and the API routes under app/api/voice/ are being built right now by another agent to the exact contracts in the design doc (code against the design's contracts). Build the voice lab pages under app/voice-lab/ (and any small client components they need under app/voice-lab/_components/): the recording flow with WAV capture, level meter and timer; consent; guided reading; create; preview with the label; paragraph-by-paragraph playback with prefetch and Pause & ask; the owner page with the off switch and delete; the compare page. Match the mockup's look (colors #16203A, #E9A23B, #F7F1E5, #FFFCF5; Fraunces for headings, Figtree for UI, Literata for story text via next/font/google) at phone width, accessible (real buttons and labels, 44px targets). Do NOT touch app/api/. Run npx tsc --noEmit until your files are clean. Return the page list.`, { label: 'build:ui', phase: 'Build app', effort: 'high' }),
])

phase('Verify')
let green = false
for (let round = 1; round <= 4 && !green; round++) {
  const v = await agent(`${BASE}\n\nVerify the voice prototype builds and passes. Run: npx tsc --noEmit; npm run lint; npx vitest run; npm run build (with VOICE_ENGINE_ENABLED unset, then also check that the /voice-lab page and /api/voice routes 404 when the flag is off, e.g. by reading the built route handlers or running next start briefly). Compare against the baseline from setup: ${String(setup).slice(0, 1500)}\nFix every NEW error in voice code (and integration mismatches between lib/voice, app/api/voice and app/voice-lab). Then re-run everything. Return JSON-like text starting with GREEN if all four pass with no new errors, else RED and what is still failing.`, { label: `verify:${round}`, phase: 'Verify', effort: 'high' })
  green = String(v).trim().startsWith('GREEN')
  log(`Verify round ${round}: ${green ? 'green' : 'still red'}`)
}

phase('Code review')
const REVIEWS = [
  'LENS: security and privacy. Flag gate on every route and page; no free-text synthesis path anywhere (including query params, JSON bodies, provider options); path traversal and id validation in storage; owner token strength and comparison; keys never sent to the client or logged; audio served inline with no download affordance; consent record integrity (text, timestamp, hash); delete really removes provider voice, samples, consent audio and cache; nothing about a child is recorded; SSRF in the generic Chatterbox URL adapter.',
  'LENS: correctness. Provider adapters match the official API docs (verify with WebFetch: endpoints, fields, auth headers, output formats, stitching, error handling, rate limits); cache keys and cache hits; chunking and joining audio for Chatterbox; paragraph playback order and prefetch; WAV encoding correctness (headers, sample rate); error paths; race conditions (double-create, concurrent synthesis of the same paragraph); cost ledger math.',
  'LENS: product and UX. Walk the whole voice-lab flow as Jon would (read the code as a user journey): can he get from zero to hearing Chapter 1 in his voice? Is the consent step clear and adult-only? Is the label always shown? Does the off switch work from the owner page? Does the compare page make quality and cost easy to judge? Copy is plain and warm; accessible; works at phone width.',
]
const cr = await parallel(REVIEWS.map((r, i) => () => agent(`${BASE}\n\n${r}\n\nReview the voice code: lib/voice/, app/api/voice/, app/voice-lab/, scripts/voice-cost.mjs, and the tests. Report only real problems with concrete fixes. Do not edit.`, { label: `review:${i + 1}`, phase: 'Code review', schema: ISSUES, effort: 'high' })))
const crIssues = cr.filter(Boolean).flatMap(r => r.issues)
log(`Code review: ${crIssues.length} issues (${crIssues.filter(i => i.severity === 'high').length} high)`)
if (crIssues.length) {
  await agent(`${BASE}\n\nFix these code-review issues (all high and medium; low where cheap). Then run npx tsc --noEmit, npm run lint, npx vitest run and npm run build until green (no new errors vs. the baseline: ${String(setup).slice(0, 1000)}). Issues (JSON): ${JSON.stringify(crIssues, null, 1)}\nReturn what you changed and the final check results.`, { label: 'fix-review', phase: 'Code review', effort: 'high' })
}

phase('Docs')
const docs = await agent(`${BASE}\n\nWrite ${D}/voice/README.md for Jon (non-engineer, plain English): what the prototype does and doesn't do; the rules it enforces; one-time setup (create an ElevenLabs account and API key, which plan is needed for Instant Voice Cloning per the research doc; optional Replicate or fal.ai key for Chatterbox; the exact .env.local lines including VOICE_ENGINE_ENABLED=true and VOICE_FAMILY_FILE=docs/redesign/private/family.json; npm install; npm run dev; open http://localhost:3000/voice-lab); the first milestone step by step (record consent, guided reading, create, preview, hear Chapter 1); how to compare Chatterbox; how to switch the voice off and delete it; where files live and how to wipe everything; how to run the cost model (node scripts/voice-cost.mjs) with its current output pasted in; the known limits (no DRM, ElevenLabs terms on under-13 products and reselling need a written OK before any real family records, BIPA needs a signed release from each speaker; prototype only, never in production). Run node scripts/voice-cost.mjs to capture its output. Return a 5-line summary including whether all checks are green.`, { label: 'docs', phase: 'Docs' })

return { green, designIssues: drIssues.length, reviewIssues: crIssues.length, docs }
