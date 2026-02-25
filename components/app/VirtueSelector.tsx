"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Heart, Flame, TreePine, Check, ArrowRight, RotateCcw } from "lucide-react";
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
  const [mode, setMode] = useState<"choose" | "quiz" | "manual">(
    familyVirtues.length > 0 ? "manual" : "choose"
  );
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[][]>([]);
  const [expandedCardinal, setExpandedCardinal] = useState<string | null>(null);

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
      onUpdate([...new Set(na.flat())]);
      setMode("manual");
    }
  };

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
          Family Virtues
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          Select the virtues your family wants to cultivate. These guide your book recommendations and story generation.
        </p>
      </div>

      {/* Mode selector (only shown if no virtues selected yet) */}
      {mode === "choose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <button onClick={() => setMode("quiz")} style={{
            padding: 24, borderRadius: T.radius, textAlign: "left",
            background: T.white, border: `1px solid ${T.gray200}`,
            cursor: "pointer",
          }}>
            <div style={{
              fontFamily: T.fontSans, fontSize: 16, fontWeight: 600,
              color: T.navy, marginBottom: 4,
            }}>Take Guided Quiz</div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
            }}>Answer 4 questions and we&apos;ll suggest virtues for your family.</div>
          </button>
          <button onClick={() => setMode("manual")} style={{
            padding: 24, borderRadius: T.radius, textAlign: "left",
            background: T.white, border: `1px solid ${T.gray200}`,
            cursor: "pointer",
          }}>
            <div style={{
              fontFamily: T.fontSans, fontSize: 16, fontWeight: 600,
              color: T.navy, marginBottom: 4,
            }}>Choose Manually</div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
            }}>Browse all 16 virtues and select the ones that matter most.</div>
          </button>
        </div>
      )}

      {/* Guided Quiz */}
      {mode === "quiz" && (
        <div style={{
          padding: 32, borderRadius: T.radius, background: T.white,
          border: `1px solid ${T.gray100}`, marginBottom: 24,
        }}>
          <div style={{
            fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray400,
            marginBottom: 8,
          }}>
            QUESTION {quizStep + 1} OF {GUIDED_QUESTIONS.length}
          </div>
          <div style={{
            height: 4, borderRadius: 2, background: T.gray100, marginBottom: 24,
          }}>
            <div style={{
              height: 4, borderRadius: 2, background: T.gold,
              width: `${((quizStep + 1) / GUIDED_QUESTIONS.length) * 100}%`,
              transition: "width 0.4s",
            }} />
          </div>
          <h3 style={{
            fontFamily: T.fontSans, fontSize: 22, fontWeight: 700,
            color: T.navy, marginBottom: 20, lineHeight: 1.3,
          }}>
            {GUIDED_QUESTIONS[quizStep].question}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {GUIDED_QUESTIONS[quizStep].options.map((opt, i) => (
              <button key={i} onClick={() => handleQuizSelect(opt.virtues)} style={{
                padding: "16px 20px", borderRadius: T.radiusSm, textAlign: "left",
                border: `1px solid ${T.gray200}`, background: T.white,
                cursor: "pointer", fontFamily: T.fontSans, fontSize: 15,
                color: T.navy, transition: "all 0.15s",
              }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.gray50; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = T.gray200; e.currentTarget.style.background = T.white; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Selection */}
      {mode === "manual" && (
        <>
          {/* Selected count */}
          {familyVirtues.length > 0 && (
            <div style={{
              padding: 16, borderRadius: T.radius, background: T.greenLight,
              border: `1px solid ${T.green}20`, marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={18} color={T.green} strokeWidth={3} />
                <span style={{
                  fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.green,
                }}>
                  {familyVirtues.length} virtues selected
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {familyVirtues.slice(0, 6).map((v) => {
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
                {familyVirtues.length > 6 && (
                  <span style={{
                    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                    padding: "3px 8px", borderRadius: 100,
                    background: T.white, color: T.gray500,
                  }}>
                    +{familyVirtues.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cardinal virtue cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {Object.entries(VIRTUES).map(([key, virtue]) => {
              const vc = VC[key as keyof typeof VC];
              const Icon = VIRTUE_ICONS[key];
              const isOpen = expandedCardinal === key;
              const selCount = virtue.subVirtues.filter((sv) => familyVirtues.includes(sv.id)).length;

              return (
                <div key={key}>
                  <button onClick={() => setExpandedCardinal(isOpen ? null : key)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "16px 20px",
                    borderRadius: isOpen ? `${T.radius}px ${T.radius}px 0 0` : T.radius,
                    background: isOpen ? vc.main : T.white,
                    color: isOpen ? T.white : T.navy,
                    border: `1px solid ${isOpen ? vc.main : T.gray200}`,
                    cursor: "pointer", fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                    transition: "all 0.15s",
                  }}>
                    <Icon size={20} strokeWidth={2} />
                    <span style={{ flex: 1, textAlign: "left" }}>
                      {virtue.name} — {virtue.description}
                    </span>
                    <span style={{ fontSize: 13, opacity: 0.7 }}>
                      {selCount}/{virtue.subVirtues.length}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: 16, background: vc.light,
                      border: `1px solid ${vc.main}20`, borderTop: "none",
                      borderRadius: `0 0 ${T.radius}px ${T.radius}px`,
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {virtue.subVirtues.map((sv) => {
                          const active = familyVirtues.includes(sv.id);
                          return (
                            <button key={sv.id} onClick={() => toggleVirtue(sv.id)} style={{
                              padding: "14px 16px", borderRadius: T.radiusSm,
                              textAlign: "left", cursor: "pointer",
                              border: active ? `2px solid ${vc.main}` : `1px solid ${T.gray200}`,
                              background: T.white,
                              boxShadow: active ? `0 0 0 1px ${vc.main}40` : "none",
                              transition: "all 0.15s",
                            }}>
                              <div style={{
                                fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                                color: active ? vc.main : T.gray800,
                              }}>
                                {active && <Check size={14} strokeWidth={3} style={{ display: "inline", marginRight: 4 }} />}
                                {sv.name}
                              </div>
                              <div style={{
                                fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
                                marginTop: 4, lineHeight: 1.4,
                              }}>{sv.desc}</div>
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

          {/* Reset & Continue */}
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
            <button onClick={() => { onUpdate([]); setMode("choose"); setQuizStep(0); setQuizAnswers([]); }} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: T.radiusSm,
              background: T.white, color: T.gray500,
              border: `1px solid ${T.gray200}`, cursor: "pointer",
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
            }}>
              <RotateCcw size={14} />
              Start Over
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
        </>
      )}
    </motion.div>
  );
}
