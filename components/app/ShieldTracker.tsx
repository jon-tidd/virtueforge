"use client";
import { motion } from "framer-motion";
import { Brain, Heart, Flame, TreePine, Plus, Trophy, AlertCircle } from "lucide-react";
import { VIRTUES, getVirtueParent, type AppData } from "@/lib/data";
import { T, VC } from "@/lib/tokens";

const VIRTUE_ICONS: Record<string, typeof Brain> = {
  prudence: Brain, justice: Heart, courage: Flame, temperance: TreePine,
};

// Target minutes per sub-virtue for "full" on the compass
const TARGET_MINUTES = 60;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
}

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

  // Build 16 sub-virtue spokes in cardinal-virtue order
  const allSubVirtues = Object.entries(VIRTUES).flatMap(([key, virtue]) =>
    virtue.subVirtues.map((sv) => ({ ...sv, parentKey: key }))
  );

  const quadrants = Object.entries(VIRTUES).map(([key, virtue]) => {
    const total = virtue.subVirtues.length;
    const covered = virtue.subVirtues.filter((sv) => (child?.virtueProgress?.[sv.id] || 0) > 0).length;
    const time = virtue.subVirtues.reduce((s, sv) => s + (child?.virtueProgress?.[sv.id] || 0), 0);
    return { key, virtue, covered, total, time, pct: total > 0 ? covered / total : 0 };
  });

  const overallPct = Math.round(quadrants.reduce((s, q) => s + q.pct, 0) / 4 * 100);
  const totalTime = quadrants.reduce((s, q) => s + q.time, 0);
  const gaps = Object.values(VIRTUES).flatMap((v) => v.subVirtues).filter((sv) => !(child?.virtueProgress?.[sv.id]));

  // Compass SVG dimensions
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 150;
  const spokeCount = allSubVirtues.length; // 16
  const angleStep = 360 / spokeCount;

  // Guide circles
  const guideRadii = [0.25, 0.5, 0.75, 1.0].map((f) => f * maxR);

  // Build data points for the progress polygon
  const dataPoints = allSubVirtues.map((sv, i) => {
    const angleDeg = i * angleStep;
    const minutes = child?.virtueProgress?.[sv.id] || 0;
    const pct = Math.min(minutes / TARGET_MINUTES, 1);
    const r = Math.max(pct * maxR, 8); // minimum 8px so polygon is always visible
    const pos = polarToCartesian(cx, cy, r, angleDeg);
    const outerPos = polarToCartesian(cx, cy, maxR, angleDeg);
    const labelPos = polarToCartesian(cx, cy, maxR + 18, angleDeg);
    const vc = VC[sv.parentKey as keyof typeof VC];
    return { sv, angleDeg, pct, pos, outerPos, labelPos, vc, minutes };
  });

  const polygonPath = dataPoints.map((d, i) => `${i === 0 ? "M" : "L"}${d.pos.x},${d.pos.y}`).join(" ") + " Z";

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
          Character Compass
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

      {/* Compass + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8" style={{
        padding: 32, borderRadius: T.radiusLg, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 20,
      }}>
        {/* Compass SVG */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto animate-compass-reveal">
            <defs>
              <linearGradient id="compassFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.gold} stopOpacity="0.25" />
                <stop offset="100%" stopColor={T.gold} stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Guide circles */}
            {guideRadii.map((r, i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={T.gray200} strokeWidth={i === guideRadii.length - 1 ? 1.5 : 0.75}
                strokeDasharray={i < guideRadii.length - 1 ? "4 4" : "none"} />
            ))}

            {/* Spokes */}
            {dataPoints.map((d, i) => (
              <line key={i} x1={cx} y1={cy} x2={d.outerPos.x} y2={d.outerPos.y}
                stroke={T.gray200} strokeWidth={0.5} />
            ))}

            {/* Cardinal virtue labels at compass points */}
            {[
              { label: "Prudence", angleDeg: 0 + angleStep * 1.5, color: VC.prudence.main },
              { label: "Justice", angleDeg: angleStep * 4 + angleStep * 1.5, color: VC.justice.main },
              { label: "Courage", angleDeg: angleStep * 8 + angleStep * 1.5, color: VC.courage.main },
              { label: "Temperance", angleDeg: angleStep * 12 + angleStep * 1.5, color: VC.temperance.main },
            ].map((cv, i) => {
              const pos = polarToCartesian(cx, cy, maxR + 34, cv.angleDeg);
              return (
                <text key={i} x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fill={cv.color} fontSize="11" fontWeight="700"
                  fontFamily="Inter, sans-serif">
                  {cv.label}
                </text>
              );
            })}

            {/* Progress polygon */}
            <motion.path
              d={polygonPath}
              fill="url(#compassFill)"
              stroke={T.gold}
              strokeWidth={2}
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />

            {/* Sub-virtue dots */}
            {dataPoints.map((d, i) => (
              <circle key={i} cx={d.outerPos.x} cy={d.outerPos.y} r={4}
                fill={d.minutes > 0 ? d.vc.main : T.gray300}
                stroke={T.white} strokeWidth={1.5} />
            ))}

            {/* Data point dots on polygon */}
            {dataPoints.map((d, i) => (
              d.minutes > 0 && (
                <circle key={`dp-${i}`} cx={d.pos.x} cy={d.pos.y} r={3}
                  fill={T.gold} stroke={T.white} strokeWidth={1} />
              )
            ))}

            {/* Center label */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill={T.navy}
              fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">
              {overallPct}%
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={T.gray400}
              fontSize="10" fontFamily="Inter, sans-serif">
              overall coverage
            </text>
            <text x={cx} y={cy + 28} textAnchor="middle" fill={T.gold}
              fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">
              {child?.name}
            </text>
          </svg>
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
            {child?.name}&apos;s compass is complete!
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
