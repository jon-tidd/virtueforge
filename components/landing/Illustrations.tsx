"use client";
// ─── SVG Illustrations for VirtueForge Landing Page ──────────────────────────
// Geometric/minimal style using navy (#0A1628) + gold (#D4A846) palette

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
    <svg viewBox="0 0 700 300" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 300, borderRadius: 12 }}>
      {/* Background gradient - warm night sky */}
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="100%" stopColor={NAVY_MID} />
        </linearGradient>
        <radialGradient id="hero-glow" cx="350" cy="200" r="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.25" />
          <stop offset="60%" stopColor={GOLD} stopOpacity="0.05" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="book-glow" cx="350" cy="210" r="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity="0.5" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="700" height="300" fill="url(#hero-sky)" />
      <rect width="700" height="300" fill="url(#hero-glow)" />

      {/* Stars */}
      {[
        [80, 40], [150, 25], [230, 55], [420, 30], [530, 50], [610, 35],
        [60, 80], [190, 90], [480, 75], [580, 95], [320, 20], [670, 60],
        [100, 120], [550, 110], [380, 45], [640, 85],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2 : 1.2}
          fill={WHITE} opacity={0.3 + (i % 4) * 0.15} />
      ))}

      {/* Moon */}
      <circle cx="600" cy="60" r="25" fill={GOLD_SUBTLE} opacity="0.2" />
      <circle cx="610" cy="55" r="22" fill={NAVY} />

      {/* Ground / cozy surface */}
      <ellipse cx="350" cy="280" rx="250" ry="30" fill={NAVY_LIGHT} opacity="0.5" />

      {/* Parent silhouette - sitting, reading */}
      <path d="M300 280 L300 200 Q300 180 310 170 L320 160 Q330 150 330 140 Q330 125 320 120 Q310 115 305 120 Q295 128 300 140 L290 155 Q280 165 280 180 L275 200 Q270 220 270 240 L260 270 Q258 278 265 280 Z"
        fill={NAVY_MID} />
      {/* Parent head */}
      <circle cx="315" cy="128" r="18" fill={NAVY_MID} />
      {/* Parent arm reaching to hold book */}
      <path d="M310 170 Q330 185 345 195 L350 198" stroke={NAVY_MID} strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Child silhouette - smaller, leaning against parent */}
      <path d="M340 280 L340 230 Q340 215 345 205 L350 198 Q355 190 355 185 Q355 175 348 172 Q340 170 337 175 Q335 180 338 185 L335 195 Q330 205 332 220 L330 250 Q328 265 335 275 Z"
        fill={NAVY_MID} />
      {/* Child head */}
      <circle cx="348" cy="176" r="14" fill={NAVY_MID} />

      {/* Open book - glowing */}
      <rect width="700" height="300" fill="url(#book-glow)" />
      <path d="M330 210 L350 205 L370 210 L370 235 L350 230 L330 235 Z"
        fill={GOLD_SUBTLE} stroke={GOLD} strokeWidth="1" />
      {/* Book spine */}
      <line x1="350" y1="205" x2="350" y2="230" stroke={GOLD} strokeWidth="0.5" />
      {/* Text lines on book pages */}
      <line x1="335" y1="215" x2="347" y2="212" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />
      <line x1="336" y1="220" x2="348" y2="217" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />
      <line x1="353" y1="212" x2="365" y2="215" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />
      <line x1="353" y1="217" x2="366" y2="220" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />

      {/* Sparkles rising from book */}
      {[
        [340, 190, 3], [360, 185, 2], [345, 175, 2.5], [355, 168, 1.8],
        [335, 170, 1.5], [365, 175, 2], [350, 160, 3], [342, 155, 1.5],
        [358, 148, 2], [350, 140, 1.8],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={GOLD_BRIGHT} opacity={0.2 + (i * 0.06)} />
      ))}

      {/* Floating story elements - small icons representing imagination */}
      {/* Shield */}
      <path d="M390 130 L395 127 L400 130 L400 138 Q395 142 390 138 Z"
        fill="none" stroke={GOLD} strokeWidth="1" opacity="0.4" />
      {/* Star */}
      <path d="M300 140 L302 134 L305 140 L298 136 L307 136 Z"
        fill={GOLD} opacity="0.3" />
      {/* Heart */}
      <path d="M410 155 Q412 150 416 152 Q420 155 416 160 L410 165 L404 160 Q400 155 404 152 Q408 150 410 155 Z"
        fill={GOLD} opacity="0.3" />

      {/* Fireplace glow at bottom */}
      <ellipse cx="350" cy="275" rx="80" ry="8" fill={GOLD} opacity="0.08" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SCREEN TIME vs READING — Split comparison (for dark bg section)
