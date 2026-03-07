import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ────────────────────────────────────────────────────────
// Creates a Supabase client for browser-side usage.
// Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your
// Vercel environment variables (and .env.local for local dev).
//
// Until you create a Supabase project, the app falls back to localStorage
// via the helpers below.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────

export async function signInWithMagicLink(email: string) {
  if (!supabase) return { error: "Supabase not configured" };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });
  return { error: error?.message || null };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ─── DATA HELPERS ────────────────────────────────────────────────────────────
// These mirror the localStorage API but persist to Supabase when available.

export async function saveAppData(userId: string, appData: Record<string, unknown>) {
  if (!supabase) return;
  await supabase.from("app_data").upsert({
    user_id: userId,
    data: appData,
    updated_at: new Date().toISOString(),
  });
}

export async function loadAppData(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("app_data")
    .select("data")
    .eq("user_id", userId)
    .single();
  return data?.data || null;
}

export async function saveEmailSubscription(email: string) {
  if (!supabase) return { error: null }; // localStorage fallback handled elsewhere
  const { error } = await supabase.from("email_subscribers").insert({
    email,
    subscribed_at: new Date().toISOString(),
  });
  if (error?.code === "23505") return { error: null }; // duplicate, ignore
  return { error: error?.message || null };
}

// ─── SUBSCRIPTION HELPERS ────────────────────────────────────────────────────

export async function getUserSubscription(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();
  return data;
}
