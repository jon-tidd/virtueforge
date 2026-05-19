import { NextRequest, NextResponse } from "next/server";

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// In-memory rate limiter (resets on cold start / redeploy, which is fine for
// Vercel serverless). Tracks requests per IP with a sliding window.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 requests per minute per IP
const DAILY_LIMIT_MAX = 30; // hard daily cap per IP
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

type RateEntry = { timestamps: number[]; dailyTimestamps: number[] };
const rateLimitMap = new Map<string, RateEntry>();

// Clean up stale entries every 10 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < 10 * 60 * 1000) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    entry.dailyTimestamps = entry.dailyTimestamps.filter((t) => now - t < DAILY_WINDOW_MS);
    if (entry.timestamps.length === 0 && entry.dailyTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  cleanupRateLimitMap();
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { timestamps: [], dailyTimestamps: [] };
    rateLimitMap.set(ip, entry);
  }

  // Clean current entry
  entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  entry.dailyTimestamps = entry.dailyTimestamps.filter((t) => now - t < DAILY_WINDOW_MS);

  // Check daily limit
  if (entry.dailyTimestamps.length >= DAILY_LIMIT_MAX) {
    const oldestDaily = entry.dailyTimestamps[0];
    return { allowed: false, retryAfter: Math.ceil((oldestDaily + DAILY_WINDOW_MS - now) / 1000) };
  }

  // Check per-minute limit
  if (entry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = entry.timestamps[0];
    return { allowed: false, retryAfter: Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000) };
  }

  entry.timestamps.push(now);
  entry.dailyTimestamps.push(now);
  return { allowed: true };
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a master children's storyteller in the tradition of Aesop, the Brothers Grimm, C.S. Lewis, and George MacDonald.

ABSOLUTE RULES:
1. CONTENT SAFETY: No violence beyond age-appropriate conflict. No sexual content. No profanity. No horror, abuse, or trauma. No substance use. No self-harm.
2. CLASSICAL VIRTUE FRAMEWORK: Align with the four cardinal virtues (Prudence, Justice, Courage, Temperance) rooted in the Aristotelian-Thomistic tradition. Do NOT inject modern political ideology, identity politics, critical theory, or any contemporary ideological framework. The moral universe should be timeless.
3. VIRTUE THROUGH ACTION: The character must PRACTICE the virtue through concrete choices and habits. Never have a character deliver a moral speech or say "I learned that..." Show hexis — the forging of character through habitual practice.
4. NARRATIVE QUALITY: Write vivid prose appropriate to the reading level. Memorable characters, specific settings, compelling plots.
5. SAFE REDIRECTION: If the user's situation seems inappropriate, redirect to a wholesome interpretation.
6. PERSONALIZATION: Use the child's name, age, and sex to calibrate language, character relatability, and themes.`;

// ─── Prompt Sanitization ─────────────────────────────────────────────────────
// Strip common injection patterns from user prompts
function sanitizePrompt(prompt: string): string {
  // Remove any system/assistant role injection attempts
  let cleaned = prompt
    .replace(/\b(system|assistant)\s*:/gi, "")
    .replace(/```\s*(system|xml|json)\b/gi, "```")
    .replace(/<\/?system>/gi, "")
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?|prompts?)/gi, "[redacted]")
    .replace(/you\s+are\s+now\s+(a|an)\s+/gi, "the child is ")
    .replace(/pretend\s+(to\s+be|you('re|\s+are))/gi, "imagine ");

  // Trim excessive whitespace
  cleaned = cleaned.replace(/\s{3,}/g, "  ").trim();
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ──
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before generating another story." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter || 60) },
        }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt is required." },
        { status: 400 }
      );
    }

    if (prompt.length > 3000) {
      return NextResponse.json(
        { error: "Prompt is too long. Please keep it under 3000 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    // Sanitize the user prompt
    const cleanPrompt = sanitizePrompt(prompt);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        // Headroom for ~2500-word custom stories (long bedtime sagas).
        // Sonnet bills on actual output, not the cap, so raising this is free.
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: cleanPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "API request failed" },
        { status: response.status }
      );
    }

    const text = data.content?.map((c: { text?: string }) => c.text || "").join("\n") || "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
