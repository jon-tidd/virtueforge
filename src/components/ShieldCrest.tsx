"use client";
import { VIRTUES, type ChildProfile } from "@/lib/data";
import { T, VC, btn } from "@/lib/tokens";

export default function ShieldCrest({ childProfiles, selectedChild, onSelectChild }: {
  childProfiles: ChildProfile[]; selectedChild: number; onSelectChild: (i: number) => void;
}) {
  const child = childProfiles[selectedChild];
  if (!child) return null;

  const quadrants = Object.entries(VIRTUES).map(([key, virtue]) => {
    const total = virtue.subVirtues.length;
    const covered = virtue.subVirtues.filter((sv) => (child.virtueProgress?.[sv.id] || 0) > 0).length;
    const time = virtue.subVirtues.reduce((s, sv) => s + (child.virtueProgress?.[sv.id] || 0), 0);
    return { key, virtue, covered, total, time, pct: total > 0 ? covered / total : 0 };
  });

  const s = 340; const cx = s / 2; const cy = s / 2 + 10;
  const W = 140; const H = 170;
  const sp = `M${cx},${cy - H / 2} Q${cx + W * 0.6},${cy - H / 2} ${cx + W / 2},${cy - H * 0.15} L${cx + W / 2},${cy + H * 0.15} Q${cx + W * 0.35},${cy + H / 2} ${cx},${cy + H / 2 + 15} Q${cx - W * 0.35},${cy + H / 2} ${cx - W / 2},${cy + H * 0.15} L${cx - W / 2},${cy - H * 0.15} Q${cx - W * 0.6},${cy - H / 2} ${cx},${cy - H / 2} Z`;

  const labels = [
    { x: cx - 35, y1: cy - 24, y2: cy - 8, l: "Prudence", ic: "🦉" },
    { x: cx + 35, y1: cy - 24, y2: cy - 8, l: "Justice", ic: "⚖️" },
    { x: cx - 35, y1: cy + 42, y2: cy + 58, l: "Courage", ic: "🦁" },
    { x: cx + 35, y1: cy + 42, y2: cy + 58, l: "Temperance", ic: "🌿" },
  ];

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        {childProfiles.map((c, i) => (
          <button key={i} onClick={() => onSelectChild(i)} style={{
            ...btn(selectedChild === i ? T.navy : T.white, selectedChild === i ? T.gold : T.navy,
              selectedChild === i ? "none" : `2px solid ${T.gray200}`),
            padding: "10px 22px", fontSize: 15,
          }}>
            {c.name}&apos;s Shield
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${s} ${s + 30}`} width="100%" style={{ maxWidth: 400 }}>
        <defs>
          <clipPath id="sc"><path d={sp} /></clipPath>
          <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.gray50} /><stop offset="100%" stopColor={T.gray100} />
          </linearGradient>
        </defs>
        <path d={sp} fill="url(#sbg)" stroke={T.navy} strokeWidth="3" />
        <g clipPath="url(#sc)">
          <rect x={cx - W / 2} y={cy - H / 2} width={W / 2} height={H / 2 + 15}
            fill={VC.prudence.main} opacity={quadrants[0].pct * 0.8 + 0.15} />
          <rect x={cx} y={cy - H / 2} width={W / 2} height={H / 2 + 15}
            fill={VC.justice.main} opacity={quadrants[1].pct * 0.8 + 0.15} />
          <rect x={cx - W / 2} y={cy + 15} width={W / 2} height={H / 2 + 15}
            fill={VC.courage.main} opacity={quadrants[2].pct * 0.8 + 0.15} />
          <rect x={cx} y={cy + 15} width={W / 2} height={H / 2 + 15}
            fill={VC.temperance.main} opacity={quadrants[3].pct * 0.8 + 0.15} />
          <line x1={cx} y1={cy - H / 2} x2={cx} y2={cy + H / 2 + 15} stroke={T.navy} strokeWidth="2" opacity="0.4" />
          <line x1={cx - W / 2} y1={cy + 10} x2={cx + W / 2} y2={cy + 10} stroke={T.navy} strokeWidth="2" opacity="0.4" />
        </g>
        {labels.map((q, i) => (
          <g key={i}>
            <text x={q.x} y={q.y1} textAnchor="middle" fill="#fff" fontSize="14">{q.ic}</text>
            <text x={q.x} y={q.y2} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily={T.font}>{q.l}</text>
          </g>
        ))}
        <path d={sp} fill="none" stroke={T.navy} strokeWidth="4" />
        <rect x={cx - 60} y={cy + H / 2 + 24} width={120} height={24} rx={5} fill={T.navy} />
        <text x={cx} y={cy + H / 2 + 40} textAnchor="middle" fill={T.gold} fontSize="13" fontWeight="700" fontFamily={T.font}>
          {child.name}, Age {child.age}
        </text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 400, margin: "16px auto 0" }}>
        {quadrants.map((q) => {
          const vc = VC[q.key];
          return (
            <div key={q.key} style={{ padding: "12px 14px", borderRadius: 8, background: vc.light,
              border: `2px solid ${vc.main}22`, textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: vc.main, fontFamily: T.font }}>
                {q.virtue.icon} {q.virtue.name}
              </div>
              <div style={{ fontSize: 14, color: T.gray600, marginTop: 3 }}>
                {q.covered}/{q.total} areas · {q.time} min
              </div>
              <div style={{ height: 6, borderRadius: 3, background: T.gray100, marginTop: 6 }}>
                <div style={{ height: 6, borderRadius: 3, background: vc.main,
                  width: `${q.pct * 100}%`, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
