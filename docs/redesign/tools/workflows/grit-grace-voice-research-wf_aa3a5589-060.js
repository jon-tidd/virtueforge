export const meta = {
  name: 'grit-grace-voice-research',
  description: 'Research current TTS voice-cloning providers (ElevenLabs, Chatterbox, alternatives) with verified pricing, for the family-voice engine',
  phases: [
    { title: 'Research', detail: 'parallel sweeps: ElevenLabs, Chatterbox, alternatives, consent/legal' },
    { title: 'Verify', detail: 'adversarially re-check every price and key claim' },
    { title: 'Synthesize', detail: 'write voice/provider-research.md with a cost model' },
  ],
}

const REPO = '/Users/jontidd/code/virtueforge-redesign'
const OUT = REPO + '/docs/redesign/voice/provider-research.md'
const CONTEXT = `Context: "Grit & Grace" is a bedtime-story web app (Next.js 16, TypeScript, Supabase, Vercel). Its Heirloom plan ($89/yr or $9.99/mo) includes a "family story voice": a consenting adult (a parent or grandparent) records a spoken consent statement plus about 3 minutes of guided reading; we create a cloned voice; it then reads ONLY our chapter text (never free text), streamed paragraph by paragraph, generated once per chapter per family and cached. Every family's chapters are personalized (their kids' names are woven in), so audio is generated separately per family. Volume: about 60 chapters per season x 4 seasons = about 240 chapters a year; each chapter is about 7 minutes read aloud, about 1,000 words, roughly 5,500–6,000 characters. Rules: adults only, their own voice only, never a child's voice; no downloads; watermark where the provider supports it; keep the consent record; delete removes everything. Today's date is 2026-09-26: find CURRENT information (2026), and note the date of every price you cite.
Do not modify any files in the repo. Use WebSearch and WebFetch (load them with ToolSearch if needed). Prefer official docs and pricing pages; cite the exact URL for every claim.`

const FINDINGS = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: {
      topic: { type: 'string' },
      claim: { type: 'string', description: 'One specific, checkable fact (a price, a limit, a feature, a requirement)' },
      source_url: { type: 'string' },
      source_date: { type: 'string', description: 'Date shown on the page or date retrieved' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    }, required: ['topic', 'claim', 'source_url', 'confidence'] } },
    summary: { type: 'string' },
    open_questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['findings', 'summary'],
}

const SWEEPS = [
  { key: 'elevenlabs', prompt: `Research ElevenLabs for this use case: current plans and prices (monthly credits/characters, overage rates, per-character cost at each tier, enterprise/volume notes); which models suit long-form warm narration (e.g. Multilingual v2, Turbo/Flash, v3) and their credit cost per character; Instant Voice Cloning vs Professional Voice Cloning (audio needed, quality, which plans, limits on number of voices, API support to create/delete voices); consent and verification requirements for cloning (voice captcha/verification, terms of service on cloning someone's voice, prohibited uses, children); watermarking or AI-audio detection (AI Speech Classifier, C2PA or similar); streaming endpoints (HTTP streaming, websockets, latency); data retention and deletion of voices and audio; commercial-use rights on output; any 2025–2026 changes.` },
  { key: 'chatterbox', prompt: `Research Resemble AI's open-source Chatterbox TTS (and any newer variants, e.g. Chatterbox Multilingual or Turbo): license, voice cloning from a short reference clip (how many seconds), quality versus ElevenLabs in public comparisons or blind tests, emotion/exaggeration controls, the built-in PerTh watermarker (how it works, can it be verified), hardware needs (GPU type, VRAM, real-time factor), and realistic hosting costs to generate about 7 minutes of audio: e.g. Modal, RunPod, Replicate, fal.ai, Hugging Face endpoints, per-second GPU prices. Also Resemble AI's own hosted API pricing for cloning, if relevant. Include known limitations (long-form stability, max input length, chunking needs, artifacts).` },
  { key: 'alternatives', prompt: `Survey other voice-cloning TTS options as of 2026 that could serve warm, long-form bedtime narration from a ~3-minute sample, with API access: Cartesia (Sonic), Fish Audio, Hume (Octave), Microsoft Azure Custom Neural Voice / personal voice (gating and approval), Google Cloud (Chirp/instant custom voice), Amazon Polly, OpenAI (does it allow custom voice cloning?), PlayHT status, Speechify, and open models (F5-TTS, XTTS/Coqui status, Kokoro has no cloning, Orpheus, Sesame, Dia, Zonos, IndexTTS, etc.). For each: cloning support and sample length, price per character or per minute, licensing for commercial use, consent requirements, watermarking, streaming. Flag which are serious candidates.` },
  { key: 'consent', prompt: `Research the consent, legal and safety side of cloning an adult's voice for a family product in the US: Illinois BIPA (does a voiceprint count; what written consent and retention/destruction policy it requires; private right of action and damages), Texas CUBI, Washington's biometric law, Colorado and other 2024–2026 state laws on AI voice/digital replicas (e.g. Tennessee ELVIS Act, California AB 2602/AB 1836, the proposed federal NO FAKES Act status), FTC guidance on voice cloning, COPPA implications (a child hearing the voice is fine; a child's voice must never be used), and best-practice consent records (spoken consent statement, timestamp, what text, revocation). Also what major providers require in their ToS for cloning another person's voice. This is background for a lawyer, not legal advice.` },
]

