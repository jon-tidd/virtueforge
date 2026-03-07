// ─── CONVERSION EVENT TRACKING ──────────────────────────────────────────────
// Lightweight event tracking. Logs to console in dev, sends to Vercel
// Analytics (or any future provider) in production.

type EventName =
  | "story_generated"
  | "book_clicked"
  | "child_profile_created"
  | "virtue_quiz_completed"
  | "pricing_page_viewed"
  | "email_subscribed"
  | "demo_scenario_clicked"
  | "consent_granted"
  | "consent_declined"
  | "upgrade_clicked"
  | "pdf_exported"
  | "checkout_started";

export function trackEvent(name: EventName, properties?: Record<string, string | number>) {
  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${name}`, properties || "");
  }

  // Vercel Web Analytics custom events (if available)
  if (typeof window !== "undefined" && "va" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const va = (window as any).va;
    if (typeof va === "function") va("event", { name, ...properties });
  }
}
