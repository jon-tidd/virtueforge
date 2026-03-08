"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, BookOpen, Shield, Pen, Monitor, Heart,
  Smartphone, Clock, X, Check, Users, ArrowRight,
} from "lucide-react";
import { T, VC } from "@/lib/tokens";

// ═══════════════════════════════════════════════════════════════════════════════
// useInView — trigger animation once when element scrolls into viewport
// ═══════════════════════════════════════════════════════════════════════════════
export function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AnimatedCounter — counts up from 0 to target on scroll
// ═══════════════════════════════════════════════════════════════════════════════
export function AnimatedCounter({ target, suffix = "", prefix = "" }: {
  target: number; suffix?: string; prefix?: string;
}) {
  const { ref, inView } = useInView(0.5);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TypingStoryDemo — AI story being typed in real-time
// ═══════════════════════════════════════════════════════════════════════════════
const DEMO_STORIES = [
  {
    title: "The Golden Acorn",
    child: "Sam", age: 5, virtue: "Generosity", virtueColor: VC.justice.main,
    text: "Once upon a time, in a forest where the oak trees whispered secrets to the wind, there lived a young squirrel named Sam who had found the most magnificent golden acorn anyone had ever seen. It sparkled in the morning light, and Sam clutched it tightly. \"This is mine,\" he said. But deep in the forest, a family of chipmunks had nothing to eat for winter...",
  },
  {
    title: "The Truthful Mirror",
    child: "Maya", age: 8, virtue: "Honesty", virtueColor: VC.prudence.main,
    text: "In the village of Thornwick, where the cobblestone streets wound like rivers between the old stone houses, there lived a girl named Maya who had a secret. She had broken her mother's favorite vase \u2014 the blue one with the painted swallows \u2014 and she had told no one. Every night, the secret grew heavier, like a stone in her pocket...",
  },
  {
    title: "The Mountain That Waited",
    child: "Alex", age: 6, virtue: "Perseverance", virtueColor: VC.courage.main,
    text: "There once was a mountain that no child had ever climbed. Not because it was too tall \u2014 though it was very tall indeed \u2014 but because it had a trick. Every time a climber reached halfway, the mountain would whisper: \"Why not rest? Why not go back?\" But a boy named Alex had heard those words twice before, and this time he kept climbing...",
  },
];

type Phase = "typing" | "waiting" | "transitioning";

export function TypingStoryDemo({ onTryStoryForge }: { onTryStoryForge?: () => void } = {}) {
  const [storyIdx, setStoryIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const { ref, inView } = useInView(0.2);

  const story = DEMO_STORIES[storyIdx];

  useEffect(() => {
    if (!inView) return;

    if (phase === "typing") {
      if (charIdx >= story.text.length) {
        setPhase("waiting");
        return;
      }
      const delay = 28 + Math.random() * 18;
      const timer = setTimeout(() => setCharIdx((c) => c + 1), delay);
      return () => clearTimeout(timer);
    }

    if (phase === "waiting") {
      const timer = setTimeout(() => setPhase("transitioning"), 3500);
      return () => clearTimeout(timer);
    }

    if (phase === "transitioning") {
      const timer = setTimeout(() => {
        setStoryIdx((i) => (i + 1) % DEMO_STORIES.length);
        setCharIdx(0);
        setPhase("typing");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, charIdx, story.text.length, inView, storyIdx]);

  const displayText = story.text.slice(0, charIdx);
  const showCursor = phase === "typing" && charIdx < story.text.length;

  return (
    <section ref={ref} className="px-6 sm:px-8 md:px-10" style={{
      paddingTop: 80, paddingBottom: 80, background: T.navy,
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
            color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: 16,
          }}>
            See It In Action
          </p>
          <h2 style={{
            fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800, color: T.white, lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            Watch a story come to life
          </h2>
        </div>

        {/* Story demo card — clickable to Story Forge */}
        <div
          onClick={onTryStoryForge}
          role={onTryStoryForge ? "button" : undefined}
          tabIndex={onTryStoryForge ? 0 : undefined}
          onKeyDown={onTryStoryForge ? (e) => { if (e.key === "Enter") onTryStoryForge(); } : undefined}
          style={{
            background: T.navyMid, borderRadius: T.radiusLg,
            border: `1px solid rgba(255,255,255,0.08)`,
            overflow: "hidden",
            cursor: onTryStoryForge ? "pointer" : undefined,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => { if (onTryStoryForge) { e.currentTarget.style.borderColor = "rgba(212,168,70,0.35)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(212,168,70,0.1)"; } }}
          onMouseLeave={(e) => { if (onTryStoryForge) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; } }}
        >
          {/* Top bar mimicking app UI */}
          <div style={{
            padding: "14px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} color={T.gold} />
              <span style={{
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                color: T.white,
              }}>
                AI Story Forge
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 100,
              background: "rgba(212,168,70,0.15)",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: T.gold,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
              <span style={{
                fontFamily: T.fontSans, fontSize: 10, fontWeight: 600,
                color: T.gold,
              }}>
                Generating
              </span>
            </div>
          </div>

          {/* Child profile chips */}
          <div style={{
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 8,
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={story.child}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 100,
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                <Users size={12} color={T.gray400} />
                <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.gray300 }}>
                  {story.child}, age {story.age}
                </span>
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={story.virtue}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  padding: "5px 12px", borderRadius: 100,
                  background: `${story.virtueColor}22`,
                }}
              >
                <span style={{
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                  color: story.virtueColor,
                }}>
                  {story.virtue}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Story content */}
          <div style={{ padding: "24px 20px 32px", minHeight: 220 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={storyIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "transitioning" ? 0.3 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 style={{
                  fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700,
                  color: T.gold, marginBottom: 16, fontStyle: "italic",
                }}>
                  {story.title}
                </h3>
                <p style={{
                  fontFamily: T.fontSerif, fontSize: 16, color: T.gray300,
                  lineHeight: 1.8, minHeight: 140,
                }}>
                  {displayText}
                  {showCursor && (
                    <span style={{
                      display: "inline-block", width: 2, height: 18,
                      background: T.gold, marginLeft: 1,
                      verticalAlign: "text-bottom",
                      animation: "blink 0.8s step-end infinite",
                    }} />
                  )}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Story indicator dots */}
          <div style={{
            padding: "0 20px 16px", display: "flex",
            justifyContent: "center", gap: 8,
          }}>
            {DEMO_STORIES.map((_, i) => (
              <div key={i} style={{
                width: i === storyIdx ? 24 : 8, height: 8,
                borderRadius: 4,
                background: i === storyIdx ? T.gold : "rgba(255,255,255,0.15)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
        </div>

        {/* CTA button below the demo */}
        {onTryStoryForge && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              onClick={onTryStoryForge}
              className="cta-glow"
              style={{
                padding: "16px 36px", borderRadius: T.radiusSm,
                fontFamily: T.fontSans, fontSize: 17, fontWeight: 700,
                background: T.gold, color: T.navy, border: "none",
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
            >
              <Sparkles size={18} />
              Create Your Child&apos;s Story Now
              <ArrowRight size={18} />
            </button>
            <p style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
              marginTop: 12,
            }}>
              Personalized bedtime stories in under 60 seconds
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BeforeAfterComparison — side-by-side comparison cards
// ═══════════════════════════════════════════════════════════════════════════════
const WITHOUT_ITEMS = [
  { icon: Smartphone, text: "7+ hrs daily screen time" },
  { icon: Monitor, text: "Algorithmic content, no curation" },
  { icon: Clock, text: "Passive, isolated consumption" },
  { icon: X, text: "No moral framework or guidance" },
  { icon: X, text: "Short-form content eroding attention" },
];

const WITH_ITEMS = [
  { icon: BookOpen, text: "20 min of intentional story time" },
  { icon: Shield, text: "Classical virtues, hand-curated" },
  { icon: Heart, text: "Active imagination & discussion" },
  { icon: Check, text: "2,400 years of moral wisdom" },
  { icon: Users, text: "Family connection & bonding" },
];

export function BeforeAfterComparison() {
  const { ref, inView } = useInView(0.2);

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: 40 }}>
      {/* WITHOUT */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          padding: 28, borderRadius: T.radiusLg,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 16,
        }}>
          Without Direction
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {WITHOUT_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} color="#EF4444" strokeWidth={2} />
                </div>
                <span style={{
                  fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
                }}>
                  {item.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* WITH */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          padding: 28, borderRadius: T.radiusLg,
          background: "rgba(212,168,70,0.06)",
          border: `1px solid ${T.gold}25`,
        }}
      >
        <div style={{
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          color: T.gold, textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 16,
        }}>
          With Bedtime Virtues
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {WITH_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: `${T.gold}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={14} color={T.gold} strokeWidth={2} />
                </div>
                <span style={{
                  fontFamily: T.fontSans, fontSize: 13, color: T.gray300,
                }}>
                  {item.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WaveDivider — smooth curve between sections
// ═══════════════════════════════════════════════════════════════════════════════
export function WaveDivider({ color = T.white, flip = false }: {
  color?: string; flip?: boolean;
}) {
  return (
    <div style={{
      marginTop: -1, marginBottom: -1, lineHeight: 0,
      transform: flip ? "scaleY(-1)" : "none",
      overflow: "hidden",
    }}>
      <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "clamp(24px, 3vw, 48px)", display: "block" }}>
        <path
          d="M0 24 C240 0 480 48 720 24 C960 0 1200 48 1440 24 L1440 48 L0 48 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GlowingStatNumber — stat with animated glow ring
// ═══════════════════════════════════════════════════════════════════════════════
export function GlowingStatNumber({ value, color }: { value: string; color: string }) {
  const { ref, inView } = useInView(0.5);
  // Parse numeric value for counter animation
  const numMatch = value.match(/(\d+)/);
  const numVal = numMatch ? parseInt(numMatch[1]) : 0;
  const isMultiplier = value.includes("\u00d7") || value.includes("x");
  const suffix = isMultiplier ? "\u00d7" : "%";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Glow ring */}
      <svg width="80" height="80" viewBox="0 0 80 80" style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: inView ? 0.15 : 0, transition: "opacity 0.8s ease",
      }}>
        <circle cx="40" cy="40" r="36" fill="none" stroke={color}
          strokeWidth="2" strokeDasharray={`${2 * Math.PI * 36}`}
          strokeDashoffset={inView ? 0 : 2 * Math.PI * 36}
          style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span style={{ position: "relative", zIndex: 1 }}>
        {inView ? (
          <AnimatedCounter target={numVal} suffix={suffix} />
        ) : (
          `0${suffix}`
        )}
      </span>
    </div>
  );
}
