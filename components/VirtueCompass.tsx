"use client";
import { useState } from "react";
import { VIRTUES, getSubVirtue } from "@/lib/data";
import { T, VC, btn } from "@/lib/tokens";

export default function VirtueCompass({ selectedVirtues, onToggle }: {
  selectedVirtues: string[]; onToggle: (id: string) => void;
}) {
  const [activeCardinal, setActiveCardinal] = useState<string | null>(null);
  const size = 340;
  const cx = size / 2; const cy = size / 2;
  const outerR = 140; const innerR = 55;

  const quads = [
    { start: Math.PI, end: 1.5 * Math.PI, key: "prudence" },
    { start: 1.5 * Math.PI, end: 2 * Math.PI, key: "justice" },
    { start: 0, end: 0.5 * Math.PI, key: "courage" },
    { start: 0.5 * Math.PI, end: Math.PI, key: "temperance" },
  ];

  const arc = (s: number, e: number, ir: number, or2: number) => {
    const x1 = cx + or2 * Math.cos(s), y1 = cy + or2 * Math.sin(s);
    const x2 = cx + or2 * Math.cos(e), y2 = cy + or2 * Math.sin(e);
    const x3 = cx + ir * Math.cos(e), y3 = cy + ir * Math.sin(e);
    const x4 = cx + ir * Math.cos(s), y4 = cy + ir * Math.sin(s);
    return `M${x1},${y1} A${or2},${or2} 0 0,1 ${x2},${y2} L${x3},${y3} A${ir},${ir} 0 0,0 ${x4},${y4} Z`;
  };

  const midPt = (s: number, e: number, r: number) => {
    const m = (s + e) / 2;
    return { x: cx + r * Math.cos(m), y: cy + r * Math.sin(m) };
  };

  return (
    <div>
      {/* The compass */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 420 }}>
          {/* Center circle */}
          <circle cx={cx} cy={cy} r={innerR} fill={T.navy} />
          <text x={cx} y={cy - 6} textAnchor="middle" fill={T.gold} fontSize="11" fontWeight="700" fontFamily={T.font}>VIRTUE</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill={T.gold} fontSize="11" fontWeight="700" fontFamily={T.font}>FORGE</text>

          {quads.map((q) => {
            const virtue = VIRTUES[q.key];
            const vc = VC[q.key];
            const isActive = activeCardinal === q.key;
            const subCount = virtue.subVirtues.length;
            const selCount = virtue.subVirtues.filter((sv) => selectedVirtues.includes(sv.id)).length;
            const opacity = selCount > 0 ? 0.35 + (selCount / subCount) * 0.55 : 0.15;
            const pos = midPt(q.start, q.end, (outerR + innerR) / 2);

            return (
              <g key={q.key} onClick={() => setActiveCardinal(isActive ? null : q.key)} style={{ cursor: "pointer" }}>
                <path d={arc(q.start, q.end, innerR, outerR)} fill={vc.main} fillOpacity={opacity}
                  stroke={isActive ? vc.main : T.gray200} strokeWidth={isActive ? 3 : 1.5} />
                <text x={pos.x} y={pos.y - 8} textAnchor="middle" fill={T.navy} fontSize="13" fontWeight="700" fontFamily={T.font}>
                  {virtue.icon} {virtue.name}
                </text>
                <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill={T.gray600} fontSize="11" fontFamily={T.font}>
                  {selCount}/{subCount} selected
                </text>
              </g>
            );
          })}

          {/* Outer ring border */}
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={T.gray200} strokeWidth="2" />
        </svg>
      </div>

      <p style={{ textAlign: "center", fontSize: 15, color: T.gray400, marginBottom: 20 }}>
        Click a quadrant above to select specific virtues, or use the panels below.
      </p>

      {/* Detail panels */}
      {Object.entries(VIRTUES).map(([key, virtue]) => {
        const vc = VC[key];
        const isOpen = activeCardinal === key;
        const selCount = virtue.subVirtues.filter((sv) => selectedVirtues.includes(sv.id)).length;

        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <button onClick={() => setActiveCardinal(isOpen ? null : key)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderRadius: isOpen ? "10px 10px 0 0" : 10,
              background: isOpen ? vc.main : T.white, color: isOpen ? T.white : T.navy,
              border: `2px solid ${isOpen ? vc.main : T.gray100}`, cursor: "pointer",
              fontFamily: T.font, fontSize: 17, fontWeight: 700, transition: "all 0.15s",
            }}>
              <span>{virtue.icon} {virtue.name} — {virtue.description}</span>
              <span style={{ fontSize: 14, opacity: 0.8 }}>
                {selCount}/{virtue.subVirtues.length} {isOpen ? "▲" : "▼"}
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: 16, background: vc.light, border: `2px solid ${vc.main}30`,
                borderTop: "none", borderRadius: "0 0 10px 10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {virtue.subVirtues.map((sv) => {
                    const active = selectedVirtues.includes(sv.id);
                    return (
                      <button key={sv.id} onClick={() => onToggle(sv.id)} style={{
                        padding: "14px 16px", borderRadius: 8, textAlign: "left" as const,
                        cursor: "pointer", transition: "all 0.15s",
                        border: active ? `3px solid ${vc.main}` : `2px solid ${T.gray200}`,
                        background: active ? T.white : T.white,
                        boxShadow: active ? `0 0 0 1px ${vc.main}` : "none",
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: active ? vc.main : T.gray800, fontFamily: T.font }}>
                          {active ? "✓ " : ""}{sv.name}
                        </div>
                        <div style={{ fontSize: 13, color: T.gray600, marginTop: 4, lineHeight: 1.4 }}>{sv.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
