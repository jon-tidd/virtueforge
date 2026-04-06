"use client";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  BookOpen, Shield, Sparkles, ChevronRight, ArrowRight,
  Brain, Heart, Flame, TreePine, Star, Users, TrendingUp,
  BookMarked, Pen, BarChart3, Zap, Check, Sun, RefreshCw,
} from "lucide-react";
import { VIRTUES } from "@/lib/data";
import { T, VC, PLANS } from "@/lib/tokens";
import {
  HeroIllustration, ScreenTimeIllustration,
  StoryForgeMockup, BookExplorerMockup,
  CAROUSEL_BOOKS,
} from "./Illustrations";
import {
  TypingStoryDemo, BeforeAfterComparison, WaveDivider,
} from "./Animations";
import FAQ from "./FAQ";
import EmailCapture from "./EmailCapture";
import SocialProof from "./SocialProof";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const VIRTUE_ICONS: Record<string, typeof Brain> = {
  prudence: Brain, justice: Heart, courage: Flame, temperance: TreePine,
};

const VIRTUE_IMAGES: Record<string, { src: string; alt: string }> = {
  prudence: { src: "/images/prudence-owl-sq.png", alt: "Wise owl representing prudence" },
  justice: { src: "/images/justice-scales-sq.png", alt: "Golden scales representing justice" },
  courage: { src: "/images/courage-lion-sq.png", alt: "Majestic lion representing courage" },
  temperance: { src: "/images/temperance-tree-sq.png", alt: "Ancient tree representing temperance" },
};

export type DemoScenario = {
  label: string;
  childName: string;
  age: number;
  sex: string;
  virtue: string;
  situation: string;
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  { label: "My 5-year-old won't share with his brother", childName: "Sam", age: 5, sex: "boy", virtue: "generosity", situation: "won't share with new sibling" },
  { label: "My 8-year-old struggles with telling the truth", childName: "Maya", age: 8, sex: "girl", virtue: "honesty", situation: "struggling to tell the truth" },
  { label: "My 6-year-old gives up when things get hard", childName: "Alex", age: 6, sex: "boy", virtue: "perseverance", situation: "gives up easily when things get difficult" },
];

const RESEARCH_STATS = [
  {
    number: "25%",
    label: "fewer behavior problems",
    desc: "Children in virtue-based character programs show 20\u201325% fewer behavioral issues including aggression, defiance, and withdrawal.",
    source: "Brown et al., 2023 meta-analysis of 214 studies",
    color: VC.prudence.main,
    bg: VC.prudence.light,
  },
  {
    number: "11%",
    label: "academic percentile gain",
    desc: "SEL programs boost academics by 11 percentile points across 270,034 students \u2014 that\u2019s moving from the 50th to 61st percentile.",
    source: "Durlak et al., CASEL Meta-Analysis",
    color: VC.justice.main,
    bg: VC.justice.light,
  },
  {
    number: "2\u00d7",
    label: "more retained than lectures",
    desc: "Children who learn morals through stories retain twice as much and show stronger transfer to real-life behavior than lecture-based approaches.",
    source: "Jubilee Centre, University of Birmingham",
    color: VC.courage.main,
    bg: VC.courage.light,
  },
  {
    number: "75%",
    label: "stronger wellbeing predictor",
    desc: "Gratitude and perseverance predict long-term wellbeing 75% better than IQ or socioeconomic status.",
    source: "VIA Institute; Duckworth, UPenn",
    color: VC.temperance.main,
    bg: VC.temperance.light,
  },
];


const CHARACTER_CYCLE = [
  { icon: BookOpen, title: "Stories", desc: "The child encounters virtue in narrative" },
  { icon: Sparkles, title: "Moral Imagination", desc: "The child sees themselves as the hero" },
  { icon: RefreshCw, title: "Habituation", desc: "Daily practice builds lasting habit" },
  { icon: Shield, title: "Virtue", desc: "Habit crystallizes into character" },
  { icon: Sun, title: "Flourishing", desc: "Character enables a life well-lived" },
];