phase('Research')
const results = await parallel(SWEEPS.map(s => () => agent(`${CONTEXT}\n\nTASK: ${s.prompt}\n\nReturn specific, checkable findings with exact source URLs.`,
  { label: `research:${s.key}`, phase: 'Research', schema: FINDINGS, effort: 'high' })))
const all = results.filter(Boolean)
const pricey = all.flatMap(r => r.findings).filter(f => /\$|price|cost|credit|per (char|minute|hour|second)|tier|plan/i.test(f.claim))
log(`Research found ${all.flatMap(r => r.findings).length} findings; ${pricey.length} are price/cost claims to verify`)

phase('Verify')
const VERDICT = {
  type: 'object',
  properties: {
    checks: { type: 'array', items: { type: 'object', properties: {
      claim: { type: 'string' },
      verdict: { type: 'string', enum: ['confirmed', 'corrected', 'unverifiable'] },
      corrected_claim: { type: 'string' },
      source_url: { type: 'string' },
    }, required: ['claim', 'verdict', 'source_url'] } },
  },
  required: ['checks'],
}
// Split price claims into batches of ~12 and verify each batch independently.
const batches = []
for (let i = 0; i < pricey.length; i += 12) batches.push(pricey.slice(i, i + 12))
const verified = await parallel(batches.map((b, i) => () => agent(`${CONTEXT}\n\nYou are a skeptical fact-checker. For each claim below, open the source (or the provider's current official pricing/docs page) and check it is accurate TODAY. Default to "unverifiable" if you cannot confirm it from an official page. If the number is wrong or outdated, give the corrected claim and its URL.\n\nClaims (JSON):\n${JSON.stringify(b, null, 1)}`,
  { label: `verify:${i + 1}`, phase: 'Verify', schema: VERDICT })))
const checks = verified.filter(Boolean).flatMap(v => v.checks)
log(`Verified ${checks.length} claims: ${checks.filter(c => c.verdict === 'confirmed').length} confirmed, ${checks.filter(c => c.verdict === 'corrected').length} corrected, ${checks.filter(c => c.verdict === 'unverifiable').length} unverifiable`)

phase('Synthesize')
const synth = await agent(`${CONTEXT}\n\nYou may now write ONE file: ${OUT} (create the folder). Write "Family story voice: provider research", dated September 26, 2026, for Jon (a non-specialist founder) in plain English.

Inputs: research findings (JSON) ${JSON.stringify(all, null, 1)}\n\nPrice fact-checks (JSON; prefer corrected claims, and mark anything unverifiable) ${JSON.stringify(checks, null, 1)}

Sections:
1. The short answer: which provider to prototype with first and why, which self-hosted model to compare against, and the one or two biggest risks.
2. Candidates table: provider, cloning (sample length, quality notes), price per 1,000 characters (or per minute) at the tier we'd realistically use, commercial rights, consent requirements, watermarking, streaming, and a verdict.
3. Cost model per Heirloom family per year against $89/yr: characters per chapter (about 5,750), chapters per year (about 240), then three usage scenarios (light: the voice reads 1 night a week; typical: 3 nights a week; heavy: every chapter). Show the math for ElevenLabs at the realistic tier(s), for Chatterbox self-hosted (GPU seconds per chapter x price), and for one or two strong alternatives. Also show the one-time cost of creating a voice. Say clearly which scenarios fit inside $89 with room for margin, and what levers exist (cache once per chapter per family, generate only on nights the voice is chosen, cheaper model tiers, shorter picture-book tellings, self-hosting).
4. Consent, watermark and legal notes for the privacy lawyer: what each provider requires; the state laws that matter (BIPA first); a recommended consent record (fields), retention and deletion policy.
5. Open questions.
6. Sources: every URL used, with the date.
Mark any price that could not be verified from an official page.

Return a 6-line summary of the recommendation and the cost-model bottom line.`,
  { label: 'synthesize-voice-research', phase: 'Synthesize', effort: 'high' })

return { summary: synth, findings: all.flatMap(r => r.findings).length, checks: checks.length }
