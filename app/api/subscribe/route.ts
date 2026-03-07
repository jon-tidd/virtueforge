import { NextRequest, NextResponse } from "next/server";
import { saveEmailSubscription, supabaseEnabled } from "@/lib/supabase";
import { appendFileSync } from "fs";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    if (supabaseEnabled) {
      // Save to Supabase
      const { error } = await saveEmailSubscription(normalizedEmail);
      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
    } else {
      // Fallback: append to a local file (for pre-Supabase launch)
      try {
        const logPath = join(process.cwd(), "email-subscribers.log");
        appendFileSync(logPath, `${normalizedEmail}\t${new Date().toISOString()}\n`);
      } catch {
        // In serverless (Vercel), file writes may fail — log to console
        console.log(`[email-subscribe] ${normalizedEmail} at ${new Date().toISOString()}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