// ═══════════════════════════════════════════════════════════════════════════════
export function ScreenTimeIllustration() {
  return (
    <svg viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 240, borderRadius: 12 }}>
      <defs>
        <linearGradient id="screen-bad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
        <linearGradient id="book-good" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIGHT} />
          <stop offset="100%" stopColor={NAVY_MID} />
        </linearGradient>
      </defs>

      {/* Left half — Screen time (cold, fragmented) */}
      <rect x="0" y="0" width="290" height="240" fill="url(#screen-bad)" rx="12" />

      {/* Phone shape */}
      <rect x="105" y="50" width="80" height="130" rx="8" fill="none"
        stroke={GRAY400} strokeWidth="1.5" opacity="0.5" />
      {/* Screen glare lines */}
      <rect x="115" y="65" width="60" height="4" rx="2" fill="#4a5568" opacity="0.4" />
      <rect x="115" y="75" width="45" height="4" rx="2" fill="#4a5568" opacity="0.3" />
      <rect x="115" y="85" width="55" height="4" rx="2" fill="#4a5568" opacity="0.35" />
      <rect x="115" y="100" width="60" height="35" rx="3" fill="#2d3748" opacity="0.4" />
      <rect x="115" y="140" width="35" height="4" rx="2" fill="#4a5568" opacity="0.3" />
      <rect x="115" y="150" width="50" height="4" rx="2" fill="#4a5568" opacity="0.25" />
      {/* Notification bubbles - distracting */}
      <circle cx="190" cy="55" r="6" fill="#E53E3E" opacity="0.6" />
      <text x="190" y="58" textAnchor="middle" fontSize="7" fill={WHITE} fontWeight="bold">3</text>
      <circle cx="100" cy="90" r="5" fill="#E53E3E" opacity="0.5" />
      {/* Scattered fragments representing algorithmic noise */}
      <rect x="30" y="70" width="50" height="30" rx="4" fill="#2d3748" opacity="0.3"
        transform="rotate(-8 55 85)" />
      <rect x="200" y="80" width="45" height="25" rx="4" fill="#2d3748" opacity="0.25"
        transform="rotate(5 222 92)" />
      <rect x="40" y="130" width="40" height="20" rx="3" fill="#2d3748" opacity="0.2"
        transform="rotate(-3 60 140)" />
      <rect x="210" y="140" width="50" height="22" rx="3" fill="#2d3748" opacity="0.2"
        transform="rotate(7 235 151)" />

      {/* Clock icon - wasted time */}
      <circle cx="145" cy="200" r="12" fill="none" stroke={GRAY400} strokeWidth="1" opacity="0.4" />
      <line x1="145" y1="193" x2="145" y2="200" stroke={GRAY400} strokeWidth="1" opacity="0.4" />
      <line x1="145" y1="200" x2="150" y2="203" stroke={GRAY400} strokeWidth="1" opacity="0.4" />
      <text x="145" y="225" textAnchor="middle" fontSize="10" fill={GRAY400} opacity="0.5"
        fontFamily="Inter, sans-serif">7+ hrs/day</text>

      {/* Diagonal divider */}
      <path d="M280 0 L310 0 L310 240 L280 240 Z" fill={NAVY} />
      <text x="295" y="125" textAnchor="middle" fontSize="14" fill={GOLD}
        fontFamily="Inter, sans-serif" fontWeight="700">vs</text>

      {/* Right half — Reading time (warm, structured, growing) */}
      <rect x="310" y="0" width="290" height="240" fill="url(#book-good)" rx="12" />

      {/* Open book - larger, central */}
      <path d="M410 60 L455 50 L500 60 L500 140 L455 130 L410 140 Z"
        fill={GOLD_SUBTLE} fillOpacity="0.15" stroke={GOLD} strokeWidth="1.5" opacity="0.7" />
      <line x1="455" y1="50" x2="455" y2="130" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />
      {/* Text lines */}
      {[65, 75, 85, 95, 105, 115].map((y, i) => (
        <g key={i}>
          <line x1="420" y1={y} x2={440 + (i % 2) * 10} y2={y - 3}
            stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
          <line x1="460" y1={y - 3} x2={480 + (i % 2) * 10} y2={y}
            stroke={GOLD} strokeWidth="0.5" opacity="0.3" />
        </g>
      ))}

      {/* Golden light rays from book */}
      {[0, 30, 60, 90, 120, 150, 180].map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x2 = 455 + Math.cos(rad) * 80;
        const y2 = 90 + Math.sin(rad) * 60;
        return (
          <line key={i} x1="455" y1="90" x2={x2} y2={y2}
            stroke={GOLD} strokeWidth="0.5" opacity={0.1 + i * 0.02} />
        );
      })}

      {/* Growing tree/roots from book - virtue growth */}
      <path d="M455 50 L455 35 Q455 25 460 20 Q465 15 460 10"
        fill="none" stroke={GOLD} strokeWidth="1.5" opacity="0.5" />
      <path d="M455 35 Q448 28 445 20" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.4" />
      <path d="M455 30 Q462 22 468 18" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.4" />
      {/* Leaves */}
      <ellipse cx="460" cy="8" rx="5" ry="3" fill={GOLD} opacity="0.3" transform="rotate(-20 460 8)" />
      <ellipse cx="443" cy="18" rx="4" ry="2.5" fill={GOLD} opacity="0.25" transform="rotate(15 443 18)" />
      <ellipse cx="470" cy="16" rx="4" ry="2.5" fill={GOLD} opacity="0.25" transform="rotate(-30 470 16)" />

      {/* Heart / roots going down */}
      <path d="M455 140 L455 155 Q450 165 440 170 Q448 162 455 155 Q462 162 470 170 Q460 165 455 155"
        fill={GOLD} opacity="0.2" />

      {/* Connection / family */}
      <circle cx="430" cy="180" r="10" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.4" />
      <circle cx="455" cy="175" r="13" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.5" />
      <circle cx="480" cy="180" r="8" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.35" />

      <text x="455" y="215" textAnchor="middle" fontSize="10" fill={GOLD} opacity="0.6"
        fontFamily="Inter, sans-serif">Character. Connection. Growth.</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CHARACTER CYCLE — Circular formation diagram
