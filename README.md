# Bedtime Virtues

An AI-powered platform that generates personalized bedtime stories rooted in Aristotle's cardinal virtues. Built on the idea of *hexis* -- virtue as a habit forged through deliberate practice -- character is built one story, one conversation, one bedtime at a time.

**Live at [virtueforge.vercel.app](https://virtueforge.vercel.app)**

## Features

- **AI Story Forge** -- Enter your child's real struggle and get a personalized bedtime story mapped to specific virtues with discussion prompts, powered by Claude
- **57+ Curated Classics** -- Hand-selected stories spanning 2,600 years (Aesop to C.S. Lewis), each mapped to classical virtues
- **Virtue Compass** -- Radar chart tracking character growth across 16 virtues organized under Prudence, Justice, Courage, and Temperance
- **Guided Discussion Prompts** -- Every story includes parent discussion guides to deepen the conversation
- **Privacy-First** -- Data stays on the user's device via local storage, with optional cloud sync
- **Freemium Model** -- Free tier with Stripe-powered upgrades

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion, Radix UI
- **Backend**: Supabase (auth + database)
- **AI**: Anthropic Claude API (story generation)
- **Payments**: Stripe
- **Hosting**: Vercel (with Vercel Analytics)

## Project Structure

```
app/            Next.js App Router pages and API routes
  api/          Server-side API routes (generate, stripe, subscribe)
components/     React components (app shell, landing page, modals)
lib/            Shared utilities (storage, analytics, Supabase client, Stripe)
public/         Static assets
supabase/       Supabase configuration and migrations
```

## Getting Started

```bash
git clone https://github.com/jon-tidd/virtueforge.git
cd virtueforge
npm install
```

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## License

MIT
