"use client";
import { useState } from "react";
import { GUIDED_QUESTIONS } from "@/lib/data";
import { T } from "@/lib/tokens";

export default function GuidedQuiz({ onComplete }: { onComplete: (v: string[]) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>([]);

  const handleSelect = (virtues: string[]) => {
    const na = [...answers, virtues];
    setAnswers(na);
    if (step < GUIDED_QUESTIONS.length - 1) setStep(step + 1);
    else onComplete([...new Set(na.flat())]);
  };

  const q = GUIDED_QUESTIONS[step];

  return (
    <div style={{ maxWidth: 540 }}>
      <div style={{ fontSize: 14, color: T.gray400, marginBottom: 10, fontWeight: 600 }}>
        Question {step + 1} of {GUIDED_QUESTIONS.length}
      </div>
      <div style={{ height: 6, borderRadius: 3, background: T.gray100, marginBottom: 28 }}>
        <div style={{ height: 6, borderRadius: 3, background: T.gold,
          width: `${((step + 1) / GUIDED_QUESTIONS.length) * 100}%`, transition: "width 0.4s" }} />
      </div>
      <h3 style={{ fontFamily: T.font, fontSize: 24, marginBottom: 24, color: T.navy, lineHeight: 1.4 }}>
        {q.question}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(opt.virtues)} style={{
            padding: "18px 22px", borderRadius: 10, border: `2px solid ${T.gray100}`,
            background: T.white, cursor: "pointer", textAlign: "left",
            fontSize: 17, fontFamily: T.font, color: T.navy, transition: "all 0.15s",
          }}
            onMouseOver={(e) => { (e.currentTarget).style.borderColor = T.gold; (e.currentTarget).style.background = T.gray50; }}
            onMouseOut={(e) => { (e.currentTarget).style.borderColor = T.gray100; (e.currentTarget).style.background = T.white; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
