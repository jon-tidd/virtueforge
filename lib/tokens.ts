// ─── BEDTIME VIRTUES DESIGN SYSTEM ───────────────────────────────────────────
// Notion-inspired: clean, bold, generous whitespace, section color-coding

export const T = {
  // Base
  white: "#FFFFFF",
  black: "#111111",
  offWhite: "#FAFBFC",
  bg: "#F8F9FB",

  // Navy (primary brand)
  navy: "#0A1628",
  navyMid: "#142240",
  navyLight: "#1E3258",

  // Gold (accent)
  gold: "#D4A846",
  goldBright: "#F0C94B",
  goldSubtle: "#FBF5E6",

  // Grays (neutral scale)
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Semantic
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",

  // Typography
  fontSans: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSerif: "var(--font-crimson), Georgia, 'Times New Roman', serif",
  fontDisplay: "var(--font-cormorant), Georgia, serif",

  // Effects
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
  radiusXl: 24,
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)",
  shadowLg: "0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)",
  shadowXl: "0 20px 50px rgba(0,0,0,0.12)",
} as const;

// Virtue color system — each virtue gets its own section color
export const VC = {
  prudence: { main: "#2563EB", light: "#EFF6FF", subtle: "#DBEAFE", dark: "#1D4ED8" },
  justice: { main: "#D97706", light: "#FFFBEB", subtle: "#FEF3C7", dark: "#B45309" },
  courage: { main: "#DC2626", light: "#FEF2F2", subtle: "#FEE2E2", dark: "#B91C1C" },
  temperance: { main: "#059669", light: "#ECFDF5", subtle: "#D1FAE5", dark: "#047857" },
} as const;

// Plan tier definitions
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    stories: 3,
    children: 1,
    features: [
      "1 child profile",
      "Browse full book catalog",
      "3 AI stories per month",
      "Basic virtue tracking",
      "Amazon & free book links",
    ],
  },
  premium: {
    name: "Premium",
    monthlyPrice: 9,
    yearlyPrice: 69,
    stories: -1, // unlimited
    children: -1, // unlimited
    features: [
      "Unlimited child profiles",
      "Browse full book catalog",
      "Unlimited AI stories",
      "Advanced shield analytics",
      "Printable story PDFs",
      "Discussion guides per book",
      "Personalized reading plans",
      "Priority story generation",
    ],
  },
} as const;
