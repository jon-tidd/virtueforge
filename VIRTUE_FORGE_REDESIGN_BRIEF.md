# Virtue Forge — Redesign Brief for Claude Code

## Project Context
Virtue Forge (virtueforge.vercel.app) is a free website helping parents build character in children through classical virtue ethics and storytelling. The framework is solid — 4 cardinal virtues, 16 sub-virtues, 55+ curated books, AI story generation, shield/crest tracker. But the UI is underwhelming. It needs to feel like a premium, modern product — not a side project.

Tech stack: Next.js (App Router), TypeScript, Tailwind CSS, deployed on Vercel. Story generation uses the Anthropic API via a server route at `/api/generate`.

Project location: `~/virtuequest`
Run with: `npm run dev` → http://localhost:3000

## What's Wrong Now
1. **The landing page is flat and boring.** No energy, no motion, no visual hook. It reads like a blog post, not a product.
2. **Typography is uninspired.** Georgia is fine for body text but there's no display font that grabs attention.
3. **No imagery or visual richness.** It's all text and colored boxes. No illustrations, gradients, textures, or visual storytelling.
4. **The flow is unclear.** A first-time parent landing on this site doesn't immediately understand: what is this, what do I do, why should I care?
5. **The navigation feels like a spreadsheet.** Six equal tabs with no hierarchy or visual cues about the journey.
6. **The virtue compass is functional but not beautiful.** It should be a centerpiece visual element, not a utilitarian SVG.
7. **The book browsing experience is weak.** No filtering, no search, no way to freely explore the catalog.
8. **Mobile experience is untested and likely broken.**
9. **The shield/crest tracker is too small and utilitarian.** It should feel like an achievement — something parents are proud to look at.
10. **No animations, no transitions, no micro-interactions.** The whole site is static.

## What "Great" Looks Like
Think of the visual quality and polish of sites like:
- **Linear.app** — clean, dark, smooth animations, feels premium
- **Stripe.com** — beautiful gradients, thoughtful typography, clear hierarchy
- **Headspace.com** — warm, inviting, clear value prop, beautiful illustrations
- **Notion.so** — clean whitespace, clear navigation, delightful interactions

The aesthetic should be: **Bold, modern, warm but not soft.** This is about forging character — there should be a sense of strength and intentionality. Navy + gold + white palette works, but it needs depth: gradients, subtle textures, shadows, motion.

## The User Journey (Make This Obvious)

### First Visit Flow
1. **LAND** → Immediately see a stunning hero with a clear headline and ONE call-to-action. The parent should understand the value prop in 5 seconds: "Build your child's character through the world's oldest method — great stories."
2. **EXPLORE** → Scroll down to see a beautiful visual showing the 4 cardinal virtues (not a text description — a visual). Social proof, a quick "how it works" in 3 steps.
3. **START** → Click one button that begins the journey. Either guided quiz or direct virtue selection. The virtue compass should be a stunning interactive visual.
4. **ADD CHILD** → Quick, clean form. Age/sex/reading level/struggles. No friction.
5. **GET RECOMMENDATIONS** → See books immediately. Clear cards with covers (use placeholder images or colored gradients if no covers). Filter by virtue, reading level, format (free online vs. purchase).
6. **GENERATE A STORY** → Big, inviting section. Pick a virtue, describe the situation, hit "Forge Story." The generation should feel magical — loading animation, then the story appears beautifully formatted with export options.
7. **TRACK PROGRESS** → The shield should be a large, beautiful, animated visualization. It should feel like an achievement system — parents should WANT to fill it in.

### Returning Visit Flow
- Skip the hero. Go straight to their dashboard showing all children's shields, recent activity, and recommended next reads.

## Specific Feature Upgrades

### Book Explorer (NEW)
- Add a dedicated "Explore Books" page/mode
- Filter by: cardinal virtue, sub-virtue, reading level, availability (free online / purchase)
- Search by title or author
- Sort by: relevance, year, reading level
- Card layout with visual hierarchy — title prominent, virtue tags, clear action buttons

### Navigation Redesign
- Consider a left sidebar on desktop instead of top tabs
- Or a streamlined top nav with clear visual hierarchy
- The journey should feel guided, not like a menu of equal options
- On mobile: bottom tab bar or hamburger menu

### Animations & Interactions
- Page transitions (fade in/slide)
- Scroll-triggered animations for content sections
- Hover effects on cards and buttons
- Loading animation for story generation (something thematic — a forge/anvil/flame animation)
- The virtue compass should animate when you select/deselect virtues
- The shield should animate when it fills

### Visual Richness
- Use CSS gradients, mesh gradients, or subtle patterns for backgrounds
- Add depth with layered shadows and glass morphism where appropriate
- Consider subtle particle effects or geometric patterns in the hero
- The story display should feel like a storybook page
- Use color strategically — each virtue's color should create a clear visual language throughout the site

## Technical Notes
- The data model in `/lib/data.ts` is solid — don't change the virtue framework, book database, or struggle mappings
- The API route at `/app/api/generate/route.ts` works — don't change it
- Storage uses localStorage via `/lib/storage.ts` — this is fine for now
- All component source is in `/components/` and design tokens in `/lib/tokens.ts`
- Feel free to add any npm packages needed (framer-motion, lucide-react icons, etc.)
- Keep all styles working with inline styles OR properly configured Tailwind — the previous version had issues with Tailwind purging dynamic classes

## Priority Order
If you need to make tradeoffs:
1. Landing page / first impression (hero, value prop, visual wow factor)
2. Overall visual polish and typography
3. Book explorer with filtering
4. Navigation and flow redesign
5. Animations and micro-interactions
6. Shield tracker enhancement
7. Mobile responsiveness

## Brand Identity
- Name: **Virtue Forge**
- Tagline: **Building Character Through Story**
- Palette: Navy (#0A1628), Gold (#D4A846), White (#FFFFFF) as base — but add depth with gradients and accent colors
- Tone: Strong, intentional, classical but modern. Not cute, not corporate. Think "a master craftsman's workshop" — refined but powerful.
- The forge metaphor should be subtle but present: forging character, tempering virtue, building strength

## One Last Thing
This site should make a parent think: "Finally — someone built a real tool for this." It should feel like a product with conviction, not a generic AI demo. The classical philosophy is the backbone, the modern UI is the invitation. Make the invitation irresistible.
