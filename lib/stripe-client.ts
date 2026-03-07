import { loadStripe, type Stripe } from "@stripe/stripe-js";

// ─── STRIPE BROWSER CLIENT ──────────────────────────────────────────────────
// Used in client components for Stripe Checkout redirect.
// Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your Vercel environment variables.

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
