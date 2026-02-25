"use client";
import { motion } from "framer-motion";
import {
  BookOpen, Shield, Sparkles, ChevronRight, ArrowRight,
  Brain, Heart, Flame, TreePine, Star, Users, TrendingUp,
  BookMarked, Pen, BarChart3, Zap, Check
} from "lucide-react";
import { VIRTUES } from "@/lib/data";
import { T, VC, PLANS } from "@/lib/tokens";

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

const RESEARCH_STATS = [
  {
    number: "90th",
    label: "percentile",
    desc: "Children who read 20 minutes daily score in the 90th percentile on standardized tests.",
    source: "Anderson, Wilson & Fielding",
    color: VC.prudence.main,
    bg: VC.prudence.light,
  },
  {
    number: "11",
    label: "point gain",
    desc: "Social-emotional learning programs produce an 11-percentile-point academic gain — across 270,034 students.",
    source: "Durlak et al., CASEL Meta-Analysis",
    color: VC.justice.main,
    bg: VC.justice.light,
  },
  {
    number: "72.6%",
    label: "fewer suspensions",
    desc: "Schools with character education saw suspensions drop 72.6% and math scores rise 51.4%.",
    source: "Berkowitz & Bier, Journal of Character Ed.",
    color: VC.courage.main,
    bg: VC.courage.light,
  },
  {
    number: "1 in 3",
    label: "families read nightly",
    desc: "Down from 2 in 3 a decade ago. The bedtime story is disappearing — and character suffers.",
    source: "Scholastic Kids & Family Reading Report",
    color: VC.temperance.main,
    bg: VC.temperance.light,
  },
];

const STEPS = [
  {
    icon: Heart,
    title: "Choose your family's virtues",
    desc: "Take a 2-minute guided quiz or select from 16 classical virtues rooted in Aristotelian philosophy.",
  },
  {
    icon: BookOpen,
    title: "Get matched with great stories",
    desc: "57+ hand-curated books mapped to specific virtues and your child's reading level. Plus AI-generated stories for any situation.",
  },
  {
    icon: Shield,
    title: "Watch character grow",
    desc: "Track your family's virtue journey with a visual shield that fills as you read together. Spot gaps. Celebrate progress.",
  },
];