// ═══════════════════════════════════════════════════════════════════════════════
export function CharacterCycleDiagram() {
  const cx = 200, cy = 150, r = 100;
  const steps = [
    { label: "Stories", angle: -90 },
    { label: "Imagination", angle: -18 },
    { label: "Habituation", angle: 54 },
    { label: "Virtue", angle: 126 },
    { label: "Flourishing", angle: 198 },
  ];

  const points = steps.map((s) => {
    const rad = (s.angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), label: s.label };
  });

  // Draw arrow arcs between consecutive points
  function arcArrow(i: number) {
    const from = points[i];
    const to = points[(i + 1) % points.length];
    const midAngle = ((steps[i].angle + steps[(i + 1) % steps.length].angle) / 2 +
      (steps[(i + 1) % steps.length].angle < steps[i].angle ? 180 : 0)) * Math.PI / 180;
    const bulge = 0.3;
    const mx = cx + r * (1 + bulge) * Math.cos(midAngle);
    const my = cy + r * (1 + bulge) * Math.sin(midAngle);
    return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  }

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 280, borderRadius: 12 }}>
      <defs>
        <marker id="cycle-arrow" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0 0 L8 3 L0 6 Z" fill={GOLD} opacity="0.6" />
        </marker>
      </defs>

      {/* Background */}
      <rect width="400" height="300" fill={GOLD_SUBTLE} rx="12" opacity="0.3" />

      {/* Concentric guide circles */}
      <circle cx={cx} cy={cy} r={r + 30} fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.1" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.15" strokeDasharray="4 4" />

      {/* Arrow arcs connecting steps */}
      {steps.map((_, i) => (
        <path key={i} d={arcArrow(i)} fill="none" stroke={GOLD} strokeWidth="1.5"
          opacity="0.35" markerEnd="url(#cycle-arrow)" />
      ))}

      {/* Step nodes */}
      {points.map((p, i) => (
        <g key={i}>
          {/* Node circle */}
          <circle cx={p.x} cy={p.y} r="22" fill={WHITE} stroke={GOLD} strokeWidth="1.5" />
          {/* Step number */}
          <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="central"
            fontSize="14" fill={NAVY} fontFamily="Inter, sans-serif" fontWeight="800">
            {i + 1}
          </text>
          {/* Label */}
          <text x={p.x} y={p.y + (p.y < cy ? -30 : 34)} textAnchor="middle"
            fontSize="11" fill={NAVY} fontFamily="Inter, sans-serif" fontWeight="600"
            opacity="0.8">
            {p.label}
          </text>
        </g>
      ))}

      {/* Center emblem */}
      <circle cx={cx} cy={cy} r="24" fill={NAVY} opacity="0.05" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill={NAVY}
        fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.5">
        HEXIS
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill={GRAY500}
        fontFamily="Inter, sans-serif">
        Character Formation
      </text>
    </svg>
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
          virtueforge.vercel.app/stories
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
          virtueforge.vercel.app/books
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
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 120 }}>
      <rect width="200" height="120" fill={bg} rx="8" opacity="0.5" />

      {/* Scroll base */}
      <rect x="55" y="85" width="90" height="8" rx="4" fill={color} opacity="0.15" />
      <ellipse cx="55" cy="89" rx="5" ry="4" fill={color} opacity="0.2" />
      <ellipse cx="145" cy="89" rx="5" ry="4" fill={color} opacity="0.2" />
      {/* Scroll text lines */}
      <line x1="70" y1="88" x2="95" y2="88" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <line x1="100" y1="88" x2="130" y2="88" stroke={color} strokeWidth="0.5" opacity="0.2" />

      {/* Owl body */}
      <ellipse cx="100" cy="65" rx="22" ry="26" fill={color} opacity="0.12" />
      {/* Owl face disc */}
      <ellipse cx="100" cy="55" rx="18" ry="16" fill={WHITE} stroke={color}
        strokeWidth="1" opacity="0.5" />
      {/* Eyes */}
      <circle cx="92" cy="52" r="6" fill={WHITE} stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="108" cy="52" r="6" fill={WHITE} stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="93" cy="52" r="2.5" fill={color} opacity="0.6" />
      <circle cx="109" cy="52" r="2.5" fill={color} opacity="0.6" />
      {/* Beak */}
      <path d="M98 58 L100 63 L102 58" fill={color} opacity="0.3" />
      {/* Ear tufts */}
      <path d="M85 42 L88 35 L92 42" fill={color} opacity="0.2" />
      <path d="M108 42 L112 35 L115 42" fill={color} opacity="0.2" />
      {/* Wing markings */}
      <path d="M78 60 Q75 70 80 80" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
      <path d="M122 60 Q125 70 120 80" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />

      {/* Stars of wisdom */}
      <circle cx="68" cy="30" r="1.5" fill={color} opacity="0.3" />
      <circle cx="135" cy="35" r="1" fill={color} opacity="0.25" />
      <circle cx="75" cy="20" r="1" fill={color} opacity="0.2" />
    </svg>
  );
}

