import type { Metadata } from "next";
import { Figtree, Fraunces, Literata } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isVoiceEngineEnabled } from "@/lib/voice/flag";
import "./voice-lab.css";

// The voice lab is a prototype behind VOICE_ENGINE_ENABLED, never in production.
// This layout only checks the flag (it also wraps /voice-lab/unlock); every
// page checks the lab secret itself with requireLabPage (lib/voice/lab-page.ts).

export const dynamic = "force-dynamic";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const literata = Literata({ subsets: ["latin"], variable: "--font-literata" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "Voice lab · Grit & Grace",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function VoiceLabLayout({ children }: { children: ReactNode }) {
  if (!isVoiceEngineEnabled()) notFound();
  return (
    <div className={`voice-lab ${fraunces.variable} ${literata.variable} ${figtree.variable} min-h-screen bg-[#16203A] text-[#F4E9D2]`}>
      <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-2 pt-4 sm:px-5">
        <Link href="/voice-lab" className="flex min-h-[44px] items-center gap-2 whitespace-nowrap !text-[#F4E9D2]">
          <svg width="20" height="24" viewBox="0 0 22 26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M8 2h6M11 2v3" />
            <path d="M6 7h10l-1.2 13H7.2z" />
            <path d="M5 21h12v3H5z" />
            <path d="M11 11c1.6 1.8 1.6 3.6 0 5.4-1.6-1.8-1.6-3.6 0-5.4z" fill="#E9A23B" stroke="none" />
          </svg>
          <span className="font-display text-[18px] font-semibold">
            Grit <em className="text-[#E9A23B]">&amp;</em> Grace
          </span>
          <span className="ml-1 hidden whitespace-nowrap rounded-full border border-[#3A4A70] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#B8AE9A] sm:inline-block">
            Voice lab · prototype
          </span>
        </Link>
        <nav className="flex gap-1 text-[13.5px] font-bold" aria-label="Voice lab">
          <Link href="/voice-lab" className="flex min-h-[44px] items-center px-2">
            Record
          </Link>
          <Link href="/voice-lab/compare" className="flex min-h-[44px] items-center px-2">
            Compare
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-5">{children}</main>
    </div>
  );
}
