"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

// Small shared pieces, styled after the voice mockups (VoiceIntro, VoiceReady):
// navy night background, cream text, amber actions, Fraunces / Literata / Figtree.

export function Eyebrow({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "muted" | "ink" }) {
  const color = tone === "amber" ? "text-[#E9A23B]" : tone === "ink" ? "text-[#8A5212]" : "text-[#A99F8C]";
  return <div className={`text-[11.5px] font-bold uppercase tracking-[0.14em] ${color}`}>{children}</div>;
}

export function Title({ children, as: As = "h1" }: { children: ReactNode; as?: "h1" | "h2" | "h3" }) {
  const size = As === "h1" ? "text-[30px] sm:text-[34px]" : As === "h2" ? "text-[24px]" : "text-[19px]";
  return <As className={`font-display mt-1.5 ${size} font-semibold leading-[1.1] text-[#FBF3E2]`}>{children}</As>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-[#2F3E62] bg-[#1F2B48] p-4 ${className}`}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles =
    variant === "primary"
      ? "bg-[#E9A23B] text-[#16203A] hover:bg-[#F2B559]"
      : variant === "danger"
        ? "bg-[#D9573A] text-white hover:bg-[#E46A4E]"
        : "border-[1.5px] border-[#3A4A70] text-[#DCD2BE] hover:border-[#E9A23B]";
  return (
    <button
      {...rest}
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-6 text-[16px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** "Made from Jon's recording, with their permission": shown wherever the voice plays. */
export function VoiceLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3A4A70] px-3 py-1.5 text-[12px] font-bold text-[#DCD2BE]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16v.5" />
      </svg>
      {label}
    </span>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="mt-3 rounded-2xl border border-[#D9573A] bg-[#2A1A20] px-4 py-3 text-[14px] text-[#F4C9BD]">
      {children}
    </div>
  );
}

export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2 text-[14.5px] leading-snug text-[#DCD2BE]">
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#E9A23B]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function fmtUsd(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(n < 1 ? 3 : 2)}`;
}
