export const T = {
  navy: "#0A1628",
  navyMid: "#142240",
  navyLight: "#1E3258",
  gold: "#D4A846",
  goldBright: "#F0C94B",
  white: "#FFFFFF",
  offWhite: "#F7F8FA",
  gray50: "#F2F4F7",
  gray100: "#E4E7EC",
  gray200: "#C8CED9",
  gray400: "#8892A4",
  gray600: "#4A5468",
  gray800: "#1D2939",
  green: "#1B7A4E",
  greenLight: "#EEFBF4",
  red: "#C4432B",
  font: "'Georgia', 'Times New Roman', serif",
  radius: 10,
  shadow: "0 2px 12px rgba(10,22,40,0.08)",
  shadowLg: "0 8px 30px rgba(10,22,40,0.12)",
};

export const VC: Record<string, { main: string; light: string }> = {
  prudence: { main: "#2563EB", light: "#EFF6FF" },
  justice: { main: "#B45309", light: "#FFFBEB" },
  courage: { main: "#C4432B", light: "#FEF2F2" },
  temperance: { main: "#0F766E", light: "#F0FDFA" },
};

export const btn = (bg: string, color: string, border?: string): React.CSSProperties => ({
  padding: "12px 28px", borderRadius: 8, background: bg, color,
  border: border || "none", cursor: "pointer", fontSize: 16,
  fontWeight: 700, fontFamily: T.font, transition: "all 0.15s",
});

export const card: React.CSSProperties = {
  padding: 28, borderRadius: T.radius, background: T.white,
  border: `1px solid ${T.gray100}`, marginBottom: 20, boxShadow: T.shadow,
};

export const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 8,
  border: `2px solid ${T.gray100}`, fontSize: 16, fontFamily: T.font,
  color: T.gray800, boxSizing: "border-box" as const, background: T.white,
};
