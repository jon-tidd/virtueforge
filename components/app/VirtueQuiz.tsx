"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, ArrowRight, RotateCcw } from "lucide-react";
import { GUIDED_QUESTIONS, getSubVirtue, getVirtueParent } from "@/lib/data";
import { T, VC } from "@/lib/tokens";

export default function VirtueQuiz({
  open, onClose, onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (virtueIds: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [result, setResult] = useState<string[] | null>(null);

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers([]);
      setResult(null);
    }
  }, [open]);

  const handleSelect = (virtues: string[]) => {
    const next = [...answers, virtues];
    if (step < GUIDED_QUESTIONS.length - 1) {
      setAnswers(next);
      setStep(step + 1);
    } else {
      const deduped = [...new Set(next.flat())];
      setAnswers(next);
      setResult(deduped);
    }
  };

  const handleApply = () => {
    if (result) onComplete(result);
    onClose();
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,22,40,0.6)", backdropFilter: "blur(4px)",
            padding: 20,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 520, width: "100%", padding: 28,
              borderRadius: T.radiusLg, background: T.white,
              boxShadow: T.shadowXl, position: "relative",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close quiz"
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none", cursor: "pointer",
                color: T.gray400, padding: 4,
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: T.goldSubtle, display: "flex",
                alignItems: "center", justifyContent: "center",
                border: `1px solid ${T.gold}30`,
              }}>
                <Sparkles size={18} color={T.gold} />
              </div>
              <div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 17, fontWeight: 700, color: T.navy,
                }}>
                  Find your family&apos;s virtues
                </div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
                }}>
                  Answer {GUIDED_QUESTIONS.length} quick questions.
                </div>
              </div>
            </div>

            {!result ? (
              <>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                  color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                  Question {step + 1} of {GUIDED_QUESTIONS.length}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: T.gray100, marginBottom: 20 }}>
                  <div style={{
                    height: 4, borderRadius: 2, background: T.gold,
                    width: `${((step + 1) / GUIDED_QUESTIONS.length) * 100}%`,
                    transition: "width 0.35s",
                  }} />
                </div>
                <h3 style={{
                  fontFamily: T.fontSans, fontSize: 18, fontWeight: 700,
                  color: T.navy, marginBottom: 14, lineHeight: 1.3,
                }}>
                  {GUIDED_QUESTIONS[step].question}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {GUIDED_QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt.virtues)}
                      style={{
                        padding: "13px 16px", borderRadius: T.radiusSm, textAlign: "left",
                        border: `1px solid ${T.gray200}`, background: T.white,
                        cursor: "pointer", fontFamily: T.fontSans, fontSize: 14,
                        color: T.navy, transition: "all 0.12s",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.gray50; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = T.gray200; e.currentTarget.style.background = T.white; }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {step > 0 && (
                  <button
                    onClick={() => { setAnswers(answers.slice(0, -1)); setStep(step - 1); }}
                    style={{
                      marginTop: 14, padding: "6px 0",
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
                    }}
                  >
                    ← Back
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{
                  padding: 16, borderRadius: T.radius,
                  background: T.greenLight, border: `1px solid ${T.green}20`,
                  marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Check size={18} color={T.green} strokeWidth={3} />
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.green,
                  }}>
                    Based on your answers, we suggest {result.length} virtues
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                  {result.map((id) => {
                    const sv = getSubVirtue(id);
                    const pk = getVirtueParent(id);
                    const vc = pk ? VC[pk as keyof typeof VC] : { main: T.gray500 };
                    if (!sv) return null;
                    return (
                      <span key={id} style={{
                        fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                        padding: "6px 12px", borderRadius: 100,
                        background: vc.main, color: T.white,
                      }}>
                        {sv.name}
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={handleApply}
                    style={{
                      flex: 1, minWidth: 180,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "12px 20px", borderRadius: T.radiusSm,
                      background: T.navy, color: T.gold, border: "none", cursor: "pointer",
                      fontFamily: T.fontSans, fontSize: 14, fontWeight: 700,
                    }}
                  >
                    Use these virtues
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleRetake}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "12px 16px", borderRadius: T.radiusSm,
                      background: T.white, color: T.gray600,
                      border: `1px solid ${T.gray200}`, cursor: "pointer",
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
                    }}
                  >
                    <RotateCcw size={13} />
                    Retake
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