export default function LandingPage({ onStart, onPricing, hasAccount }: {
  onStart: () => void;
  onPricing: () => void;
  hasAccount: boolean;
}) {
  return (
    <div style={{ background: T.white, minHeight: "100vh" }}>
      {/* ═══ NAV BAR ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.gray100}`,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 64,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: T.fontSans, fontWeight: 700, fontSize: 18, color: T.navy,
          }}>
            <Shield size={22} strokeWidth={2.5} color={T.gold} />
            Virtue Forge
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#science" style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
              color: T.gray600, textDecoration: "none",
            }}>Research</a>
            <a href="#how" style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
              color: T.gray600, textDecoration: "none",
            }}>How It Works</a>
            <button onClick={onPricing} style={{
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
      <section style={{
        padding: "100px 24px 80px", textAlign: "center", background: T.white,
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle gradient orbs */}
        <div style={{
          position: "absolute", top: -200, right: -200, width: 600, height: 600,
          borderRadius: "50%", background: `radial-gradient(circle, ${VC.prudence.light} 0%, transparent 70%)`,
          pointerEvents: "none", opacity: 0.5,
        }} />
        <div style={{
          position: "absolute", bottom: -200, left: -200, width: 500, height: 500,
          borderRadius: "50%", background: `radial-gradient(circle, ${T.goldSubtle} 0%, transparent 70%)`,
          pointerEvents: "none", opacity: 0.6,
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100, background: T.goldSubtle,
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.gold,
            marginBottom: 28, border: `1px solid ${T.gold}30`,
          }}>
            <Sparkles size={14} />
            Backed by 2,500 years of wisdom and modern research
          </div>

          <h1 style={{
            fontFamily: T.fontSans, fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800, color: T.navy, lineHeight: 1.08,
            letterSpacing: "-0.03em", marginBottom: 24,
          }}>
            Every great person was<br />
            once a child who heard<br />
            <span style={{ color: T.gold }}>the right story</span>
          </h1>

          <p style={{
            fontFamily: T.fontSans, fontSize: "clamp(17px, 2vw, 20px)",
            color: T.gray500, lineHeight: 1.6, maxWidth: 560, margin: "0 auto 40px",
          }}>
            Build your child&apos;s character through the world&apos;s oldest method — great stories.
            Curated books, AI-generated tales, and a virtue tracking system rooted in classical philosophy.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <button onClick={onStart} style={{
              fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
              color: T.white, background: T.navy, border: "none", cursor: "pointer",
              padding: "14px 32px", borderRadius: T.radiusSm,
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(10,22,40,0.3)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(10,22,40,0.35)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(10,22,40,0.3)"; }}
            >
              Start Building Character — Free
              <ArrowRight size={18} />
            </button>
          </div>

          <p style={{
            fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
            marginTop: 16,
          }}>
            Free forever. No credit card required.
          </p>
        </motion.div>
      </section>

      {/* ═══ THE CRISIS ═══ */}
      <section id="crisis" style={{
        padding: "80px 24px", background: T.navy, color: T.white,
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
              The Problem
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em",
              marginBottom: 20,
            }}>
              Character isn&apos;t inherited.<br />It&apos;s built.
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 18, color: T.gray300,
              lineHeight: 1.7, maxWidth: 640, margin: "0 auto 48px",
            }}>
              Screen time is up 50%. Only 1 in 3 families read bedtime stories nightly — down from 2 in 3 a decade ago.
              The habit that built every generation&apos;s moral imagination is vanishing.
            </p>
          </motion.div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}>
            {RESEARCH_STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                style={{
                  padding: 28, borderRadius: T.radiusLg,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  textAlign: "left",
                }}
              >
                <div style={{
                  fontFamily: T.fontSans, fontSize: 36, fontWeight: 800,
                  color: stat.color, lineHeight: 1,
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  color: T.gray400, textTransform: "uppercase", letterSpacing: "0.05em",
                  marginTop: 4, marginBottom: 12,
                }}>
                  {stat.label}
                </div>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 14, color: T.gray300,
                  lineHeight: 1.5, marginBottom: 12,
                }}>
                  {stat.desc}
                </p>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 11, color: T.gray500,
                  fontStyle: "italic",
                }}>
                  {stat.source}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" style={{ padding: "100px 24px", background: T.white }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
              letterSpacing: "-0.02em",
            }}>
              Three steps. One family tradition.
            </h2>
          </motion.div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 32,
          }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i + 1}
                  style={{ textAlign: "center" }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: T.bg, display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 20px",
                  }}>
                    <Icon size={28} color={T.navy} strokeWidth={1.5} />
                  </div>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                    color: T.gray400, marginBottom: 8,
                  }}>
                    STEP {i + 1}
                  </div>
                  <h3 style={{
                    fontFamily: T.fontSans, fontSize: 20, fontWeight: 700,
                    color: T.navy, marginBottom: 10,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
                    lineHeight: 1.6,
                  }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ THE SCIENCE ═══ */}
      <section id="science" style={{ padding: "100px 24px", background: T.bg }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: VC.courage.main, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              The Science
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em", marginBottom: 16,
            }}>
              Built on 2,500 years of wisdom.<br />Backed by modern research.
            </h2>
            <p style={{
              fontFamily: T.fontSans, fontSize: 18, color: T.gray500,
              lineHeight: 1.6, maxWidth: 600, margin: "0 auto",
            }}>
              Aristotle called it <em>hexis</em> — character formed through practice.
              Modern psychology calls it social-emotional learning. Both agree: stories are how children rehearse virtue before they encounter it in life.
            </p>
          </motion.div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
          }}>
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
                cite: "Neuroscience News / Cincinnati Children's Hospital",
                color: VC.justice.main, bg: VC.justice.light,
              },
              {
                icon: TrendingUp, title: "Academic Achievement",
                desc: "Children read to daily from age 1 score significantly higher in both reading and math by age 10 — regardless of family income.",
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

      {/* ═══ THE FOUR VIRTUES ═══ */}
      <section style={{ padding: "100px 24px", background: T.white }}>
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

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}>
            {Object.entries(VIRTUES).map(([key, virtue], i) => {
              const vc = VC[key as keyof typeof VC];
              const Icon = VIRTUE_ICONS[key];
              return (
                <motion.div
                  key={key}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i + 1}
                  style={{
                    padding: 32, borderRadius: T.radiusLg,
                    background: vc.light, border: `1px solid ${vc.main}15`,
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: T.white, display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 16px",
                    boxShadow: T.shadow,
                  }}>
                    <Icon size={26} color={vc.main} strokeWidth={2} />
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

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding: "100px 24px", background: T.bg }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: VC.temperance.main, letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 16,
            }}>
              Features
            </p>
            <h2 style={{
              fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800, color: T.navy, lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}>
              Everything you need to raise<br />children of character
            </h2>
          </motion.div>

          {[
            {
              icon: BookOpen, color: VC.prudence.main, bg: VC.prudence.light,
              title: "57+ hand-curated books, mapped to virtues",
              desc: "Every book in our library is selected for its moral clarity and literary quality — then tagged to specific virtues and reading levels. Find the perfect story in seconds. Amazon and free online links included.",
              tag: "Book Discovery",
            },
            {
              icon: Pen, color: VC.courage.main, bg: VC.courage.light,
              title: "AI stories tailored to your child's real struggles",
              desc: "Is your child dealing with a new sibling? Afraid of the dark? Struggling with honesty? The Story Forge creates original tales in the classical tradition — starring themes your child needs right now.",
              tag: "Story Forge",
            },
            {
              icon: BarChart3, color: VC.temperance.main, bg: VC.temperance.light,
              title: "Track your family's character growth",
              desc: "The Virtue Shield fills as you read together. See which virtues you've covered, spot the gaps, and celebrate milestones. Character isn't built in a day — it's built in the daily habit of reading.",
              tag: "Virtue Shield",
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
                style={{
                  display: "flex", gap: 32, alignItems: "flex-start",
                  padding: 40, borderRadius: T.radiusLg,
                  background: T.white, border: `1px solid ${T.gray100}`,
                  marginBottom: 20,
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: feature.bg, display: "flex", alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={26} color={feature.color} strokeWidth={2} />
                </div>
                <div>
                  <span style={{
                    fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                    color: feature.color, textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {feature.tag}
                  </span>
                  <h3 style={{
                    fontFamily: T.fontSans, fontSize: 22, fontWeight: 700,
                    color: T.navy, marginTop: 6, marginBottom: 10,
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
                    lineHeight: 1.6,
                  }}>
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ PRICING PREVIEW ═══ */}
      <section id="pricing" style={{ padding: "100px 24px", background: T.white }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Free Tier */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              style={{
                padding: 32, borderRadius: T.radiusLg,
                background: T.bg, border: `1px solid ${T.gray200}`,
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
                Start Premium Trial
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section style={{
        padding: "100px 24px", background: T.bg, textAlign: "center",
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
          <button onClick={onStart} style={{
            fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
            color: T.white, background: T.navy, border: "none", cursor: "pointer",
            padding: "16px 40px", borderRadius: T.radiusSm,
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 14px rgba(10,22,40,0.3)",
          }}>
            Begin Your Family&apos;s Quest
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: "40px 24px", borderTop: `1px solid ${T.gray100}`,
        background: T.white,
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.gray500,
          }}>
            <Shield size={16} color={T.gold} />
            Virtue Forge
          </div>
          <p style={{
            fontFamily: T.fontSerif, fontSize: 14, color: T.gray400,
            fontStyle: "italic",
          }}>
            &ldquo;We are what we repeatedly do.&rdquo; — Aristotle
          </p>
        </div>
      </footer>
    </div>
  );
}
