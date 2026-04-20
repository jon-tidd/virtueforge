"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Heart, Flame, TreePine, Check, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { VIRTUES, GUIDED_QUESTIONS, getSubVirtue, getVirtueParent } from "@/lib/data";
import { T, VC } from "@/lib/tokens";

const VIRTUE_ICONS: Record<string, typeof Brain> = {
  prudence: Brain, justice: Heart, courage: Flame, temperance: TreePine,
};

export default function VirtueSelector({ familyVirtues, onUpdate, onNext }: {
  familyVirtues: string[];
  onUpdate: (virtues: string[]) => void;
  onNext: () => void;
}) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[][]>([]);

  const toggleVirtue = (id: string) => {
    onUpdate(
      familyVirtues.includes(id)
        ? familyVirtues.filter((v) => v !== id)
        : [...familyVirtues, id]
    );
  };

  const handleQuizSelect = (virtues: string[]) => {
    const na = [...quizAnswers, virtues];
    setQuizAnswers(na);
    if (quizStep < GUIDED_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      onUpdate([...new Set([...familyVirtues, ...na.flat()])]);
      setQuizOpen(false);
      setQuizStep(0);
      setQuizAnswers([]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: T.fontSans, fontSize: 28, fontWeight: 700,
          color: T.navy, marginBottom: 6,
        }}>
          Family Virtues
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500, lineHeight: 1.5,
        }}>
          Tap any virtue to add it to your family&apos;s focus. These pre-select
          in Story Studio and guide book recommendations. Optional &mdash; you can
          skip this and go straight to Story Studio.
        </p>
      </div>

      {/* Quiz banner / inline quiz */}
      {!quizOpen ? (
        <button
          onClick={() => setQuizOpen(true)}
          style={{
            width: "100%", marginBottom: 16, padding: "14px 18px",
            borderRadius: T.radius, background: T.goldSubtle,
            border: `1px solid ${T.gold}30`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, textAlign: "left",
            fontFamily: T.fontSans,
          }}
        >
          <Sparkles size={18} color={T.gold} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>
              Not sure where to start?
            </div>
            <div style={{ fontSize: 13, color: T.gray600 }}>
              Answer 4 quick questions and we&apos;ll suggest virtues for your family.
            </div>
          </div>
          <ArrowRight size={16} color={T.gray400} />
        </button>
      ) : (
        <div style={{
          padding: 24, borderRadius: T.radius, background: T.white,
          border: `1px solid ${T.gray100}`, marginBottom: 16,
        }}>
          <div style={{
            fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray400,
            marginBottom: 8,
          }}>
            QUESTION {quizStep + 1} OF {GUIDED_QUESTIONS.length}
          </div>
          <div style={{
            height: 4, borderRadius: 2, background: T.gray100, marginBottom: 20,
          }}>
            <div style={{
              height: 4, borderRadius: 2, background: T.gold,
              width: `${((quizStep + 1) / GUIDED_QUESTIONS.length) * 100}%`,
              transition: "width 0.4s",
            }} />
          </div>
          <h3 style={{
            fontFamily: T.fontSans, fontSize: 20, fontWeight: 700,
            color: T.navy, marginBottom: 16, lineHeight: 1.3,
          }}>
            {GUIDED_QUESTIONS[quizStep].question}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {GUIDED_QUESTIONS[quizStep].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleQuizSelect(opt.virtues)}
                style={{
                  padding: "14px 18px", borderRadius: T.radiusSm, textAlign: "left",
                  border: `1px solid ${T.gray200}`, background: T.white,
                  cursor: "pointer", fontFamily: T.fontSans, fontSize: 14,
                  color: T.navy, transition: "all 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.gray50; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = T.gray200; e.currentTarget.style.background = T.white; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setQuizOpen(false); setQuizStep(0); setQuizAnswers([]); }}
            style={{
              marginTop: 12, padding: "6px 12px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
            }}
          >
            Cancel quiz
          </button>
        </div>
      )}

      {/* Selected summary */}
      {familyVirtues.length > 0 && (
        <div style={{
          padding: 12, borderRadius: T.radius, background: T.greenLight,
          border: `1px solid ${T.green}20`, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          <Check size={16} color={T.green} strokeWidth={3} />
          <span style={{
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.green,
          }}>
            {familyVirtues.length} selected
          </span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
            {familyVirtues.slice(0, 8).map((v) => {
              const sv = getSubVirtue(v);
              const pk = getVirtueParent(v);
              const vc = pk ? VC[pk as keyof typeof VC] : { main: T.gray500 };
              return (
                <span key={v} style={{
                  fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                  padding: "3px 8px", borderRadius: 100,
                  background: T.white, color: vc.main,
                }}>
                  {sv?.name}
                </span>
              );
            })}
            {familyVirtues.length > 8 && (
              <span style={{
                fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                padding: "3px 8px", borderRadius: 100,
                background: T.white, color: T.gray500,
              }}>
                +{familyVirtues.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* All 16 virtues, grouped by cardinal — always visible */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {Object.entries(VIRTUES).map(([key, virtue]) => {
          const vc = VC[key as keyof typeof VC];
          const Icon = VIRTUE_ICONS[key];
          const selCount = virtue.subVirtues.filter((sv) => familyVirtues.includes(sv.id)).length;

          return (
            <div key={key} style={{
              borderRadius: T.radius, background: T.white,
              border: `1px solid ${T.gray100}`, overflow: "hidden",
            }}>
              {/* Cardinal header */}
              <div style={{
                padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
                background: vc.light, borderBottom: `1px solid ${vc.main}20`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: vc.main, display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={16} color={T.white} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.navy,
                  }}>
                    {virtue.name}
                  </div>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
                  }}>
                    {virtue.description}
                  </div>
                </div>
                {selCount > 0 && (
                  <span style={{
                    fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                    padding: "3px 9px", borderRadius: 100,
                    background: vc.main, color: T.white,
                  }}>
                    {selCount}
                  </span>
                )}
              </div>

              {/* Sub-virtues grid — always visible */}
              <div style={{ padding: 12 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {virtue.subVirtues.map((sv) => {
                    const active = familyVirtues.includes(sv.id);
                    return (
                      <button
                        key={sv.id}
                        onClick={() => toggleVirtue(sv.id)}
                        aria-pressed={active}
                        style={{
                          padding: "12px 14px", borderRadius: T.radiusSm,
                          textAlign: "left", cursor: "pointer",
                          border: active ? `2px solid ${vc.main}` : `1px solid ${T.gray200}`,
                          background: active ? vc.light : T.white,
                          transition: "all 0.12s",
                        }}
                        onMouseOver={(e) => { if (!active) e.currentTarget.style.borderColor = vc.main + "80"; }}
                        onMouseOut={(e) => { if (!active) e.currentTarget.style.borderColor = T.gray200; }}
                      >
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, marginBottom: 2,
                        }}>
                          {active && <Check size={14} strokeWidth={3} color={vc.main} />}
                          <span style={{
                            fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                            color: active ? vc.main : T.gray800,
                          }}>
                            {sv.name}
                          </span>
                        </div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
                          lineHeight: 1.4,
                        }}>
                          {sv.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset & Continue */}
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
        <button
          onClick={() => { onUpdate([]); setQuizOpen(false); setQuizStep(0); setQuizAnswers([]); }}
          disabled={familyVirtues.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: T.radiusSm,
            background: T.white,
            color: familyVirtues.length === 0 ? T.gray300 : T.gray500,
            border: `1px solid ${T.gray200}`,
            cursor: familyVirtues.length === 0 ? "default" : "pointer",
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
          }}
        >
          <RotateCcw size={14} />
          Clear all
        </button>
        <button onClick={onNext} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 24px", borderRadius: T.radiusSm,
          background: T.navy, color: T.gold, border: "none",
          cursor: "pointer",
          fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
        }}>
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