export function JusticeScales({ color = "#D97706", bg = "#FFFBEB" }: { color?: string; bg?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 120 }}>
      <rect width="200" height="120" fill={bg} rx="8" opacity="0.5" />

      {/* Central pillar */}
      <rect x="97" y="25" width="6" height="70" rx="3" fill={color} opacity="0.2" />

      {/* Top ornament */}
      <circle cx="100" cy="22" r="5" fill={color} opacity="0.25" />

      {/* Balance beam */}
      <line x1="45" y1="40" x2="155" y2="40" stroke={color} strokeWidth="2.5" opacity="0.35" />

      {/* Left pan */}
      <line x1="55" y1="40" x2="45" y2="65" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="55" y1="40" x2="65" y2="65" stroke={color} strokeWidth="1" opacity="0.25" />
      <path d="M40 65 Q55 72 70 65" fill={color} opacity="0.12" stroke={color}
        strokeWidth="1" />
      {/* Items in left pan */}
      <circle cx="50" cy="62" r="3" fill={color} opacity="0.2" />
      <circle cx="58" cy="61" r="2.5" fill={color} opacity="0.15" />

      {/* Right pan */}
      <line x1="145" y1="40" x2="135" y2="65" stroke={color} strokeWidth="1" opacity="0.25" />
      <line x1="145" y1="40" x2="155" y2="65" stroke={color} strokeWidth="1" opacity="0.25" />
      <path d="M130 65 Q145 72 160 65" fill={color} opacity="0.12" stroke={color}
        strokeWidth="1" />
      {/* Items in right pan */}
      <circle cx="142" cy="62" r="3" fill={color} opacity="0.2" />
      <circle cx="150" cy="61" r="2.5" fill={color} opacity="0.15" />

      {/* Golden rays from center */}
      {[-60, -30, 0, 30, 60].map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        return (
          <line key={i} x1="100" y1="22" x2={100 + Math.cos(rad) * 20} y2={22 + Math.sin(rad) * 20}
            stroke={color} strokeWidth="0.8" opacity="0.15" />
        );
      })}

      {/* Base pedestal */}
      <rect x="85" y="92" width="30" height="5" rx="2" fill={color} opacity="0.15" />
      <rect x="80" y="95" width="40" height="4" rx="2" fill={color} opacity="0.1" />
    </svg>
  );
}

