"use client";
// ─── SVG Illustrations for Bedtime Virtues Landing Page ──────────────────────
// Geometric/minimal style using navy (#0A1628) + gold (#D4A846) palette
import Image from "next/image";

const NAVY = "#0A1628";
const NAVY_MID = "#142240";
const NAVY_LIGHT = "#1E3258";
const GOLD = "#D4A846";
const GOLD_BRIGHT = "#F0C94B";
const GOLD_SUBTLE = "#FBF5E6";
const WHITE = "#FFFFFF";
const GRAY100 = "#F3F4F6";
const GRAY200 = "#E5E7EB";
const GRAY300 = "#D1D5DB";
const GRAY400 = "#9CA3AF";
const GRAY500 = "#6B7280";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HERO — Parent reading to child by firelight
// ═══════════════════════════════════════════════════════════════════════════════
export function HeroIllustration() {
  return (
    <Image
      src="/images/hero-firelight.png"
      alt="Parent and child reading a glowing storybook together by firelight"
      width={1400}
      height={600}
      priority
      style={{ width: "100%", height: "auto", maxHeight: 400, objectFit: "cover", borderRadius: 12 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SCREEN TIME vs READING — Split comparison (for dark bg section)
// ═══════════════════════════════════════════════════════════════════════════════
export function ScreenTimeIllustration() {
  return (
    <Image
      src="/images/crisis-screen.png"
      alt="Split illustration: cold blue screen time on the left versus warm golden parent-child reading on the right"
      width={1400}
      height={600}
      style={{ width: "100%", height: "auto", maxHeight: 320, objectFit: "cover", borderRadius: 12 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CHARACTER CYCLE — Circular formation diagram
// ═══════════════════════════════════════════════════════════════════════════════
export function CharacterCycleDiagram() {
  return (
    <Image
      src="/images/character-cycle.png"
      alt="Ornate golden compass wheel with open book, representing the cycle of character formation"
      width={1200}
      height={800}
      style={{ width: "100%", height: "auto", maxHeight: 400, objectFit: "cover", borderRadius: 12 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SCIENCE INFOGRAPHIC — Research visualization
// ═══════════════════════════════════════════════════════════════════════════════
export function ScienceInfographic() {
  return (
    <svg viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 200, borderRadius: 12 }}>
      <rect width="800" height="200" fill={WHITE} rx="12" />
      <rect width="800" height="200" fill={GOLD_SUBTLE} rx="12" opacity="0.3" />

      {/* Left: Brain illustration */}
      <g transform="translate(80, 100)">
        {/* Stylized brain outline */}
        <path d="M-25 -5 Q-25 -25 -10 -30 Q0 -33 5 -28 Q10 -33 20 -30 Q35 -25 35 -5 Q35 15 20 22 Q10 28 5 20 Q0 28 -10 22 Q-25 15 -25 -5 Z"
          fill="none" stroke={NAVY} strokeWidth="2" opacity="0.3" />
        {/* Neural connections */}
        <circle cx="-8" cy="-10" r="3" fill={GOLD} opacity="0.5" />
        <circle cx="8" cy="-15" r="2.5" fill={GOLD} opacity="0.4" />
        <circle cx="15" cy="0" r="3" fill={GOLD} opacity="0.5" />
        <circle cx="-5" cy="8" r="2" fill={GOLD} opacity="0.4" />
        <circle cx="10" cy="10" r="2.5" fill={GOLD} opacity="0.45" />
        <line x1="-8" y1="-10" x2="8" y2="-15" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
        <line x1="8" y1="-15" x2="15" y2="0" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
        <line x1="15" y1="0" x2="10" y2="10" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
        <line x1="-5" y1="8" x2="10" y2="10" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
        <line x1="-8" y1="-10" x2="-5" y2="8" stroke={GOLD} strokeWidth="0.8" opacity="0.3" />
        <text x="0" y="45" textAnchor="middle" fontSize="10" fill={NAVY}
          fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.6">
          Neuroscience
        </text>
      </g>

      {/* Center: Connecting arrow flow */}
      <g transform="translate(200, 100)">
        {/* Arrow 1 */}
        <line x1="0" y1="0" x2="60" y2="0" stroke={GOLD} strokeWidth="1.5" opacity="0.3" />
        <polygon points="60,-4 68,0 60,4" fill={GOLD} opacity="0.3" />

        {/* Book + Heart (stories & empathy) */}
        <g transform="translate(110, 0)">
          <rect x="-18" y="-22" width="36" height="44" rx="4" fill="none"
            stroke={NAVY} strokeWidth="1.5" opacity="0.25" />
          <line x1="0" y1="-18" x2="0" y2="18" stroke={NAVY} strokeWidth="0.8" opacity="0.15" />
          {/* Lines in book */}
          <line x1="-12" y1="-12" x2="-3" y2="-12" stroke={NAVY} strokeWidth="0.5" opacity="0.15" />
          <line x1="-12" y1="-6" x2="-3" y2="-6" stroke={NAVY} strokeWidth="0.5" opacity="0.15" />
          <line x1="4" y1="-12" x2="13" y2="-12" stroke={NAVY} strokeWidth="0.5" opacity="0.15" />
          <line x1="4" y1="-6" x2="13" y2="-6" stroke={NAVY} strokeWidth="0.5" opacity="0.15" />
          {/* Heart on book */}
          <path d="M0 2 Q3 -3 6 0 Q9 3 6 8 L0 14 L-6 8 Q-9 3 -6 0 Q-3 -3 0 2 Z"
            fill={GOLD} opacity="0.4" />
          <text x="0" y="38" textAnchor="middle" fontSize="10" fill={NAVY}
            fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.6">
            Stories + Empathy
          </text>
        </g>

        {/* Arrow 2 */}
        <line x1="155" y1="0" x2="215" y2="0" stroke={GOLD} strokeWidth="1.5" opacity="0.3" />
        <polygon points="215,-4 223,0 215,4" fill={GOLD} opacity="0.3" />

        {/* Rising chart (outcomes) */}
        <g transform="translate(270, 0)">
          <line x1="-25" y1="20" x2="-25" y2="-20" stroke={NAVY} strokeWidth="1" opacity="0.2" />
          <line x1="-25" y1="20" x2="25" y2="20" stroke={NAVY} strokeWidth="1" opacity="0.2" />
          {/* Bars rising */}
          <rect x="-18" y="5" width="8" height="15" rx="1" fill="#2563EB" opacity="0.3" />
          <rect x="-6" y="-2" width="8" height="22" rx="1" fill="#D97706" opacity="0.3" />
          <rect x="6" y="-10" width="8" height="30" rx="1" fill="#DC2626" opacity="0.3" />
          <rect x="18" y="-18" width="8" height="38" rx="1" fill="#059669" opacity="0.35" />
          {/* Trend line */}
          <path d="M-14 12 L-2 5 L10 -3 L22 -12" fill="none" stroke={GOLD}
            strokeWidth="1.5" opacity="0.5" />
          <text x="5" y="38" textAnchor="middle" fontSize="10" fill={NAVY}
            fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.6">
            Better Outcomes
          </text>
        </g>
      </g>

      {/* Right: Shield (virtue) */}
      <g transform="translate(680, 100)">
        <path d="M0 -28 L22 -18 L22 5 Q22 20 0 30 Q-22 20 -22 5 L-22 -18 Z"
          fill="none" stroke={NAVY} strokeWidth="2" opacity="0.25" />
        <path d="M0 -18 L14 -10 L14 2 Q14 14 0 22 Q-14 14 -14 2 L-14 -10 Z"
          fill={GOLD} opacity="0.15" />
        {/* Star in shield center */}
        <path d="M0 -8 L2 -2 L8 -2 L3 2 L5 8 L0 4 L-5 8 L-3 2 L-8 -2 L-2 -2 Z"
          fill={GOLD} opacity="0.4" />
        <text x="0" y="45" textAnchor="middle" fontSize="10" fill={NAVY}
          fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.6">
          Character
        </text>
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. STORY FORGE MOCKUP — UI preview
// ═══════════════════════════════════════════════════════════════════════════════
export function StoryForgeMockup() {
  return (
    <svg viewBox="0 0 480 270" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8 }}>
      <defs>
        <clipPath id="sf-clip"><rect width="480" height="270" rx="8" /></clipPath>
      </defs>
      <g clipPath="url(#sf-clip)">
        {/* Window chrome */}
        <rect width="480" height="270" fill={WHITE} rx="8" />
        <rect width="480" height="30" fill={GRAY100} />
        {/* Window dots */}
        <circle cx="14" cy="15" r="4" fill="#FF5F57" />
        <circle cx="28" cy="15" r="4" fill="#FEBC2E" />
        <circle cx="42" cy="15" r="4" fill="#28C840" />
        {/* URL bar */}
        <rect x="100" y="8" width="280" height="14" rx="3" fill={WHITE} />
        <text x="130" y="18" fontSize="7" fill={GRAY400} fontFamily="Inter, sans-serif">
          bedtimevirtues.com/stories
        </text>

        {/* App header */}
        <rect x="0" y="30" width="480" height="28" fill={NAVY} />
        <text x="20" y="48" fontSize="10" fill={WHITE} fontFamily="Inter, sans-serif" fontWeight="700">
          Story Forge
        </text>
        <text x="400" y="48" fontSize="8" fill={GOLD} fontFamily="Inter, sans-serif" fontWeight="600">
          AI-Powered
        </text>

        {/* Form area */}
        <rect x="20" y="70" width="200" height="16" rx="3" fill={GRAY100} />
        <text x="28" y="81" fontSize="7" fill={GRAY500} fontFamily="Inter, sans-serif">
          Tell us about your child...
        </text>

        {/* Child profile badge */}
        <rect x="20" y="95" width="60" height="18" rx="9" fill={GOLD_SUBTLE} />
        <text x="32" y="107" fontSize="7" fill={NAVY} fontFamily="Inter, sans-serif" fontWeight="600">
          Sam, age 5
        </text>

        {/* Virtue tag */}
        <rect x="86" y="95" width="52" height="18" rx="9" fill="#FEF2F2" />
        <text x="93" y="107" fontSize="7" fill="#DC2626" fontFamily="Inter, sans-serif" fontWeight="600">
          Generosity
        </text>

        {/* Generated story preview */}
        <rect x="20" y="125" width="440" height="130" rx="6" fill={GRAY100} opacity="0.5" />
        <rect x="20" y="125" width="440" height="130" rx="6" fill="none"
          stroke={GOLD} strokeWidth="1" opacity="0.3" />

        {/* Story title */}
        <text x="32" y="146" fontSize="11" fill={NAVY} fontFamily="Georgia, serif"
          fontWeight="700" fontStyle="italic">
          The Golden Acorn
        </text>

        {/* Story text lines */}
        {[158, 170, 182, 194, 206, 218, 230].map((y, i) => (
          <rect key={i} x="32" y={y} width={320 + (i % 3) * 40 - (i === 6 ? 150 : 0)}
            height="6" rx="2" fill={NAVY} opacity={0.08 + i * 0.01} />
        ))}

        {/* Gold highlight on child's name in story */}
        <rect x="180" y="158" width="26" height="6" rx="2" fill={GOLD} opacity="0.2" />

        {/* Generate button */}
        <rect x="350" y="70" width="110" height="28" rx="6" fill={NAVY} />
        <text x="380" y="88" fontSize="9" fill={GOLD} fontFamily="Inter, sans-serif" fontWeight="600">
          Generate
        </text>
        {/* Sparkle icon approximation */}
        <path d="M370 84 L372 80 L374 84 L370 82 L374 82 Z" fill={GOLD} opacity="0.8" />
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. BOOK EXPLORER MOCKUP — UI preview
// ═══════════════════════════════════════════════════════════════════════════════
export function BookExplorerMockup() {
  const virtueColors = ["#2563EB", "#D97706", "#DC2626", "#059669"];
  const virtueNames = ["Prudence", "Justice", "Courage", "Temperance"];
  const bookTitles = [
    "The Lion, the Witch\nand the Wardrobe",
    "Charlotte's\nWeb",
    "Aesop's\nFables",
    "The Hobbit",
    "Little\nWomen",
    "Pinocchio",
  ];

  return (
    <svg viewBox="0 0 480 270" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8 }}>
      <defs>
        <clipPath id="be-clip"><rect width="480" height="270" rx="8" /></clipPath>
      </defs>
      <g clipPath="url(#be-clip)">
        {/* Window chrome */}
        <rect width="480" height="270" fill={WHITE} rx="8" />
        <rect width="480" height="30" fill={GRAY100} />
        <circle cx="14" cy="15" r="4" fill="#FF5F57" />
        <circle cx="28" cy="15" r="4" fill="#FEBC2E" />
        <circle cx="42" cy="15" r="4" fill="#28C840" />
        <rect x="100" y="8" width="280" height="14" rx="3" fill={WHITE} />
        <text x="130" y="18" fontSize="7" fill={GRAY400} fontFamily="Inter, sans-serif">
          bedtimevirtues.com/books
        </text>

        {/* App header */}
        <rect x="0" y="30" width="480" height="28" fill={NAVY} />
        <text x="20" y="48" fontSize="10" fill={WHITE} fontFamily="Inter, sans-serif" fontWeight="700">
          Book Explorer
        </text>
        <text x="380" y="48" fontSize="8" fill={GOLD} fontFamily="Inter, sans-serif" fontWeight="600">
          57+ Books
        </text>

        {/* Filter bar */}
        <rect x="20" y="68" width="90" height="18" rx="4" fill={GRAY100} />
        <text x="28" y="80" fontSize="7" fill={GRAY500} fontFamily="Inter, sans-serif">All Virtues</text>

        <rect x="118" y="68" width="80" height="18" rx="4" fill={GRAY100} />
        <text x="126" y="80" fontSize="7" fill={GRAY500} fontFamily="Inter, sans-serif">All Ages</text>

        <rect x="206" y="68" width="80" height="18" rx="4" fill={GRAY100} />
        <text x="214" y="80" fontSize="7" fill={GRAY500} fontFamily="Inter, sans-serif">All Levels</text>

        {/* Book grid */}
        {bookTitles.map((title, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 20 + col * 153;
          const y = 98 + row * 88;
          const color = virtueColors[i % 4];
          return (
            <g key={i}>
              <rect x={x} y={y} width="143" height="80" rx="6" fill={WHITE}
                stroke={GRAY200} strokeWidth="1" />
              {/* Book cover accent stripe */}
              <rect x={x} y={y} width="4" height="80" rx="2" fill={color} opacity="0.5" />
              {/* Title */}
              {title.split("\n").map((line, li) => (
                <text key={li} x={x + 14} y={y + 18 + li * 12} fontSize="8" fill={NAVY}
                  fontFamily="Inter, sans-serif" fontWeight="600">
                  {line}
                </text>
              ))}
              {/* Virtue badge */}
              <rect x={x + 14} y={y + 55} width={virtueNames[i % 4].length * 5 + 12}
                height="14" rx="7" fill={color} opacity="0.1" />
              <text x={x + 20} y={y + 64} fontSize="6" fill={color}
                fontFamily="Inter, sans-serif" fontWeight="600">
                {virtueNames[i % 4]}
              </text>
              {/* Age range */}
              <text x={x + 110} y={y + 64} fontSize="6" fill={GRAY400}
                fontFamily="Inter, sans-serif">
                Ages {4 + i}-{8 + i}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7–10. VIRTUE ILLUSTRATIONS — Iconic, minimal
// ═══════════════════════════════════════════════════════════════════════════════

export function PrudenceOwl({ color = "#2563EB", bg = "#EFF6FF" }: { color?: string; bg?: string }) {
  return (
    <Image
      src="/images/prudence-owl.png"
      alt="Wise owl perched on books in a sunlit library, representing prudence"
      width={800}
      height={400}
      style={{ width: "100%", height: "auto", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
    />
  );
}

export function JusticeScales({ color = "#D97706", bg = "#FFFBEB" }: { color?: string; bg?: string }) {
  return (
    <Image
      src="/images/justice-scales.png"
      alt="Golden scales of justice above an open book, bathed in divine light with marble columns"
      width={800}
      height={400}
      style={{ width: "100%", height: "auto", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
    />
  );
}

export function CourageLion({ color = "#DC2626", bg = "#FEF2F2" }: { color?: string; bg?: string }) {
  return (
    <Image
      src="/images/courage-lion.png"
      alt="Majestic lion standing tall against a dramatic sky, representing courage"
      width={800}
      height={400}
      style={{ width: "100%", height: "auto", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
    />
  );
}

export function TemperanceTree({ color = "#059669", bg = "#ECFDF5" }: { color?: string; bg?: string }) {
  return (
    <Image
      src="/images/temperance-tree.png"
      alt="Ancient tree with sun rays filtering through lush green canopy reflected in water, representing temperance"
      width={800}
      height={400}
      style={{ width: "100%", height: "auto", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BONUS: Philosopher Portraits — stylized silhouettes
// ═══════════════════════════════════════════════════════════════════════════════
export function PhilosopherPortrait({ name, quote }: { name: string; quote: string }) {
  // Simple bust silhouette with scroll/name
  const isAristotle = name === "Aristotle";
  const isPlato = name === "Plato";
  const isLewis = name === "C.S. Lewis";
  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto" }}>
      <rect width="160" height="180" fill="none" />

      {/* Bust silhouette */}
      <ellipse cx="80" cy="65" rx="26" ry="30" fill={NAVY} opacity="0.1" />
      {/* Head */}
      <circle cx="80" cy="42" r="22" fill={NAVY} opacity="0.12" />
      {/* Shoulders */}
      <path d="M44 95 Q60 75 80 72 Q100 75 116 95" fill={NAVY} opacity="0.08" />

      {/* Distinguishing features */}
      {isAristotle && (
        <>
          {/* Beard */}
          <path d="M68 52 Q80 68 92 52" fill={NAVY} opacity="0.06" />
          {/* Laurel wreath hint */}
          <path d="M60 35 Q70 28 80 30 Q90 28 100 35" fill="none"
            stroke={GOLD} strokeWidth="1" opacity="0.3" />
        </>
      )}
      {isPlato && (
        <>
          {/* Longer beard */}
          <path d="M70 52 Q80 72 90 52" fill={NAVY} opacity="0.05" />
          {/* High forehead */}
          <path d="M62 32 Q80 24 98 32" fill="none"
            stroke={NAVY} strokeWidth="1" opacity="0.08" />
        </>
      )}
      {isLewis && (
        <>
          {/* Glasses hint */}
          <circle cx="72" cy="40" r="7" fill="none" stroke={NAVY}
            strokeWidth="1" opacity="0.1" />
          <circle cx="88" cy="40" r="7" fill="none" stroke={NAVY}
            strokeWidth="1" opacity="0.1" />
          <line x1="79" y1="40" x2="81" y2="40" stroke={NAVY}
            strokeWidth="0.5" opacity="0.1" />
        </>
      )}

      {/* Name */}
      <text x="80" y="115" textAnchor="middle" fontSize="12" fill={NAVY}
        fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="700" opacity="0.7">
        {name}
      </text>

      {/* Quote */}
      <text x="80" y="135" textAnchor="middle" fontSize="8" fill={GRAY500}
        fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic">
        {quote.length > 45 ? quote.slice(0, 42) + "..." : quote}
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOK CAROUSEL DATA — for the animated carousel component
// ═══════════════════════════════════════════════════════════════════════════════
export const CAROUSEL_BOOKS = [
  { title: "The Lion, the Witch\nand the Wardrobe", author: "C.S. Lewis", color: "#DC2626", virtue: "Courage" },
  { title: "Charlotte's Web", author: "E.B. White", color: "#059669", virtue: "Temperance" },
  { title: "Aesop's Fables", author: "Aesop", color: "#2563EB", virtue: "Prudence" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", color: "#D97706", virtue: "Courage" },
  { title: "Little Women", author: "Louisa May Alcott", color: "#059669", virtue: "Temperance" },
  { title: "Pinocchio", author: "Carlo Collodi", color: "#D97706", virtue: "Justice" },
  { title: "The Secret Garden", author: "F.H. Burnett", color: "#059669", virtue: "Temperance" },
  { title: "Pilgrim's Progress", author: "John Bunyan", color: "#2563EB", virtue: "Prudence" },
  { title: "The Phantom Tollbooth", author: "Norton Juster", color: "#2563EB", virtue: "Prudence" },
  { title: "Anne of Green Gables", author: "L.M. Montgomery", color: "#DC2626", virtue: "Courage" },
  { title: "A Little Princess", author: "F.H. Burnett", color: "#D97706", virtue: "Justice" },
  { title: "The Wind in\nthe Willows", author: "Kenneth Grahame", color: "#059669", virtue: "Temperance" },
];
