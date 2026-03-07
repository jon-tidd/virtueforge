import Stripe from "stripe";

// ─── STRIPE SERVER CLIENT ────────────────────────────────────────────────────
// Used in API routes only (server-side). Never import this in client components.
// Set STRIPE_SECRET_KEY in your Vercel environment variables.

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripeEnabled = !!stripeSecretKey;

export const stripe = stripeEnabled
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" })
  : null;

// ─── PRICE IDS ───────────────────────────────────────────────────────────────
// After creating products in Stripe Dashboard, paste the price IDs here.
// These are placeholder values — replace with your real Stripe price IDs.

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "",
  yearly: process.env.STRIPE_PRICE_YEARLY || "",
} as const;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