export function CourageLion({ color = "#DC2626", bg = "#FEF2F2" }: { color?: string; bg?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 120 }}>
      <rect width="200" height="120" fill={bg} rx="8" opacity="0.5" />

      {/* Mane - rays going outward */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i * 22.5 - 90) * Math.PI / 180;
        const inner = 28;
        const outer = 38 + (i % 2) * 6;
        return (
          <line key={i}
            x1={100 + Math.cos(angle) * inner} y1={52 + Math.sin(angle) * inner}
            x2={100 + Math.cos(angle) * outer} y2={52 + Math.sin(angle) * outer}
            stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={0.15 + (i % 3) * 0.05}
          />
        );
      })}

      {/* Mane circle */}
      <circle cx="100" cy="52" r="30" fill={color} opacity="0.08" />

      {/* Head */}
      <ellipse cx="100" cy="52" rx="20" ry="22" fill={color} opacity="0.12" />

      {/* Face features */}
      {/* Eyes - determined */}
      <ellipse cx="92" cy="46" rx="3" ry="2.5" fill={color} opacity="0.35" />
      <ellipse cx="108" cy="46" rx="3" ry="2.5" fill={color} opacity="0.35" />
      {/* Eye glint */}
      <circle cx="93" cy="45" r="1" fill={WHITE} opacity="0.5" />
      <circle cx="109" cy="45" r="1" fill={WHITE} opacity="0.5" />

      {/* Nose */}
      <path d="M97 54 L100 58 L103 54 Z" fill={color} opacity="0.25" />

      {/* Mouth - brave expression */}
      <path d="M94 61 Q100 65 106 61" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />

      {/* Ears */}
      <ellipse cx="82" cy="38" rx="5" ry="7" fill={color} opacity="0.1" />
      <ellipse cx="118" cy="38" rx="5" ry="7" fill={color} opacity="0.1" />

      {/* Storm elements behind */}
      <path d="M35 30 L40 20 L43 28 L48 15 L50 28" fill="none" stroke={color}
        strokeWidth="1" opacity="0.15" />
      <path d="M155 25 L158 18 L162 26 L165 12" fill="none" stroke={color}
        strokeWidth="1" opacity="0.12" />
      {/* Wind lines */}
      <line x1="30" y1="70" x2="55" y2="68" stroke={color} strokeWidth="0.8" opacity="0.1" />
      <line x1="145" y1="72" x2="170" y2="70" stroke={color} strokeWidth="0.8" opacity="0.1" />
      <line x1="35" y1="80" x2="50" y2="79" stroke={color} strokeWidth="0.5" opacity="0.08" />

      {/* Ground line */}
      <path d="M50 100 Q100 95 150 100" fill="none" stroke={color} strokeWidth="1" opacity="0.1" />
    </svg>
  );
}

