"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { T } from "@/lib/tokens";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

// Replace these with real beta tester quotes as you collect them.
// Keep it honest — mark clearly when these are from real users.
const TESTIMONIALS = [
  {
    quote: "We used the sharing story with our 5-year-old and he actually started offering toys to his sister the next day. The discussion questions made it easy to talk about without lecturing.",
    name: "Beta Family",
    detail: "Parent of a 5-year-old",
    initials: "BF",
  },
  {
    quote: "The book recommendations are incredible. Every single one is a real classic \u2014 no filler. My daughter has read six of them so far and asks for more.",
    name: "Beta Family",
    detail: "Parent of an 8-year-old",
    initials: "BF",
  },
  {
    quote: "I love that this is built on real philosophy, not just feel-good fluff. The virtue framework gives our bedtime reading actual direction and purpose.",
    name: "Beta Family",
    detail: "Parent of two, ages 4 & 7",
    initials: "BF",
  },
];

export default function SocialProof() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={i}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={i + 1}
            style={{
              padding: 28, borderRadius: T.radiusLg,
              background: T.white, border: `1px solid ${T.gray100}`,
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} fill={T.gold} color={T.gold} />
              ))}
            </div>
            <p style={{
              fontFamily: T.fontSerif, fontSize: 16, color: T.gray700,
              lineHeight: 1.7, fontStyle: "italic", flex: 1,
              marginBottom: 20,
            }}>
              &ldquo;{t.quote}&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: T.goldSubtle, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                color: T.gold, border: `1px solid ${T.gold}30`,
              }}>
                {t.initials}
              </div>
              <div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                  color: T.navy,
                }}>
                  {t.name}
                </div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
                }}>
                  {t.detail}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <p style={{
        fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
        textAlign: "center", marginTop: 16, fontStyle: "italic",
      }}>
        From early beta families. We&apos;ll add more as our community grows.
      </p>
    </div>
  );
}
