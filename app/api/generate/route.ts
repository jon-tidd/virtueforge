import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a master children's storyteller in the tradition of Aesop, the Brothers Grimm, C.S. Lewis, and George MacDonald.

ABSOLUTE RULES:
1. CONTENT SAFETY: No violence beyond age-appropriate conflict. No sexual content. No profanity. No horror, abuse, or trauma. No substance use. No self-harm.
2. CLASSICAL VIRTUE FRAMEWORK: Align with the four cardinal virtues (Prudence, Justice, Courage, Temperance) rooted in the Aristotelian-Thomistic tradition. Do NOT inject modern political ideology, identity politics, critical theory, or any contemporary ideological framework. The moral universe should be timeless.
3. VIRTUE THROUGH ACTION: The character must PRACTICE the virtue through concrete choices and habits. Never have a character deliver a moral speech or say "I learned that..." Show hexis — the forging of character through habitual practice.
4. NARRATIVE QUALITY: Write vivid prose appropriate to the reading level. Memorable characters, specific settings, compelling plots.
5. SAFE REDIRECTION: If the user's situation seems inappropriate, redirect to a wholesome interpretation.
6. PERSONALIZATION: Use the child's name, age, and sex to calibrate language, character relatability, and themes.`;

export async function POST(req: NextRequest) {
  try {
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
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