export function TemperanceTree({ color = "#059669", bg = "#ECFDF5" }: { color?: string; bg?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxHeight: 120 }}>
      <rect width="200" height="120" fill={bg} rx="8" opacity="0.5" />

      {/* Water line */}
      <line x1="40" y1="75" x2="160" y2="75" stroke={color} strokeWidth="0.5" opacity="0.2" />

      {/* Tree trunk */}
      <rect x="96" y="35" width="8" height="40" rx="2" fill={color} opacity="0.25" />

      {/* Branches */}
      <path d="M100 45 Q85 35 75 30" fill="none" stroke={color} strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <path d="M100 45 Q115 35 125 30" fill="none" stroke={color} strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <path d="M100 38 Q80 25 70 20" fill="none" stroke={color} strokeWidth="1.5" opacity="0.18" strokeLinecap="round" />
      <path d="M100 38 Q120 25 130 20" fill="none" stroke={color} strokeWidth="1.5" opacity="0.18" strokeLinecap="round" />
      <path d="M100 32 Q90 22 85 15" fill="none" stroke={color} strokeWidth="1" opacity="0.15" strokeLinecap="round" />
      <path d="M100 32 Q110 22 115 15" fill="none" stroke={color} strokeWidth="1" opacity="0.15" strokeLinecap="round" />

      {/* Canopy - layered circles */}
      <circle cx="100" cy="25" r="22" fill={color} opacity="0.08" />
      <circle cx="82" cy="30" r="15" fill={color} opacity="0.06" />
      <circle cx="118" cy="30" r="15" fill={color} opacity="0.06" />
      <circle cx="75" cy="28" r="10" fill={color} opacity="0.05" />
      <circle cx="125" cy="28" r="10" fill={color} opacity="0.05" />

      {/* Leaves */}
      {[
        [70, 22, -20], [80, 15, 10], [90, 12, -15], [100, 10, 5],
        [110, 12, 15], [120, 15, -10], [130, 22, 20],
      ].map(([cx, cy, rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="5" ry="2.5" fill={color} opacity="0.15"
          transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}

      {/* Roots going down - visible below ground */}
      <path d="M100 75 Q95 85 85 95 Q80 100 75 100" fill="none" stroke={color}
        strokeWidth="2" opacity="0.15" strokeLinecap="round" />
      <path d="M100 75 Q105 85 115 95 Q120 100 125 100" fill="none" stroke={color}
        strokeWidth="2" opacity="0.15" strokeLinecap="round" />
      <path d="M100 75 Q97 90 90 100 Q88 105 85 108" fill="none" stroke={color}
        strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
      <path d="M100 75 Q103 90 110 100 Q112 105 115 108" fill="none" stroke={color}
        strokeWidth="1.5" opacity="0.12" strokeLinecap="round" />
      {/* Center root */}
      <path d="M100 75 L100 108" fill="none" stroke={color} strokeWidth="1.5" opacity="0.1" />

      {/* Water reflection - mirrored tree hint */}
      <ellipse cx="100" cy="85" rx="20" ry="8" fill={color} opacity="0.04" />

      {/* Subtle ripples */}
      <ellipse cx="80" cy="78" rx="8" ry="1.5" fill="none" stroke={color}
        strokeWidth="0.5" opacity="0.1" />
      <ellipse cx="120" cy="80" rx="6" ry="1" fill="none" stroke={color}
        strokeWidth="0.5" opacity="0.08" />
    </svg>
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
