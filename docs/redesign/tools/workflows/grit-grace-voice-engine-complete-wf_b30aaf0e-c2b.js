export const meta = {
  name: 'grit-grace-voice-engine-complete',
  description: 'Audit the partly built family-voice prototype, fill the gaps against the spec, then verify, review, fix and document it',
  phases: [
    { title: 'Audit', detail: 'inventory the partial code, run the checks, write engine-design.md and a gap list' },
    { title: 'Complete', detail: 'fill gaps in core, API and UI in parallel' },
    { title: 'Verify', detail: 'typecheck, lint, tests, build; fix until green' },
    { title: 'Code review', detail: '3 reviewers, then fix and re-verify' },
    { title: 'Docs', detail: 'setup guide, milestone steps, cost model' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const D = REPO + '/docs/redesign'
const DESIGN = D + '/voice/engine-design.md'

const BASE = `You are finishing the "family story voice" prototype for Grit & Grace, a Next.js 16 (App Router, React 19, TypeScript strict, Tailwind 4) app in ${REPO} (branch claude/grit-grace-phase0). Never commit, push, merge or switch branches. Never print, log or write API keys anywhere except reading them from process.env. Never open anything under ${D}/private/ yourself (code may read a file path given by an env var at runtime).
A previous build was cut off mid-way by a usage limit. Partial code exists in lib/voice/ (with __tests__ and __fixtures__), app/api/voice/, app/voice-lab/, components/voice-lab/, vitest.config.mts, and package.json (vitest added, scripts test and voice:cost; scripts/voice-cost.mjs may be missing). Some files may be half-written. Build on what is there when it is sound; rewrite what is not.
Read first: ${D}/decisions.md (the "Family voice engine" section is the spec and is authoritative), ${D}/voice/provider-research.md (providers, prices, API notes, legal), and the mockup voice screens ${D}/canvas/project/VoiceIntro.dc.html, VoiceCapture.dc.html, VoiceReady.dc.html, Voices.dc.html, RecordChapter.dc.html (the UX to match).
Non-negotiable rules: provider-agnostic TTS layer (interface + adapters); ElevenLabs voice cloning first, plus a self-hosted open-source adapter (Resemble's Chatterbox) to compare quality and cost on the same chapter; consent statement read aloud and stored with a timestamp; about 3 minutes of guided reading; voice created, then previewed; labeled "Made from [name]'s recording, with their permission"; the voice owner controls an off switch; delete removes everything; adults only, own voice only, never a child's voice; reads ONLY our chapter text (no free-text path, ever); no downloads; watermark where the provider supports it; keep the consent record; generate each chapter once and cache it; stream it paragraph by paragraph in the reader; keys only in .env.local; behind a feature flag that is OFF in production.`

const ARCH = `Target architecture (build to this; keep what already matches):
- lib/voice/: TTSProvider interface (id, capabilities {cloning, watermark, streaming, maxCharsPerRequest}, createVoice, deleteVoice, synthesize one paragraph with previous/next text for stitching where supported, returning audio plus metadata: characters billed, model, latency, watermark kind); providers/elevenlabs.ts (Instant Voice Cloning via the official REST API; Multilingual v2 default, options for v3 and Flash; request stitching where supported; verify endpoints and fields against official docs with WebFetch); providers/chatterbox.ts (hosted Chatterbox via Replicate or fal.ai per the research doc, plus a generic self-hosted HTTP adapter for CHATTERBOX_URL; chunk into sentence groups of about 250–350 characters); providers/mock.ts (no keys; returns a short generated WAV); a registry.
- Flag: enabled only when VOICE_ENGINE_ENABLED === "true" AND NODE_ENV !== "production" AND VERCEL_ENV !== "production". Every voice route and page returns 404 when off.
- Local-first storage behind a small interface (Supabase Storage later). Root VOICE_DATA_DIR or ${REPO}/.voice-data (gitignored). Voice record (owner name, relationship, provider, providerVoiceId, enabled, ownerToken, label, createdAt), consent audio plus exact consent text, ISO timestamp and sha256; samples; cache; ledger.jsonl (provider, model, voice, chapter, paragraph, characters, latency, estimated cost).
- Delete removes everything (provider voice, samples, consent audio, cache) and leaves only a small deletion receipt without audio, marked as pending the privacy lawyer's call.
- Chapter text only: synthesis takes chapterId + paragraph index. Chapter loader reads Markdown from STORY_CONTENT_DIR (default ${D}/story/season-1): YAML front matter (id like s1-ch01, season, part, chapter, title, tag, lead) and sections "## Chapter-book telling", "## Picture-book telling", "## Pause & ask", "## Last page". The voice reads the chapter-book telling; a Pause & ask marker pauses playback and shows the question. Fixture chapter in lib/voice/__fixtures__/ as the fallback until real chapters exist. Personalization: if VOICE_FAMILY_FILE points to JSON {"slots":{"eldest":{"sample":"Hugh","real":"…"},…}}, swap sample names for real ones (whole words) before synthesis; cache key includes the final text.
- Cache key = sha256(provider, model, providerVoiceId, chapter content hash, paragraph index, final text).
- Audio per paragraph via GET, Content-Disposition inline, no download link in the UI (controlsList="nodownload"; documented as a deterrent, not DRM).
- Browser recording: Web Audio PCM capture encoded to 16-bit mono WAV client-side, with level meter and timer; adult/own-voice confirmation.
- /voice-lab flow: who's recording and the adult confirmation; consent read aloud; ~3 minutes of guided reading (about 450 words of passages); create with a chosen provider; preview with the label; play Chapter 1 paragraph by paragraph with prefetch and Pause & ask; owner page /voice-lab/owner/[token] with the off switch and delete; /voice-lab/compare with two providers side by side (latency, characters, estimated cost).
- scripts/voice-cost.mjs: per-family yearly cost table from the research doc's rates (parameterized) plus measured averages from ledger.jsonl if present.
- vitest unit tests: flag, chapter loader and paragraphs, personalization, cache keys, chunking, WAV, consent record, delete, mock provider end to end, route guards (flag off → 404; no free-text path), adapters with mocked fetch.`

const ISSUES = {
  type: 'object',
  properties: { issues: { type: 'array', items: { type: 'object', properties: {
    severity: { type: 'string', enum: ['high', 'medium', 'low'] },
    area: { type: 'string', enum: ['core', 'api', 'ui', 'other'] },
    where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
  }, required: ['severity', 'area', 'where', 'problem', 'fix'] } } },
  required: ['issues'],
}

phase('Audit')
const audit = await agent(`${BASE}\n\n${ARCH}\n\nAudit the partial build. 1) If node_modules is missing or incomplete, run npm install. 2) Read every voice file. 3) Run npx tsc --noEmit, npm run lint, npx vitest run and npm run build, and note which problems are pre-existing in the non-voice app (check with git stash-free reasoning: errors in files outside the voice folders are pre-existing) versus in voice code. 4) Write ${DESIGN}: the architecture as it should be (the target above, refined by what the code already does well), exact TypeScript interfaces, every API route (method, path, request, response, errors, flag check), the data model on disk, the recording, consent and playback flows, provider specifics verified against official docs (cite URLs and dates), security and privacy notes, how Supabase Storage replaces local storage later, the test plan, and the first-milestone runbook. 5) Return the gap list: every missing, half-written, broken or non-compliant piece, each tagged core, api or ui.`, { label: 'audit', phase: 'Audit', schema: ISSUES, effort: 'high' })
const gaps = (audit && audit.issues) || []
log(`Audit: ${gaps.length} gaps (${gaps.filter(g => g.area === 'core').length} core, ${gaps.filter(g => g.area === 'api').length} api, ${gaps.filter(g => g.area === 'ui').length} ui)`)

phase('Complete')
const byArea = a => JSON.stringify(gaps.filter(g => g.area === a || (a === 'core' && g.area === 'other')), null, 1)
await agent(`${BASE}\n\n${ARCH}\n\nThe design is ${DESIGN}. Complete lib/voice/ and scripts/voice-cost.mjs: fix every core gap below, finish half-written files, and make the unit tests pass (npx vitest run) with clean types (npx tsc --noEmit for voice files). Only touch lib/voice/, scripts/, vitest.config.mts and package.json. Gaps (JSON): ${byArea('core')}\nReturn what you changed and the test results.`, { label: 'complete:core', phase: 'Complete', effort: 'high' })
await parallel([
  () => agent(`${BASE}\n\n${ARCH}\n\nThe design is ${DESIGN}; lib/voice/ is now complete (use its exports). Complete app/api/voice/: fix every api gap below, finish half-written routes, keep every route behind the flag with no free-text path and safe ids, and make the route tests pass. Only touch app/api/voice/ and route tests. Gaps (JSON): ${byArea('api')}\nReturn what you changed.`, { label: 'complete:api', phase: 'Complete', effort: 'high' }),
  () => agent(`${BASE}\n\n${ARCH}\n\nThe design is ${DESIGN}; lib/voice/ is complete, and app/api/voice/ is being finished right now to the design's exact contracts (code against them). Complete app/voice-lab/ and components/voice-lab/: fix every ui gap below and finish half-written pieces. Match the mockup's look (#16203A, #E9A23B, #F7F1E5, #FFFCF5; Fraunces headings, Figtree UI, Literata story text via next/font/google), phone width first, accessible (real buttons and labels, 44px targets). Only touch app/voice-lab/ and components/voice-lab/. Gaps (JSON): ${byArea('ui')}\nReturn what you changed.`, { label: 'complete:ui', phase: 'Complete', effort: 'high' }),
])

phase('Verify')
let green = false, last = ''
for (let round = 1; round <= 4 && !green; round++) {
  last = await agent(`${BASE}\n\nVerify the voice prototype. Run npx tsc --noEmit, npm run lint, npx vitest run, npm run build. Also confirm the flag works: with VOICE_ENGINE_ENABLED unset, /voice-lab and every /api/voice route return 404 (start next briefly on a spare port and curl, then stop it). Fix every error in voice code and every integration mismatch between lib/voice, app/api/voice and the voice lab. Problems in non-voice files that existed before this work are out of scope unless they break the build. Re-run everything after fixing. Start your reply with GREEN if all checks pass with no voice errors and the flag check passed, else RED plus what still fails.`, { label: `verify:${round}`, phase: 'Verify', effort: 'high' })
  green = String(last).trim().startsWith('GREEN')
  log(`Verify round ${round}: ${green ? 'green' : 'red'}`)
}

phase('Code review')
const REVIEWS = [
  'LENS: security and privacy. Flag gate on every route and page; no free-text synthesis path anywhere (query params, JSON bodies, provider options); path traversal and id validation in storage; owner token strength and constant-time comparison; keys never reach the client or logs; audio served inline with no download affordance; consent record integrity (text, timestamp, hash); delete really removes provider voice, samples, consent audio and cache; nothing about a child is recorded; SSRF in the generic Chatterbox URL adapter.',
  'LENS: correctness. Provider adapters match the official API docs (verify with WebFetch: endpoints, fields, auth headers, output formats, stitching, errors, rate limits); cache keys and hits; Chatterbox chunking and audio joining; paragraph playback order and prefetch; WAV encoding (headers, sample rate); error paths; races (double create, concurrent synthesis of one paragraph); cost ledger math.',
  'LENS: product and UX. Walk the voice lab as Jon would: can he get from zero to hearing Chapter 1 in his own voice? Is consent clear and adults-only? Is the label always shown? Does the owner off switch work? Does the compare page make quality and cost easy to judge? Plain, warm copy; accessible; phone width.',
]
const cr = await parallel(REVIEWS.map((r, i) => () => agent(`${BASE}\n\n${r}\n\nReview lib/voice/, app/api/voice/, app/voice-lab/, components/voice-lab/, scripts/voice-cost.mjs and the tests. Report only real problems with concrete fixes. Do not edit.`, { label: `review:${i + 1}`, phase: 'Code review', schema: ISSUES, effort: 'high' })))
const crIssues = cr.filter(Boolean).flatMap(r => r.issues)
log(`Code review: ${crIssues.length} issues (${crIssues.filter(i => i.severity === 'high').length} high)`)
let fixResult = 'none needed'
if (crIssues.length) {
  fixResult = await agent(`${BASE}\n\nFix these code-review issues (all high and medium; low where cheap). Then run npx tsc --noEmit, npm run lint, npx vitest run and npm run build until green for voice code, and re-check the flag-off 404s. Start your reply with GREEN or RED. Issues (JSON): ${JSON.stringify(crIssues, null, 1)}`, { label: 'fix-review', phase: 'Code review', effort: 'high' })
}

phase('Docs')
const docs = await agent(`${BASE}\n\nWrite ${D}/voice/README.md for Jon (non-engineer, plain English): what the prototype does and doesn't do; the rules it enforces; one-time setup (ElevenLabs account and API key, and which plan Instant Voice Cloning needs per the research doc; optional Replicate or fal.ai key for Chatterbox; the exact .env.local lines including VOICE_ENGINE_ENABLED=true and VOICE_FAMILY_FILE=docs/redesign/private/family.json; npm install; npm run dev; open http://localhost:3000/voice-lab); the first milestone step by step (record consent, guided reading, create, preview, hear Chapter 1); comparing Chatterbox; switching the voice off and deleting it; where files live and how to wipe everything; the cost model (run node scripts/voice-cost.mjs and paste its output); known limits (no DRM; ElevenLabs terms on under-13 products and reselling need a written OK before any real family records; BIPA needs a signed release from each speaker; prototype only, never in production). Return a 5-line summary.`, { label: 'docs', phase: 'Docs' })

return { gaps: gaps.length, green, lastVerify: String(last).slice(0, 800), reviewIssues: crIssues.length, fix: String(fixResult).slice(0, 800), docs }