// Book Carousel — auto-scrolling CSS animation with real covers
function BookCarousel() {
  const books = [...CAROUSEL_BOOKS, ...CAROUSEL_BOOKS];
  return (
    <div style={{ overflow: "hidden", width: "100%", marginTop: 32 }}>
      <div style={{
        display: "flex", gap: 20, width: "max-content",
        animation: "scrollCarousel 45s linear infinite",
      }}>
        {books.map((book, i) => (
          <div key={i} style={{
            width: 130, flexShrink: 0, textAlign: "center",
          }}>
            {/* Real book cover */}
            <div style={{
              width: 100, height: 148, margin: "0 auto 10px",
              borderRadius: 6, overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
              background: `linear-gradient(135deg, ${book.color}15, ${book.color}05)`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={book.cover}
                alt={`${book.title} by ${book.author}`}
                loading="lazy"
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  if (target.parentElement) {
                    target.parentElement.style.display = "flex";
                    target.parentElement.style.alignItems = "center";
                    target.parentElement.style.justifyContent = "center";
                    target.parentElement.style.padding = "12px";
                  }
                }}
              />
            </div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
              color: T.navy, lineHeight: 1.3, marginBottom: 3,
              whiteSpace: "pre-line",
            }}>
              {book.title}
            </div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 10, color: T.gray400,
              marginBottom: 6,
            }}>
              {book.author}
            </div>
            <span style={{
              fontFamily: T.fontSans, fontSize: 9, fontWeight: 600,
              padding: "2px 8px", borderRadius: 100,
              background: `${book.color}10`, color: book.color,
            }}>
              {book.virtue}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollCarousel {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-carousel { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage({ onStart, onPricing, onDemo, onNavigate, hasAccount }: {
  onStart: () => void;
  onPricing: () => void;
  onDemo?: (scenario: DemoScenario) => void;
  onNavigate?: (page: string) => void;
  hasAccount: boolean;
}) {
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, 30]);

  return (
    <div style={{ background: T.white, minHeight: "100vh" }}>
      {/* ═══ NAV BAR ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.gray100}`,
      }}>
        <div className="px-6 sm:px-8 md:px-10" style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64,
        }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              fontFamily: T.fontSans, fontWeight: 700, fontSize: 18, color: T.navy,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <Shield size={22} strokeWidth={2.5} color={T.gold} />
            Bedtime Virtues
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#science" className="hidden md:inline" style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
              color: T.gray600, textDecoration: "none",
            }}>Research</a>
            <a href="#how" className="hidden md:inline" style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
              color: T.gray600, textDecoration: "none",
            }}>How It Works</a>
            <button onClick={onPricing} className="hidden md:inline" style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
              color: T.gray600, background: "none", border: "none", cursor: "pointer",
            }}>Pricing</button>
            <button onClick={onStart} style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.white, background: T.navy, border: "none", cursor: "pointer",
              padding: "8px 20px", borderRadius: T.radiusSm,
            }}>
              {hasAccount ? "Open App" : "Get Started"}
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-20 px-6 sm:px-8 md:px-10" style={{
        textAlign: "center", background: T.white,
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle gradient orbs — decorative, kept away from hero image */}
        <div className="animate-orb-pulse" style={{
          position: "absolute", top: -280, right: -280, width: 500, height: 500,
          borderRadius: "50%", background: `radial-gradient(circle, ${VC.prudence.light} 0%, transparent 70%)`,
          pointerEvents: "none", opacity: 0.3,
        }} />
        <div className="animate-orb-pulse" style={{
          position: "absolute", bottom: -280, left: -280, width: 400, height: 400,
          borderRadius: "50%", background: `radial-gradient(circle, ${T.goldSubtle} 0%, transparent 70%)`,
          pointerEvents: "none", opacity: 0.35, animationDelay: "2s",
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}
        >
          <h1 style={{
            fontFamily: T.fontSans, fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800, color: T.navy, lineHeight: 1.08,
            letterSpacing: "-0.03em", marginBottom: 24,
          }}>
            Stories That Actually<br />
            Build <span className="text-gold-gradient">Character</span>
          </h1>

          <p style={{
            fontFamily: T.fontSans, fontSize: "clamp(17px, 2vw, 20px)",
            color: T.gray500, lineHeight: 1.6, maxWidth: 620, margin: "0 auto 40px",
          }}>
            AI-generated adventures for your child&apos;s real struggles.
            57+ hand-curated classics mapped to classical virtues.
            Two paths, one mission.
          </p>

          {/* Two-path CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4" style={{ justifyContent: "center", alignItems: "center" }}>
            <button className="cta-glow" onClick={() => onNavigate ? onNavigate("stories") : onStart()} style={{
              fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
              color: T.gold, background: T.navy, border: "none", cursor: "pointer",
              padding: "14px 32px", borderRadius: T.radiusSm,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(10,22,40,0.3)",
            }}>
              <Pen size={18} />
              Generate a Story
            </button>
            <button className="card-lift" onClick={() => onNavigate ? onNavigate("books") : onStart()} style={{
              fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
              color: T.navy, background: T.white, border: `2px solid ${T.navy}`,
              cursor: "pointer", padding: "12px 32px", borderRadius: T.radiusSm,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <BookOpen size={18} />
              Discover Great Books
            </button>
          </div>

          <p style={{
            fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
            marginTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px",
          }}>
            <span>Free to use</span>
            <span style={{ color: T.gray300 }}>&middot;</span>
            <span>No account required</span>
            <span style={{ color: T.gray300 }}>&middot;</span>
            <span>Your data stays on your device</span>
          </p>

          {/* Demo scenario buttons — redesigned navy pills */}
          {onDemo && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3" style={{
              marginTop: 28, justifyContent: "center", alignItems: "center",
            }}>
              {DEMO_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.label}
                  onClick={() => onDemo(scenario)}
                  className="cta-glow"
                  style={{
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                    padding: "10px 20px", borderRadius: 100,
                    background: T.navyMid, color: T.white,
                    border: `1px solid rgba(255,255,255,0.1)`,
                    cursor: "pointer",
                    boxShadow: T.shadowMd,
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <Sparkles size={14} />
                  {scenario.label}
                </button>
              ))}
            </div>
          )}

          {/* Hero illustration with parallax */}
          <motion.div style={{
            marginTop: 48, maxWidth: 700, margin: "48px auto 0",
            y: heroParallax,
          }}>
            <HeroIllustration />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ BOOK CAROUSEL — auto-scrolling ═══ */}
      <section style={{
        paddingTop: 0, paddingBottom: 48, background: T.white,
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{
            fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
            color: T.gray400, textAlign: "center", letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: 16,
          }}>
            From the Library &mdash; 57+ Curated Classics
          </p>
          <BookCarousel />
        </div>
      </section>

      <WaveDivider color={T.navy} />

      {/* ═══ THE CRISIS ═══ */}
      <section id="crisis" className="px-6 sm:px-8 md:px-10" style={{
        paddingTop: 80, paddingBottom: 80, background: T.navy, color: T.white,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp} custom={0}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              The Crisis
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em",
              marginBottom: 20,
            }}>
              The stories that built every generation&apos;s<br />character are disappearing.
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 18, color: T.gray300,
              lineHeight: 1.7, maxWidth: 680, margin: "0 auto 32px",
            }}>
              Children now spend 7+ hours per day on screens. Only 1 in 3 families read bedtime stories nightly &mdash;
              down from 2 in 3 a decade ago. Algorithmic content has replaced the moral narratives that once shaped
              every generation&apos;s character. The short-form scroll is eroding the deep storytelling that teaches
              children how to live.
            </p>
          </motion.div>

          {/* Screen time vs reading illustration */}
          <div style={{ maxWidth: 600, margin: "0 auto 40px" }}>
            <ScreenTimeIllustration />
          </div>

          {/* Before / After comparison */}
          <BeforeAfterComparison />
        </div>
      </section>

      <WaveDivider color={T.white} />

      {/* ═══ CLASSICAL WISDOM ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 100, paddingBottom: 100, background: T.white }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              Classical Foundations
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em", marginBottom: 20,
            }}>
              What the ancients knew &mdash;<br />and we have forgotten
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 18, color: T.gray500,
              lineHeight: 1.7, maxWidth: 640, margin: "0 auto",
            }}>
              Plato taught that the stories we tell children shape their souls before reason takes hold.
              Aristotle called it <em>hexis</em> &mdash; the forging of character through habitual practice,
              not lectures. For 2,400 years, every civilization that endured understood this truth:
              character is not inherited &mdash; it is forged.
            </p>
          </motion.div>

          {/* Philosopher Video */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            style={{ marginBottom: 48 }}
          >
            <div style={{ maxWidth: 640, margin: "0 auto", borderRadius: 16, overflow: "hidden" }}>
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{ width: "100%", display: "block" }}
              >
                <source src="/videos/philosophers.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 640, margin: "16px auto 0" }}>
              {[
                { name: "Aristotle", quote: "We are what we repeatedly do." },
                { name: "Plato", quote: "The soul takes nothing with her to the next world but her education and culture." },
                { name: "Socrates", quote: "Education is the kindling of a flame, not the filling of a vessel." },
              ].map((p) => (
                <div key={p.name} style={{ textAlign: "center" }}>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
                    lineHeight: 1.5, margin: 0, fontStyle: "italic",
                  }}>
                    &ldquo;{p.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={3}
            style={{ textAlign: "center" }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 17, color: T.gray600,
              lineHeight: 1.7, maxWidth: 640, margin: "0 auto",
            }}>
              In an age of algorithmic manipulation, moral relativism, and instant gratification,
              the classical virtues aren&apos;t a relic &mdash; they&apos;re the counterbalance.
              Stories are how children rehearse virtue before they encounter it in life.
              This matters more now than ever.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ THE RESEARCH ═══ */}
      <section id="science" className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 100, paddingBottom: 100, background: T.bg }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: VC.courage.main, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              The Research
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em", marginBottom: 16,
            }}>
              Backed by 2,400 Years of Wisdom<br />+ Modern Science
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 18, color: T.gray500,
              lineHeight: 1.6, maxWidth: 600, margin: "0 auto",
            }}>
              Aristotle called it <em>hexis</em> &mdash; character formed through practice.
              Modern psychology calls it social-emotional learning. Both agree: stories are how children rehearse virtue before they encounter it in life.
            </p>
          </motion.div>

          {/* Research stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 48 }}>
            {RESEARCH_STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                style={{
                  padding: 24, borderRadius: T.radiusLg,
                  background: T.white, border: `1px solid ${T.gray100}`,
                  textAlign: "center",
                }}
              >
                <div style={{
                  fontFamily: T.fontSans, fontSize: 40, fontWeight: 800,
                  color: stat.color, lineHeight: 1, marginBottom: 6,
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                  color: T.gray500, textTransform: "uppercase", letterSpacing: "0.04em",
                  marginBottom: 8,
                }}>
                  {stat.label}
                </div>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
                  lineHeight: 1.4, marginBottom: 8,
                }}>
                  {stat.desc}
                </p>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 11, color: T.gray400,
                  fontStyle: "italic", margin: 0,
                }}>
                  {stat.source}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ marginTop: 32 }}>
            {[
              {
                icon: BookMarked, title: "Narrative Moral Reasoning",
                desc: "Children who engage with moral stories and guided discussion develop stronger ethical reasoning than those who receive direct instruction alone.",
                cite: "Narvaez, Notre Dame Research",
                color: VC.prudence.main, bg: VC.prudence.light,
              },
              {
                icon: Brain, title: "Brain Development",
                desc: "MRI studies show children read to regularly develop significantly more activity in brain regions linked to narrative comprehension and empathy.",
                cite: "Neuroscience News / Cincinnati Children\u2019s Hospital",
                color: VC.justice.main, bg: VC.justice.light,
              },
              {
                icon: TrendingUp, title: "Academic Achievement",
                desc: "Children read to daily from age 1 score significantly higher in both reading and math by age 10 \u2014 regardless of family income.",
                cite: "Kalb & van Ours; UCL 2020 study of 160,000+ children",
                color: VC.courage.main, bg: VC.courage.light,
              },
              {
                icon: Heart, title: "Resilience & Wellbeing",
                desc: "Regular reading is associated with greater resilience, emotional regulation, and life satisfaction in children across socioeconomic backgrounds.",
                cite: "Journal of Epidemiology / PMC Meta-Analysis",
                color: VC.temperance.main, bg: VC.temperance.light,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i + 1}
                  style={{
                    padding: 32, borderRadius: T.radiusLg,
                    background: T.white, border: `1px solid ${T.gray100}`,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: item.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", marginBottom: 16,
                  }}>
                    <Icon size={22} color={item.color} strokeWidth={2} />
                  </div>
                  <h3 style={{
                    fontFamily: T.fontSans, fontSize: 18, fontWeight: 700,
                    color: T.navy, marginBottom: 8,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 14, color: T.gray500,
                    lineHeight: 1.6, marginBottom: 12,
                  }}>
                    {item.desc}
                  </p>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
                    fontStyle: "italic",
                  }}>
                    {item.cite}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TWO PATHS ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 100, paddingBottom: 100, background: T.white }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: VC.prudence.main, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              Two Paths
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}>
              Your family. Your journey. Your choice.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Story Forge card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              style={{
                padding: 32, borderRadius: T.radiusLg,
                background: T.white, border: `1px solid ${T.gray100}`,
                display: "flex", flexDirection: "column",
              }}
            >
              <span style={{
                fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                color: VC.courage.main, textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: 12,
              }}>
                AI-Powered
              </span>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 24, fontWeight: 700,
                color: T.navy, marginBottom: 10,
              }}>
                Generate Personalized Stories
              </h3>
              <p style={{
                fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
                lineHeight: 1.6, marginBottom: 20,
              }}>
                Tell us your child&apos;s name, age, and what they&apos;re facing. Our AI writes an original story
                in the classical tradition &mdash; starring themes your child needs right now.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {["Personalized to your child", "Aligned to classical virtues", "Discussion guide included", "Print or share"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={14} color={VC.courage.main} strokeWidth={3} />
                    <span style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray600 }}>{item}</span>
                  </div>
                ))}
              </div>
              <StoryForgeMockup />
              <button onClick={() => onNavigate ? onNavigate("stories") : onStart()} style={{
                marginTop: 20, padding: "12px 24px", borderRadius: T.radiusSm,
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                background: T.navy, color: T.white, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Pen size={16} />
                Try Story Forge
              </button>
            </motion.div>

            {/* Book Explorer card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={2}
              style={{
                padding: 32, borderRadius: T.radiusLg,
                background: T.white, border: `1px solid ${T.gray100}`,
                display: "flex", flexDirection: "column",
              }}
            >
              <span style={{
                fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                color: VC.prudence.main, textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: 12,
              }}>
                Hand-Curated
              </span>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 24, fontWeight: 700,
                color: T.navy, marginBottom: 10,
              }}>
                Discover History&apos;s Best Books
              </h3>
              <p style={{
                fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
                lineHeight: 1.6, marginBottom: 20,
              }}>
                57+ books spanning 2,600 years &mdash; from Aesop&apos;s Fables to modern classics.
                Hand-selected for moral clarity, then mapped to specific virtues and reading levels.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {["57+ curated books", "Mapped to 16 virtues", "Reading level matched", "Free & Amazon links"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={14} color={VC.prudence.main} strokeWidth={3} />
                    <span style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray600 }}>{item}</span>
                  </div>
                ))}
              </div>
              <BookExplorerMockup />
              <button onClick={() => onNavigate ? onNavigate("books") : onStart()} style={{
                marginTop: 20, padding: "12px 24px", borderRadius: T.radiusSm,
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                background: T.white, color: T.navy, border: `2px solid ${T.navy}`,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <BookOpen size={16} />
                Explore Library
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <WaveDivider color={T.navy} />

      {/* ═══ TYPING STORY DEMO ═══ */}
      <TypingStoryDemo onTryStoryForge={() => onNavigate ? onNavigate("stories") : onStart()} />

      <WaveDivider color={T.bg} />

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 100, paddingBottom: 100, background: T.bg }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: VC.prudence.main, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              How It Works
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em", marginBottom: 16,
            }}>
              A complete system for character formation
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 17, color: T.gray500,
              lineHeight: 1.7, maxWidth: 640, margin: "0 auto",
            }}>
              Bedtime Virtues gives your family two powerful paths to build character through story &mdash;
              plus the tools to track growth over time.
            </p>
          </motion.div>

          {/* ── Phase 1: Start ── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            style={{ marginBottom: 48 }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: T.navy,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 800, color: T.white,
              }}>1</div>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 20, fontWeight: 700, color: T.navy, margin: 0,
              }}>
                Set up your family profile
              </h3>
            </div>
            <div style={{
              padding: 28, borderRadius: T.radiusLg, background: T.white,
              border: `1px solid ${T.gray100}`,
            }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { icon: Users, title: "Add your children", desc: "Names, ages, and reading levels so every recommendation fits." },
                  { icon: Heart, title: "Choose focus virtues", desc: "Take a 2-minute guided quiz or pick from 16 classical virtues rooted in Aristotle." },
                  { icon: BarChart3, title: "Get your Virtue Compass", desc: "A personalized dashboard that maps your family\u2019s character-building journey." },
                ].map((item, i) => {
                  const StepIcon = item.icon;
                  return (
                    <div key={i} style={{ display: "flex", gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${VC.prudence.main}10`, display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <StepIcon size={20} color={VC.prudence.main} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 15, fontWeight: 700,
                          color: T.navy, marginBottom: 4,
                        }}>{item.title}</div>
                        <p style={{
                          fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
                          lineHeight: 1.5, margin: 0,
                        }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Phase 2: Two Paths ── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={2}
            style={{ marginBottom: 48 }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: T.navy,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 800, color: T.white,
              }}>2</div>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 20, fontWeight: 700, color: T.navy, margin: 0,
              }}>
                Choose your path &mdash; or use both
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Path A: Story Forge */}
              <div style={{
                padding: 28, borderRadius: T.radiusLg, background: T.white,
                border: `1px solid ${T.gray100}`,
                borderTop: `3px solid ${VC.courage.main}`,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${VC.courage.main}12`, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={18} color={VC.courage.main} />
                  </div>
                  <div>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                      color: VC.courage.main, textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>Path A &middot; AI-Powered</span>
                    <h4 style={{
                      fontFamily: T.fontSans, fontSize: 18, fontWeight: 700,
                      color: T.navy, margin: 0,
                    }}>Story Forge</h4>
                  </div>
                </div>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 14, color: T.gray500,
                  lineHeight: 1.6, marginBottom: 16,
                }}>
                  Tell us your child&apos;s name, age, and what they&apos;re going through.
                  Our AI writes an original bedtime story in the classical tradition &mdash;
                  starring themes your child needs <em>right now</em>.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["Personalized to your child\u2019s real life", "Targets specific virtues you choose", "Includes a parent discussion guide", "Print, save, or share as PDF"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={13} color={VC.courage.main} strokeWidth={3} />
                      <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.gray600 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Path B: Book Explorer */}
              <div style={{
                padding: 28, borderRadius: T.radiusLg, background: T.white,
                border: `1px solid ${T.gray100}`,
                borderTop: `3px solid ${VC.prudence.main}`,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${VC.prudence.main}12`, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <BookMarked size={18} color={VC.prudence.main} />
                  </div>
                  <div>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                      color: VC.prudence.main, textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>Path B &middot; Hand-Curated</span>
                    <h4 style={{
                      fontFamily: T.fontSans, fontSize: 18, fontWeight: 700,
                      color: T.navy, margin: 0,
                    }}>Book Explorer</h4>
                  </div>
                </div>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 14, color: T.gray500,
                  lineHeight: 1.6, marginBottom: 16,
                }}>
                  Browse 57+ books spanning 2,600 years &mdash; from Aesop&apos;s Fables to modern classics.
                  Every title hand-selected for moral clarity, then mapped to specific virtues
                  and reading levels.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["57+ classics from Aesop to C.S. Lewis", "Mapped to 16 virtues with sub-traits", "Filtered by your child\u2019s reading level", "Free downloads + Amazon links"].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={13} color={VC.prudence.main} strokeWidth={3} />
                      <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.gray600 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Phase 3: Read & Grow ── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={3}
            style={{ marginBottom: 48 }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: T.navy,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 800, color: T.white,
              }}>3</div>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 20, fontWeight: 700, color: T.navy, margin: 0,
              }}>
                Read together &amp; build the habit
              </h3>
            </div>
            <div style={{
              padding: 28, borderRadius: T.radiusLg, background: T.white,
              border: `1px solid ${T.gray100}`,
            }}>
              <p style={{
                fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
                lineHeight: 1.7, marginBottom: 20, maxWidth: 700,
              }}>
                Each story becomes a conversation. Every book is paired with discussion prompts
                designed to help your child connect the virtue to their own life. This is the
                Aristotelian cycle in action:
              </p>
              {/* Desktop: horizontal with arrows */}
              <div className="hidden sm:grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {[
                  { icon: BookOpen, label: "Story", desc: "Encounter virtue in narrative" },
                  { icon: Sparkles, label: "Imagination", desc: "See themselves as the hero" },
                  { icon: RefreshCw, label: "Habituation", desc: "Daily practice builds habit" },
                  { icon: Shield, label: "Virtue", desc: "Habit becomes character" },
                  { icon: Sun, label: "Flourishing", desc: "Character enables a good life" },
                ].map((step, i, arr) => {
                  const CycleIcon = step.icon;
                  return (
                    <div key={i} style={{ textAlign: "center", position: "relative" }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: T.goldSubtle, display: "flex", alignItems: "center",
                        justifyContent: "center", margin: "0 auto 10px",
                        border: `1px solid ${T.gold}30`,
                      }}>
                        <CycleIcon size={22} color={T.gold} strokeWidth={2} />
                      </div>
                      <div style={{
                        fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                        color: T.navy, marginBottom: 2,
                      }}>{step.label}</div>
                      <p style={{
                        fontFamily: T.fontSans, fontSize: 11, color: T.gray400,
                        lineHeight: 1.4, margin: 0,
                      }}>{step.desc}</p>
                      {i < arr.length - 1 && (
                        <div style={{
                          position: "absolute", right: -12, top: 20,
                          color: T.gold,
                        }}>
                          <ArrowRight size={18} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Mobile: vertical list */}
              <div className="flex sm:hidden flex-col gap-3">
                {[
                  { icon: BookOpen, label: "Story", desc: "Encounter virtue in narrative" },
                  { icon: Sparkles, label: "Imagination", desc: "See themselves as the hero" },
                  { icon: RefreshCw, label: "Habituation", desc: "Daily practice builds habit" },
                  { icon: Shield, label: "Virtue", desc: "Habit becomes character" },
                  { icon: Sun, label: "Flourishing", desc: "Character enables a good life" },
                ].map((step, i) => {
                  const CycleIcon = step.icon;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: T.goldSubtle, display: "flex", alignItems: "center",
                        justifyContent: "center", border: `1px solid ${T.gold}30`,
                      }}>
                        <CycleIcon size={18} color={T.gold} strokeWidth={2} />
                      </div>
                      <div>
                        <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.navy }}>{step.label}</span>
                        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.gray400, marginLeft: 6 }}>{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Phase 4: Track Progress ── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={4}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: T.navy,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 800, color: T.white,
              }}>4</div>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 20, fontWeight: 700, color: T.navy, margin: 0,
              }}>
                Watch character grow
              </h3>
            </div>
            <div style={{
              padding: 28, borderRadius: T.radiusLg, background: T.white,
              border: `1px solid ${T.gray100}`,
            }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { icon: BarChart3, title: "Virtue Compass", desc: "A visual dashboard tracks which virtues your family has explored and where to go next.", color: VC.justice.main },
                  { icon: TrendingUp, title: "Spot gaps early", desc: "See which virtues are underserved. Get smart recommendations to fill them.", color: VC.courage.main },
                  { icon: Star, title: "Celebrate milestones", desc: "Mark favorites, track reading streaks, and watch the compass fill over time.", color: T.gold },
                ].map((item, i) => {
                  const TrackIcon = item.icon;
                  return (
                    <div key={i} style={{ display: "flex", gap: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${item.color}12`, display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <TrackIcon size={20} color={item.color} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 15, fontWeight: 700,
                          color: T.navy, marginBottom: 4,
                        }}>{item.title}</div>
                        <p style={{
                          fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
                          lineHeight: 1.5, margin: 0,
                        }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ THE FOUR VIRTUES ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 100, paddingBottom: 100, background: T.white }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              The Framework
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}>
              Four pillars of human excellence
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4" style={{
            gap: 20,
          }}>
            {Object.entries(VIRTUES).map(([key, virtue], i) => {
              const vc = VC[key as keyof typeof VC];
              const virtueImg = VIRTUE_IMAGES[key];
              return (
                <motion.div
                  key={key}
                  className="card-lift"
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i + 1}
                  style={{
                    padding: 32, borderRadius: T.radiusLg,
                    background: vc.light, border: `1px solid ${vc.main}15`,
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: 100, height: 100, borderRadius: 20, overflow: "hidden",
                    margin: "0 auto 20px", boxShadow: T.shadow,
                    border: `3px solid ${vc.main}30`,
                  }}>
                    {virtueImg && (
                      <Image
                        src={virtueImg.src}
                        alt={virtueImg.alt}
                        width={400}
                        height={400}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: T.fontSans, fontSize: 20, fontWeight: 700,
                    color: vc.dark, marginBottom: 4,
                  }}>
                    {virtue.name}
                  </h3>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
                    fontStyle: "italic", marginBottom: 12,
                  }}>
                    {virtue.latin}
                  </p>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 14, color: T.gray600,
                    lineHeight: 1.5, marginBottom: 16,
                  }}>
                    {virtue.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                    {virtue.subVirtues.map((sv) => (
                      <span key={sv.id} style={{
                        fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                        padding: "4px 10px", borderRadius: 100,
                        background: T.white, color: vc.main,
                        border: `1px solid ${vc.main}25`,
                      }}>
                        {sv.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PRICING PREVIEW ═══ */}
      <section id="pricing" className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 100, paddingBottom: 100, background: T.bg }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              Pricing
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em", marginBottom: 12,
            }}>
              Start free. Upgrade when you&apos;re ready.
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 18, color: T.gray500,
              lineHeight: 1.6,
            }}>
              Everything you need to get started is free. Premium unlocks unlimited stories and profiles.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free Tier */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              style={{
                padding: 32, borderRadius: T.radiusLg,
                background: T.white, border: `1px solid ${T.gray200}`,
              }}
            >
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 22, fontWeight: 700,
                color: T.navy, marginBottom: 4,
              }}>Free</h3>
              <div style={{
                fontFamily: T.fontSans, fontSize: 36, fontWeight: 800,
                color: T.navy, marginBottom: 4,
              }}>
                $0<span style={{ fontSize: 16, fontWeight: 500, color: T.gray400 }}>/month</span>
              </div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 14, color: T.gray500,
                marginBottom: 24,
              }}>
                Perfect for getting started
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PLANS.free.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Check size={16} color={T.green} strokeWidth={3} />
                    <span style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray700 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onStart} style={{
                width: "100%", marginTop: 24, padding: "12px 20px",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                color: T.navy, background: T.white, border: `2px solid ${T.gray200}`,
                borderRadius: T.radiusSm, cursor: "pointer",
              }}>
                Get Started Free
              </button>
            </motion.div>

            {/* Premium Tier */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={2}
              style={{
                padding: 32, borderRadius: T.radiusLg,
                background: T.navy, color: T.white,
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 16, right: 16,
                padding: "4px 12px", borderRadius: 100,
                background: T.gold, fontFamily: T.fontSans,
                fontSize: 11, fontWeight: 700, color: T.navy,
              }}>
                POPULAR
              </div>
              <h3 style={{
                fontFamily: T.fontSans, fontSize: 22, fontWeight: 700,
                marginBottom: 4,
              }}>Premium</h3>
              <div style={{
                fontFamily: T.fontSans, fontSize: 36, fontWeight: 800,
                marginBottom: 4,
              }}>
                ${PLANS.premium.monthlyPrice}<span style={{ fontSize: 16, fontWeight: 500, color: T.gray400 }}>/month</span>
              </div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 14, color: T.gray400,
                marginBottom: 24,
              }}>
                or ${PLANS.premium.yearlyPrice}/year (save {Math.round((1 - PLANS.premium.yearlyPrice / (PLANS.premium.monthlyPrice * 12)) * 100)}%)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PLANS.premium.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Check size={16} color={T.gold} strokeWidth={3} />
                    <span style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray200 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onPricing} style={{
                width: "100%", marginTop: 24, padding: "12px 20px",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                color: T.navy, background: T.gold, border: "none",
                borderRadius: T.radiusSm, cursor: "pointer",
              }}>
                Upgrade to Premium
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 80, paddingBottom: 80, background: T.white }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}>
              What families are saying
            </h2>
          </motion.div>
          <SocialProof />
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 80, paddingBottom: 80, background: T.bg }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gold, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              FAQ
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}>
              Common questions
            </h2>
          </motion.div>
          <FAQ />
        </div>
      </section>

      {/* ═══ EMAIL CAPTURE ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{ paddingTop: 80, paddingBottom: 80, background: T.white }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <EmailCapture />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-6 sm:px-8 md:px-10" style={{
        paddingTop: 100, paddingBottom: 100, background: T.bg, textAlign: "center",
      }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <h2 style={{
            fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 800, color: T.navy, lineHeight: 1.15,
            letterSpacing: "-0.02em", marginBottom: 16,
          }}>
            Your child&apos;s character story<br />starts tonight.
          </h2>
          <p style={{
            fontFamily: T.fontSans, fontSize: 18, color: T.gray500,
            lineHeight: 1.6, marginBottom: 32,
          }}>
            Join families who are using the world&apos;s oldest wisdom to raise children of courage, wisdom, justice, and self-mastery.
          </p>
          <div className="flex flex-col sm:flex-row gap-3" style={{ justifyContent: "center", alignItems: "center" }}>
            <button className="cta-glow" onClick={() => onNavigate ? onNavigate("stories") : onStart()} style={{
              fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
              color: T.gold, background: T.navy, border: "none", cursor: "pointer",
              padding: "16px 36px", borderRadius: T.radiusSm,
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(10,22,40,0.3)",
            }}>
              <Pen size={18} />
              Generate a Story
            </button>
            <button className="card-lift" onClick={() => onNavigate ? onNavigate("books") : onStart()} style={{
              fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
              color: T.navy, background: T.white, border: `2px solid ${T.navy}`,
              cursor: "pointer", padding: "14px 36px", borderRadius: T.radiusSm,
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <BookOpen size={18} />
              Explore Books
            </button>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 sm:px-8 md:px-10" style={{
        paddingTop: 48, paddingBottom: 48, borderTop: `1px solid ${T.gray100}`,
        background: T.navy,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="flex flex-col md:flex-row gap-8 md:gap-16" style={{ marginBottom: 32 }}>
            {/* Brand */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: T.fontSans, fontSize: 16, fontWeight: 700, color: T.white,
                marginBottom: 12,
              }}>
                <Shield size={18} color={T.gold} />
                Bedtime Virtues
              </div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
                lineHeight: 1.6, maxWidth: 280,
              }}>
                Building character through story. Personalized AI bedtime stories and 57+ hand-curated classics
                mapped to classical virtues.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div>
                <h4 style={{
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                  color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
                  marginBottom: 12,
                }}>Product</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Story Studio", action: () => onNavigate ? onNavigate("stories") : onStart() },
                    { label: "Book Library", action: () => onNavigate ? onNavigate("books") : onStart() },
                    { label: "Pricing", action: onPricing },
                  ].map((link) => (
                    <button key={link.label} onClick={link.action} style={{
                      fontFamily: T.fontSans, fontSize: 13, color: T.gray300,
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", padding: 0,
                    }}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                  color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
                  marginBottom: 12,
                }}>Legal</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Privacy Policy", action: () => onNavigate?.("privacy") },
                    { label: "Terms of Service", action: () => onNavigate?.("terms") },
                  ].map((link) => (
                    <button key={link.label} onClick={link.action} style={{
                      fontFamily: T.fontSans, fontSize: 13, color: T.gray300,
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", padding: 0,
                    }}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                  color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
                  marginBottom: 12,
                }}>Contact</h4>
                <a href="mailto:hello@bedtimevirtues.com" style={{
                  fontFamily: T.fontSans, fontSize: 13, color: T.gray300,
                  textDecoration: "none",
                }}>
                  hello@bedtimevirtues.com
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter inline */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
            gap: 16, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 20,
          }}>
            <p style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
            }}>
              Get weekly virtue stories &amp; reading ideas
            </p>
            <EmailCapture variant="inline" />
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center" style={{
            justifyContent: "space-between",
            paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)",
          }}>
            <p style={{
              fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
            }}>
              &copy; 2026 Bedtime Virtues. All rights reserved.
              Bedtime Virtues is a participant in the Amazon Services LLC Associates Program
              and the Bookshop.org Affiliate Program.
            </p>
            <p style={{
              fontFamily: T.fontSerif, fontSize: 13, color: T.gray500,
              fontStyle: "italic",
            }}>
              &ldquo;We are what we repeatedly do.&rdquo; &mdash; Aristotle
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
