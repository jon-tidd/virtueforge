"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pen, Lock, Crown, FileText, Copy, Mail, Sparkles, MessageCircle, Users } from "lucide-react";
import { VIRTUES, getSubVirtue, getVirtueParent, type AppData } from "@/lib/data";
import type { DemoScenario } from "@/components/landing/LandingPage";
import { T, VC, PLANS } from "@/lib/tokens";
import { getMonthlyStoryCount, incrementStoryCount } from "@/lib/storage";

export default function StoryForge({ appData, selChild, setSelChild, premium, onPricing, demoScenario, onDemoConsumed }: {
  appData: AppData;
  selChild: number;
  setSelChild: (i: number) => void;
  premium: boolean;
  onPricing: () => void;
  demoScenario?: DemoScenario | null;
  onDemoConsumed?: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [story, setStory] = useState<{
    title: string;
    body: string;
    discussionQuestions: string[];
    familyActivity: string;
    virtueTag: string;
  } | null>(null);
  const [selectedVirtue, setSelectedVirtue] = useState("");
  const [customSituation, setCustomSituation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const child = appData.children[selChild];
  const hasChildren = appData.children.length > 0;
  const monthlyCount = getMonthlyStoryCount();
  const atLimit = !premium && monthlyCount >= PLANS.free.stories;

  // Pre-fill from demo scenario
  useEffect(() => {
    if (demoScenario) {
      setSelectedVirtue(demoScenario.virtue);
      setCustomSituation(demoScenario.situation);
      onDemoConsumed?.();
    }
  }, [demoScenario]);

  const generateStory = async () => {
    if (!selectedVirtue || !child) return;
    if (atLimit) { onPricing(); return; }

    setGenerating(true);
    setError(null);
    setStory(null);
    setCopied(false);

    const sv = getSubVirtue(selectedVirtue);
    const pk = getVirtueParent(selectedVirtue);
    const pv = pk ? VIRTUES[pk] : null;
    if (!sv || !pv) { setError("Invalid virtue."); setGenerating(false); return; }

    const ageLabel = child.age <= 4 ? "a very young child (ages 2-4)" :
      child.age <= 7 ? "a young child (ages 5-7)" :
      child.age <= 10 ? "a child (ages 8-10)" : "an older child (ages 11-13)";

    const prompt = `You are a master storyteller in the tradition of Aesop, the Brothers Grimm, and C.S. Lewis. Write an original children's story that teaches the virtue of ${sv.name} (${sv.desc}), which falls under the cardinal virtue of ${pv.name}.

The story is for ${child.name}, ${ageLabel}, who is ${child.sex === "boy" ? "a boy" : "a girl"}.
Reading level: ${child.readingLevel}.
${customSituation ? `The child is currently dealing with: ${customSituation}. Weave this theme naturally into the story.` : ""}

Requirements:
- ${child.age <= 5 ? "300-500" : child.age <= 8 ? "500-800" : "800-1200"} words
- Vivid, memorable characters and settings
- The moral emerges naturally, never stated explicitly
- Show virtue practiced through action and habit
- Rich, beautiful language for the reading level
- Include a compelling title
- Classical storytelling tradition
- No modern ideology or didactic lecturing

Format: Title on first line, then the story. After the story, include a discussion guide separated by the exact delimiter "---DISCUSSION_GUIDE---" on its own line. The discussion guide should have:
Q1: [A thought-provoking question about the story for parent-child discussion]
Q2: [A question connecting the virtue to the child's real life]
Q3: [A deeper question about character and choices]
ACTIVITY: [A simple, fun family activity (5-10 minutes) that practices the virtue from the story]`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else if (data.text) {
        const parts = data.text.split("---DISCUSSION_GUIDE---");
        const storyText = parts[0].trim();
        const lines = storyText.split("\n");
        const title = lines[0].replace(/^#+\s*/, "").replace(/^\*+/, "").replace(/\*+$/, "").trim();
        const body = lines.slice(1).join("\n").trim();

        // Parse discussion guide (defensive — works without it)
        let discussionQuestions: string[] = [];
        let familyActivity = "";
        if (parts[1]) {
          const guideLines = parts[1].trim().split("\n");
          for (const line of guideLines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("Q1:") || trimmed.startsWith("Q2:") || trimmed.startsWith("Q3:")) {
              discussionQuestions.push(trimmed.replace(/^Q\d:\s*/, ""));
            } else if (trimmed.startsWith("ACTIVITY:")) {
              familyActivity = trimmed.replace(/^ACTIVITY:\s*/, "");
            }
          }
        }

        setStory({
          title, body, discussionQuestions, familyActivity,
          virtueTag: sv?.name || "",
        });
        incrementStoryCount();
      } else setError("No story generated. Try again.");
    } catch { setError("Failed to connect. Check your internet connection."); }
    setGenerating(false);
  };

  const exportPDF = () => {
    if (!story || !child) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${story.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap');
        body { font-family: 'Crimson Text', Georgia, serif; max-width: 650px; margin: 40px auto; padding: 40px; color: #1F2937; line-height: 1.9; }
        h1 { text-align: center; font-size: 28px; color: #0A1628; border-bottom: 3px solid #D4A846; padding-bottom: 16px; margin-bottom: 24px; }
        .meta { text-align: center; font-size: 14px; color: #9CA3AF; margin-bottom: 32px; }
        p { font-size: 17px; margin-bottom: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #D1D5DB; border-top: 1px solid #E5E7EB; padding-top: 16px; }
      </style>
    </head><body>
      <h1>${story.title}</h1>
      <div class="meta">A story for ${child.name} · Generated by Virtue Forge</div>
      ${story.body.split("\n\n").map((p: string) => `<p>${p}</p>`).join("")}
      ${story.discussionQuestions.length > 0 ? `
      <div style="margin-top: 40px; padding: 24px; border: 2px solid #D4A846; border-radius: 12px; background: #FFFBEB;">
        <h2 style="font-size: 20px; color: #0A1628; margin-bottom: 16px; font-family: Inter, sans-serif;">Discussion Guide</h2>
        ${story.virtueTag ? `<div style="display: inline-block; padding: 4px 12px; border-radius: 100px; background: #D4A84620; color: #D4A846; font-size: 13px; font-weight: 600; margin-bottom: 16px; font-family: Inter, sans-serif;">${story.virtueTag}</div>` : ""}
        <ol style="padding-left: 20px;">
          ${story.discussionQuestions.map((q: string) => `<li style="margin-bottom: 12px; font-size: 16px;">${q}</li>`).join("")}
        </ol>
        ${story.familyActivity ? `<div style="margin-top: 16px; padding: 16px; background: #D4A84615; border-radius: 8px;">
          <strong style="font-family: Inter, sans-serif; font-size: 14px; color: #0A1628;">Family Activity:</strong>
          <p style="font-size: 15px; margin-top: 4px;">${story.familyActivity}</p>
        </div>` : ""}
      </div>
      ` : ""}
      <div class="footer">Virtue Forge — Building Character Through Story · virtueforge.vercel.app</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: T.radiusSm,
    border: `1px solid ${T.gray200}`, fontFamily: T.fontSans, fontSize: 14,
    color: T.gray800, background: T.white, outline: "none",
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
          The Story Forge
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          Generate original stories tailored to your child&apos;s virtue journey.
          {!premium && ` ${PLANS.free.stories - monthlyCount} of ${PLANS.free.stories} free stories remaining this month.`}
        </p>
      </div>

      {!hasChildren ? (
        <div style={{
          padding: 40, borderRadius: T.radius, background: T.white,
          border: `1px solid ${T.gray100}`, textAlign: "center",
        }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 15, color: T.gray500, marginBottom: 16 }}>
            Add your children first to generate personalized stories.
          </p>
        </div>
      ) : (
        <>
          {/* Child selector */}
          {appData.children.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
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

          {/* Story Generator Form */}
          <div style={{
            padding: 28, borderRadius: T.radius, background: T.white,
            border: `1px solid ${T.gray100}`, marginBottom: 20,
          }}>
            <div style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
              marginBottom: 20,
            }}>
              Creating for <strong style={{ color: T.navy }}>{child?.name}</strong> (age {child?.age})
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: "block", fontFamily: T.fontSans, fontSize: 14,
                fontWeight: 600, color: T.navy, marginBottom: 6,
              }}>
                Which virtue should this story teach?
              </label>
              <select value={selectedVirtue} onChange={(e) => setSelectedVirtue(e.target.value)} style={inputStyle}>
                <option value="">Choose a virtue...</option>
                {Object.entries(VIRTUES).map(([key, v]) => (
                  <optgroup key={key} label={v.name}>
                    {v.subVirtues.map((sv) => (
                      <option key={sv.id} value={sv.id}>{sv.name} — {sv.desc}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontFamily: T.fontSans, fontSize: 14,
                fontWeight: 600, color: T.navy, marginBottom: 6,
              }}>
                Specific situation <span style={{ fontWeight: 400, color: T.gray400 }}>(optional)</span>
              </label>
              <input
                value={customSituation}
                onChange={(e) => setCustomSituation(e.target.value)}
                placeholder="e.g., struggling to share with a new sibling"
                style={inputStyle}
              />
            </div>

            {atLimit ? (
              <button onClick={onPricing} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: T.radiusSm,
                background: T.navy, color: T.gold, border: "none",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}>
                <Crown size={16} />
                Upgrade for Unlimited Stories
              </button>
            ) : (
              <button
                onClick={generateStory}
                disabled={!selectedVirtue || generating}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: T.radiusSm,
                  background: (!selectedVirtue || generating) ? T.gray200 : T.navy,
                  color: (!selectedVirtue || generating) ? T.gray400 : T.gold,
                  border: "none", cursor: (!selectedVirtue || generating) ? "default" : "pointer",
                  fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                }}
              >
                {generating ? (
                  <>
                    <Sparkles size={16} className="animate-pulse-subtle" />
                    Forging story...
                  </>
                ) : (
                  <>
                    <Pen size={16} />
                    Forge Story
                  </>
                )}
              </button>
            )}

            {error && (
              <div style={{
                marginTop: 14, padding: 12, borderRadius: T.radiusSm,
                background: T.redLight, border: `1px solid ${T.red}20`,
                fontFamily: T.fontSans, fontSize: 14, color: T.red,
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Generated Story */}
          {story && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Story Display */}
              <div className="p-5 md:p-10" style={{
                borderRadius: T.radiusLg, background: T.white,
                border: `1px solid ${T.gold}30`, boxShadow: T.shadowLg,
                marginBottom: 16,
              }}>
                <h2 style={{
                  fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700,
                  color: T.navy, textAlign: "center", marginBottom: 8,
                }}>
                  {story.title}
                </h2>
                <div style={{
                  textAlign: "center", fontFamily: T.fontSans, fontSize: 13,
                  color: T.gray400, marginBottom: 32,
                  paddingBottom: 24, borderBottom: `2px solid ${T.gold}40`,
                }}>
                  A story for {child?.name} · by Virtue Forge
                </div>
                <div style={{
                  fontFamily: T.fontSerif, fontSize: 18, lineHeight: 1.9,
                  color: T.gray800, whiteSpace: "pre-wrap",
                }}>
                  {story.body}
                </div>
              </div>

              {/* Discussion Guide */}
              {story.discussionQuestions.length > 0 && (
                <div style={{
                  padding: 24, borderRadius: T.radiusLg,
                  background: T.goldSubtle, border: `2px solid ${T.gold}30`,
                  marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <MessageCircle size={20} color={T.gold} />
                    <h3 style={{
                      fontFamily: T.fontSans, fontSize: 18, fontWeight: 700,
                      color: T.navy,
                    }}>Discussion Guide</h3>
                    {story.virtueTag && (
                      <span style={{
                        fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 100,
                        background: T.gold + "20", color: T.gold,
                      }}>
                        {story.virtueTag}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {story.discussionQuestions.map((q, i) => (
                      <div key={i} style={{
                        padding: 16, borderRadius: T.radius,
                        background: T.white, border: `1px solid ${T.gray100}`,
                      }}>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
                          color: T.gold, marginBottom: 6,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          Question {i + 1}
                        </div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 15, color: T.gray800,
                          lineHeight: 1.5,
                        }}>
                          {q}
                        </div>
                      </div>
                    ))}
                  </div>

                  {story.familyActivity && (
                    <div style={{
                      marginTop: 12, padding: 16, borderRadius: T.radius,
                      background: T.gold + "15", border: `1px solid ${T.gold}30`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Users size={16} color={T.gold} />
                        <span style={{
                          fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                          color: T.gold, textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          Family Activity
                        </span>
                      </div>
                      <div style={{
                        fontFamily: T.fontSans, fontSize: 15, color: T.gray800,
                        lineHeight: 1.5,
                      }}>
                        {story.familyActivity}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Export controls */}
              <div style={{
                display: "flex", gap: 10, flexWrap: "wrap",
                padding: 16, borderRadius: T.radius, background: T.gray50,
                border: `1px solid ${T.gray100}`,
              }}>
                <button onClick={exportPDF} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: T.radiusSm,
                  background: T.navy, color: T.white, border: "none",
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}>
                  <FileText size={14} />
                  Save as PDF
                </button>
                <button onClick={() => {
                  if (story) {
                    navigator.clipboard.writeText(`${story.title}\n\n${story.body}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: T.radiusSm,
                  background: T.white, color: T.gray700,
                  border: `1px solid ${T.gray200}`,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}>
                  <Copy size={14} />
                  {copied ? "Copied!" : "Copy Text"}
                </button>
                <button onClick={() => {
                  if (story && child) {
                    const subject = encodeURIComponent(`Story for ${child.name}: ${story.title}`);
                    const body = encodeURIComponent(`${story.title}\n\nA story for ${child.name}, generated by Virtue Forge.\n\n${story.body}\n\n---\nVirtue Forge — Building Character Through Story\nvirtueforge.vercel.app`);
                    window.open(`mailto:?subject=${subject}&body=${body}`);
                  }
                }} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: T.radiusSm,
                  background: T.white, color: T.gray700,
                  border: `1px solid ${T.gray200}`,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}>
                  <Mail size={14} />
                  Email Story
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
