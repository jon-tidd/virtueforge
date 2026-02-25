"use client";
import { motion } from "framer-motion";
import { Brain, Heart, Flame, TreePine, Plus, Trophy, AlertCircle } from "lucide-react";
import { VIRTUES, getSubVirtue, getVirtueParent, type AppData } from "@/lib/data";
import { T, VC } from "@/lib/tokens";

const VIRTUE_ICONS: Record<string, typeof Brain> = {
  prudence: Brain, justice: Heart, courage: Flame, temperance: TreePine,
};

export default function ShieldTracker({ appData, selChild, setSelChild, onLogTime }: {
  appData: AppData;
  selChild: number;
  setSelChild: (i: number) => void;
  onLogTime: (ci: number, vid: string, min: number) => void;
}) {
  const child = appData.children[selChild];
  const hasChildren = appData.children.length > 0;

  if (!hasChildren) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: 40, borderRadius: T.radius, background: T.white, border: `1px solid ${T.gray100}`, textAlign: "center" }}
      >
        <p style={{ fontFamily: T.fontSans, fontSize: 15, color: T.gray500 }}>
          Add your children first to track virtue progress.
        </p>
      </motion.div>
    );
  }

  const quadrants = Object.entries(VIRTUES).map(([key, virtue]) => {
    const total = virtue.subVirtues.length;
    const covered = virtue.subVirtues.filter((sv) => (child?.virtueProgress?.[sv.id] || 0) > 0).length;
    const time = virtue.subVirtues.reduce((s, sv) => s + (child?.virtueProgress?.[sv.id] || 0), 0);
    return { key, virtue, covered, total, time, pct: total > 0 ? covered / total : 0 };
  });

  const overallPct = Math.round(quadrants.reduce((s, q) => s + q.pct, 0) / 4 * 100);
  const totalTime = quadrants.reduce((s, q) => s + q.time, 0);
  const gaps = Object.values(VIRTUES).flatMap((v) => v.subVirtues).filter((sv) => !(child?.virtueProgress?.[sv.id]));

  // Shield SVG dimensions
  const s = 300;
  const cx = s / 2;
  const cy = s / 2 + 10;
  const W = 120;
  const H = 150;
  const sp = `M${cx},${cy - H / 2} Q${cx + W * 0.6},${cy - H / 2} ${cx + W / 2},${cy - H * 0.15} L${cx + W / 2},${cy + H * 0.15} Q${cx + W * 0.35},${cy + H / 2} ${cx},${cy + H / 2 + 15} Q${cx - W * 0.35},${cy + H / 2} ${cx - W / 2},${cy + H * 0.15} L${cx - W / 2},${cy - H * 0.15} Q${cx - W * 0.6},${cy - H / 2} ${cx},${cy - H / 2} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: T.fontSans, fontSize: 28, fontWeight: 700,
          color: T.navy, marginBottom: 6,
        }}>
          The Virtue Shield
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          Track your children&apos;s character growth across the four cardinal virtues.
        </p>
      </div>

      {/* Child selector */}
      {appData.children.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {appData.children.map((c, i) => (
            <button key={i} onClick={() => setSelChild(i)} style={{
              padding: "6px 16px", borderRadius: 100,
              background: selChild === i ? T.navy : T.white,
              color: selChild === i ? T.white : T.gray600,
              border: selChild === i ? "none" : `1px solid ${T.gray200}`,
              cursor: "pointer", fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
            }}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Shield + Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr", gap: 32,
        padding: 32, borderRadius: T.radiusLg, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 20,
      }}>
        {/* Shield SVG */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg viewBox={`0 0 ${s} ${s + 20}`} width={260}>
            <defs>
              <clipPath id="sc"><path d={sp} /></clipPath>
              <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.gray50} /><stop offset="100%" stopColor={T.gray100} />
              </linearGradient>
            </defs>
            <path d={sp} fill="url(#sbg)" stroke={T.gray200} strokeWidth="2" />
            <g clipPath="url(#sc)">
              <rect x={cx - W / 2} y={cy - H / 2} width={W / 2} height={H / 2 + 15}
                fill={VC.prudence.main} opacity={quadrants[0].pct * 0.75 + 0.1} />
              <rect x={cx} y={cy - H / 2} width={W / 2} height={H / 2 + 15}
                fill={VC.justice.main} opacity={quadrants[1].pct * 0.75 + 0.1} />
              <rect x={cx - W / 2} y={cy + 15} width={W / 2} height={H / 2 + 15}
                fill={VC.courage.main} opacity={quadrants[2].pct * 0.75 + 0.1} />
              <rect x={cx} y={cy + 15} width={W / 2} height={H / 2 + 15}
                fill={VC.temperance.main} opacity={quadrants[3].pct * 0.75 + 0.1} />
              <line x1={cx} y1={cy - H / 2} x2={cx} y2={cy + H / 2 + 15} stroke={T.white} strokeWidth="2" opacity="0.5" />
              <line x1={cx - W / 2} y1={cy + 10} x2={cx + W / 2} y2={cy + 10} stroke={T.white} strokeWidth="2" opacity="0.5" />
            </g>
            {/* Labels */}
            {[
              { x: cx - 30, y: cy - 10, name: "Prudence", Icon: Brain, q: quadrants[0] },
              { x: cx + 30, y: cy - 10, name: "Justice", Icon: Heart, q: quadrants[1] },
              { x: cx - 30, y: cy + 40, name: "Courage", Icon: Flame, q: quadrants[2] },
              { x: cx + 30, y: cy + 40, name: "Temperance", Icon: TreePine, q: quadrants[3] },
            ].map((item, i) => (
              <g key={i}>
                <text x={item.x} y={item.y} textAnchor="middle" fill="#fff" fontSize="10"
                  fontWeight="600" fontFamily="Inter, sans-serif">{item.name}</text>
                <text x={item.x} y={item.y + 14} textAnchor="middle" fill="#fff" fontSize="9"
                  opacity="0.8" fontFamily="Inter, sans-serif">{item.q.covered}/{item.q.total}</text>
              </g>
            ))}
            <path d={sp} fill="none" stroke={T.navy} strokeWidth="3" />
            {/* Name plate */}
            <rect x={cx - 55} y={cy + H / 2 + 20} width={110} height={22} rx={4} fill={T.navy} />
            <text x={cx} y={cy + H / 2 + 35} textAnchor="middle" fill={T.gold} fontSize="11"
              fontWeight="700" fontFamily="Inter, sans-serif">
              {child?.name}
            </text>
          </svg>
          <div style={{
            fontFamily: T.fontSans, fontSize: 32, fontWeight: 800,
            color: T.navy, marginTop: 16,
          }}>
            {overallPct}%
          </div>
          <div style={{
            fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
          }}>
            overall coverage
          </div>
        </div>

        {/* Virtue breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {quadrants.map((q) => {
            const vc = VC[q.key as keyof typeof VC];
            const Icon = VIRTUE_ICONS[q.key];
            return (
              <div key={q.key} style={{
                padding: 16, borderRadius: T.radius,
                background: T.gray50, border: `1px solid ${T.gray100}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={18} color={vc.main} strokeWidth={2} />
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 15, fontWeight: 600, color: vc.main,
                    }}>{q.virtue.name}</span>
                  </div>
                  <span style={{
                    fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
                  }}>
                    {q.covered}/{q.total} · {q.time} min
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.gray200 }}>
                  <div style={{
                    height: 6, borderRadius: 3, background: vc.main,
                    width: `${q.pct * 100}%`, transition: "width 0.5s ease",
                  }} />
                </div>
                {/* Sub-virtue dots */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {q.virtue.subVirtues.map((sv) => {
                    const logged = child?.virtueProgress?.[sv.id] || 0;
                    return (
                      <span key={sv.id} style={{
                        fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
                        padding: "3px 8px", borderRadius: 100,
                        background: logged > 0 ? vc.main + "15" : T.gray100,
                        color: logged > 0 ? vc.main : T.gray400,
                        border: `1px solid ${logged > 0 ? vc.main + "30" : T.gray200}`,
                      }}>
                        {sv.name} {logged > 0 && `(${logged}m)`}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaps */}
      {gaps.length > 0 && gaps.length < 16 && (
        <div style={{
          padding: 24, borderRadius: T.radius, background: T.white,
          border: `1px solid ${T.gray100}`, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertCircle size={18} color={T.gold} />
            <h3 style={{
              fontFamily: T.fontSans, fontSize: 16, fontWeight: 600, color: T.navy,
            }}>
              Virtue Gaps for {child?.name}
            </h3>
          </div>
          <p style={{
            fontFamily: T.fontSans, fontSize: 13, color: T.gray500, marginBottom: 14,
          }}>
            These virtues haven&apos;t been covered yet. Look for books or stories that teach them.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {gaps.map((sv) => {
              const pk = getVirtueParent(sv.id);
              const vc = pk ? VC[pk as keyof typeof VC] : { main: T.gray500 };
              return (
                <span key={sv.id} style={{
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                  padding: "4px 10px", borderRadius: 100,
                  background: T.gray50, color: vc.main,
                  border: `1px dashed ${vc.main}40`,
                }}>
                  {sv.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {gaps.length === 0 && (
        <div style={{
          padding: 32, borderRadius: T.radius, background: T.greenLight,
          border: `1px solid ${T.green}20`, textAlign: "center",
          marginBottom: 20,
        }}>
          <Trophy size={32} color={T.green} style={{ marginBottom: 8 }} />
          <div style={{
            fontFamily: T.fontSans, fontSize: 18, fontWeight: 700, color: T.green,
          }}>
            {child?.name}&apos;s shield is complete!
          </div>
          <p style={{
            fontFamily: T.fontSans, fontSize: 14, color: T.gray500, marginTop: 4,
          }}>
            Every virtue touched. Keep deepening the journey.
          </p>
        </div>
      )}

      {/* Log Reading Time */}
      <div style={{
        padding: 24, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`,
      }}>
        <h3 style={{
          fontFamily: T.fontSans, fontSize: 16, fontWeight: 600,
          color: T.navy, marginBottom: 4,
        }}>
          Log Reading Time
        </h3>
        <p style={{
          fontFamily: T.fontSans, fontSize: 13, color: T.gray500, marginBottom: 16,
        }}>
          Record time spent reading, discussing, or practicing virtues.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(VIRTUES).map(([key, virtue]) =>
            virtue.subVirtues.map((sv) => {
              const logged = child?.virtueProgress?.[sv.id] || 0;
              const vc = VC[key as keyof typeof VC];
              return (
                <div key={sv.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: T.radiusSm,
                  background: logged > 0 ? vc.light : T.gray50,
                  border: `1px solid ${logged > 0 ? vc.main + "20" : T.gray100}`,
                }}>
                  <div>
                    <div style={{
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      color: logged > 0 ? vc.main : T.gray700,
                    }}>{sv.name}</div>
                    <div style={{
                      fontFamily: T.fontSans, fontSize: 11, color: T.gray400,
                    }}>{logged} min</div>
                  </div>
                  <button onClick={() => onLogTime(selChild, sv.id, 15)} style={{
                    padding: "5px 12px", borderRadius: T.radiusSm,
                    background: vc.main, color: T.white,
                    border: "none", cursor: "pointer",
                    fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Plus size={12} />
                    15m
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
