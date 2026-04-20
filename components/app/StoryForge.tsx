"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Pen, Crown, Copy, Mail, Sparkles, MessageCircle, Users,
  Info, Share2, Download, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import {
  VIRTUES, getSubVirtue, getVirtueParent, READING_LEVELS,
  getDefaultReadingLevel, type AppData, type ChildProfile,
} from "@/lib/data";
import type { DemoScenario } from "@/components/landing/LandingPage";
import { T, VC, PLANS } from "@/lib/tokens";
import { getMonthlyStoryCount, incrementStoryCount } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import ParentalConsentModal, { hasParentalConsent } from "@/components/ParentalConsentModal";

type StoryLength = "short" | "medium" | "long";

const LENGTH_OPTIONS: { id: StoryLength; label: string; minutes: string; wordCount: string }[] = [
  { id: "short", label: "Short", minutes: "~3 min", wordCount: "300\u2013500" },
  { id: "medium", label: "Medium", minutes: "~5 min", wordCount: "500\u2013800" },
  { id: "long", label: "Long", minutes: "~10 min", wordCount: "900\u20131400" },
];

// Sensible default virtue if no family virtue selected
const DEFAULT_VIRTUE = "perseverance";

export default function StoryForge({
  appData, selChild, setSelChild, premium, onPricing, demoScenario, onDemoConsumed, onSilentAddChild,
}: {
  appData: AppData;
  selChild: number;
  setSelChild: (i: number) => void;
  premium: boolean;
  onPricing: () => void;
  demoScenario?: DemoScenario | null;
  onDemoConsumed?: () => void;
  onSilentAddChild?: (child: ChildProfile) => void;
}) {
  const savedChild = appData.children[selChild];
  const hasSavedChildren = appData.children.length > 0;

  // Inline draft state (used when there's no saved child, or when user edits in-line)
  const [draftName, setDraftName] = useState(savedChild?.name ?? "");
  const [draftAge, setDraftAge] = useState<number>(savedChild?.age ?? 6);
  const [draftSex, setDraftSex] = useState<string>(savedChild?.sex ?? "");
  const [draftReading, setDraftReading] = useState<string>(savedChild?.readingLevel ?? "");

  // If saved child changes (user switched pills), sync draft fields to that child
  useEffect(() => {
    if (savedChild) {
      setDraftName(savedChild.name);
      setDraftAge(savedChild.age);
      setDraftSex(savedChild.sex);
      setDraftReading(savedChild.readingLevel);
    }
  }, [selChild, savedChild]);

  // Pre-fill virtues from family virtues, or use sensible default. Multi-select.
  const [selectedVirtues, setSelectedVirtues] = useState<string[]>(
    appData.familyVirtues.length > 0 ? [appData.familyVirtues[0]] : [DEFAULT_VIRTUE]
  );
  const [customSituation, setCustomSituation] = useState("");
  const [personalTouches, setPersonalTouches] = useState("");
  const [length, setLength] = useState<StoryLength>("medium");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [story, setStory] = useState<{
    title: string;
    body: string;
    discussionQuestions: string[];
    familyActivity: string;
    virtueTag: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const monthlyCount = getMonthlyStoryCount();
  const atLimit = !premium && monthlyCount >= PLANS.free.stories;

  // If family virtues change (e.g., set on another page), re-apply the first one only if the user
  // hasn't explicitly changed the picker yet — simpler: only apply on initial mount.
  // Pre-fill from demo scenario (one-click landing demos)
  useEffect(() => {
    if (demoScenario) {
      setDraftName(demoScenario.childName);
      setDraftAge(demoScenario.age);
      setDraftSex(demoScenario.sex);
      setDraftReading(getDefaultReadingLevel(demoScenario.age));
      setSelectedVirtues([demoScenario.virtue]);
      setCustomSituation(demoScenario.situation);
      onDemoConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoScenario]);

  const toggleVirtue = (id: string) => {
    setSelectedVirtues((prev) => {
      if (prev.includes(id)) {
        // Keep at least one virtue selected
        return prev.length === 1 ? prev : prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  };

  const addVirtueFromDropdown = (id: string) => {
    if (!id) return;
    setSelectedVirtues((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  // Quick virtue chips — union of family virtues and currently-selected virtues.
  // No hard-coded default so the user's picks are authoritative.
  const quickVirtueChips = useMemo(() => {
    const pool = [...new Set([...appData.familyVirtues, ...selectedVirtues])];
    return pool.map((id) => ({ id, sv: getSubVirtue(id), pk: getVirtueParent(id) }))
      .filter((x) => x.sv && x.pk);
  }, [appData.familyVirtues, selectedVirtues]);

  const effectiveName = draftName.trim() || "a brave child";
  const effectiveAge = draftAge || 6;
  const effectiveSex = draftSex; // may be ""
  const effectiveReading = draftReading || getDefaultReadingLevel(effectiveAge);

  const generateStory = async () => {
    if (selectedVirtues.length === 0) { setError("Pick at least one virtue to anchor the story."); return; }
    if (atLimit) { onPricing(); return; }

    if (!hasParentalConsent()) {
      setShowConsentModal(true);
      return;
    }

    setGenerating(true);
    setError(null);
    setStory(null);
    setCopied(false);

    // Resolve all selected virtues. The first is the primary anchor; the rest are
    // supporting threads the storyteller can weave in naturally.
    const resolved = selectedVirtues
      .map((id) => {
        const sv = getSubVirtue(id);
        const pk = getVirtueParent(id);
        const pv = pk ? VIRTUES[pk] : null;
        return sv && pv ? { sv, pv } : null;
      })
      .filter((x): x is { sv: NonNullable<ReturnType<typeof getSubVirtue>>; pv: typeof VIRTUES[keyof typeof VIRTUES] } => x !== null);

    if (resolved.length === 0) { setError("Invalid virtue selection."); setGenerating(false); return; }

    const primary = resolved[0];
    const supporting = resolved.slice(1);
    const cardinalSet = [...new Set(resolved.map((r) => r.pv.name))];

    const ageLabel = effectiveAge <= 4 ? "a very young child (ages 2-4)" :
      effectiveAge <= 7 ? "a young child (ages 5-7)" :
      effectiveAge <= 10 ? "a child (ages 8-10)" : "an older child (ages 11-13)";

    const lengthCfg = LENGTH_OPTIONS.find((l) => l.id === length)!;
    const genderClause = effectiveSex === "boy" ? "a boy"
      : effectiveSex === "girl" ? "a girl"
      : "a child";

    const primaryClause = `the virtue of ${primary.sv.name} (${primary.sv.desc}), which falls under the cardinal virtue of ${primary.pv.name}`;
    const supportingClause = supporting.length > 0
      ? `\nWeave in these supporting virtues where they emerge naturally from the action (don't force them, let them surface through character choices): ${supporting.map((s) => `${s.sv.name} (${s.sv.desc})`).join("; ")}.`
      : "";
    const cardinalClause = cardinalSet.length > 1
      ? ` The story should honor the harmony between ${cardinalSet.join(", ")}.`
      : "";

    const prompt = `You are a master storyteller in the tradition of Aesop, the Brothers Grimm, and C.S. Lewis. Write an original children's story that teaches ${primaryClause}.${cardinalClause}${supportingClause}

The story is for ${effectiveName}, ${ageLabel}, who is ${genderClause}.
Reading level: ${effectiveReading}.
${customSituation ? `The child is currently dealing with: ${customSituation}. Weave this theme naturally into the story.` : ""}
${personalTouches ? `Incorporate these personal details naturally if they fit the narrative (do not force all of them, pick what works): ${personalTouches}.` : ""}

Requirements:
- Target length: ${lengthCfg.wordCount} words (${lengthCfg.minutes} read aloud)
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

        const discussionQuestions: string[] = [];
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
          virtueTag: resolved.map((r) => r.sv.name).join(" \u00B7 "),
        });
        incrementStoryCount();
        trackEvent("story_generated");

        // Silent profile save: if no saved children yet and the user typed a real name,
        // persist this child so future sessions remember them.
        if (!hasSavedChildren && draftName.trim() && onSilentAddChild) {
          onSilentAddChild({
            name: draftName.trim(),
            age: effectiveAge,
            sex: effectiveSex || "",
            readingLevel: effectiveReading,
            struggles: [],
            readBooks: [],
            virtueProgress: {},
          });
        }
      } else setError("No story generated. Try again.");
    } catch { setError("Failed to connect. Check your internet connection."); }
    setGenerating(false);
  };

  const buildStoryHTML = () => {
    if (!story) return "";
    const displayName = draftName.trim() || "a young reader";
    return `<!DOCTYPE html><html><head><title>${story.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap');
        body { font-family: 'Crimson Text', Georgia, serif; max-width: 650px; margin: 40px auto; padding: 40px; color: #1F2937; line-height: 1.9; }
        h1 { text-align: center; font-size: 28px; color: #0A1628; border-bottom: 3px solid #D4A846; padding-bottom: 16px; margin-bottom: 24px; }
        .meta { text-align: center; font-size: 14px; color: #9CA3AF; margin-bottom: 32px; }
        p { font-size: 17px; margin-bottom: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #D1D5DB; border-top: 1px solid #E5E7EB; padding-top: 16px; }
        .tip-banner { display: none; }
        @media print { .tip-banner { display: none !important; } }
        @media screen { .tip-banner { display: block; position: fixed; top: 0; left: 0; right: 0; z-index: 999;
          background: #0A1628; color: white; padding: 14px 20px; text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.5; } }
      </style>
    </head><body>
      <div class="tip-banner">
        \uD83D\uDCC4 <strong>To save as PDF:</strong> Tap the <strong>Share button</strong> (square with arrow) then choose <strong>"Print"</strong> or <strong>"Save to Files"</strong>. On desktop, choose <strong>"Save as PDF"</strong> in the print dialog.
      </div>
      <h1>${story.title}</h1>
      <div class="meta">A story for ${displayName} \u00B7 Generated by Bedtime Virtues</div>
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
      <div class="footer">Bedtime Virtues \u2014 Building Character Through Story \u00B7 bedtimevirtues.com</div>
    </body></html>`;
  };

  const exportPDF = () => {
    if (!story) return;
    trackEvent("pdf_exported");
    const html = buildStoryHTML();
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) setTimeout(() => win.print(), 500);
  };

  const shareStory = async () => {
    if (!story) return;
    trackEvent("story_shared");
    const displayName = draftName.trim() || "a young reader";
    const text = `${story.title}\n\nA story for ${displayName}, generated by Bedtime Virtues.\n\n${story.body}`;
    if (navigator.share) {
      try { await navigator.share({ title: story.title, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: T.radiusSm,
    border: `1px solid ${T.gray200}`, fontFamily: T.fontSans, fontSize: 14,
    color: T.gray800, background: T.white, outline: "none",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
    color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 10,
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
          Story Studio
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          A personalized virtue story in under a minute.
          {!premium && ` ${Math.max(0, PLANS.free.stories - monthlyCount)} of ${PLANS.free.stories} free stories left this month.`}
        </p>
      </div>

      {/* Existing saved-children pills (only if multiple) */}
      {appData.children.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
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

      {/* ── Step 1: Who it's for ─────────────────────────────── */}
      <div style={{
        padding: 24, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 14,
      }}>
        <div style={sectionTitleStyle}>Who&apos;s this story for?</div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
          <div>
            <label style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500, display: "block", marginBottom: 4 }}>
              Name
            </label>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g., Mason"
              autoFocus={!savedChild}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500, display: "block", marginBottom: 4 }}>
              Age
            </label>
            <input
              type="number"
              min={2} max={14}
              value={draftAge}
              onChange={(e) => setDraftAge(parseInt(e.target.value) || 6)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Advanced: sex + reading level */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            marginTop: 12, display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 500, color: T.gray500,
          }}
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAdvanced ? "Hide details" : "Add more details (optional)"}
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 12 }}>
            <div>
              <label style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500, display: "block", marginBottom: 4 }}>
                Gender (optional)
              </label>
              <select value={draftSex} onChange={(e) => setDraftSex(e.target.value)} style={inputStyle}>
                <option value="">Skip / either</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500, display: "block", marginBottom: 4 }}>
                Reading level
              </label>
              <select
                value={draftReading || getDefaultReadingLevel(effectiveAge)}
                onChange={(e) => setDraftReading(e.target.value)}
                style={inputStyle}
              >
                {READING_LEVELS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Step 2: Virtue + situation + touches ──────────────── */}
      <div style={{
        padding: 24, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 14,
      }}>
        <div style={sectionTitleStyle}>What should the story teach?</div>
        <div style={{
          fontFamily: T.fontSans, fontSize: 12, color: T.gray400, marginBottom: 10,
        }}>
          Pick one or more virtues. The first is the main thread; the rest are woven in.
        </div>

        {/* Quick-pick virtue chips — multi-select, tap to toggle */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {quickVirtueChips.map(({ id, sv, pk }) => {
            const active = selectedVirtues.includes(id);
            const vc = VC[pk as keyof typeof VC];
            return (
              <button
                key={id}
                onClick={() => toggleVirtue(id)}
                aria-pressed={active}
                style={{
                  padding: "6px 12px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                  fontFamily: T.fontSans, cursor: "pointer",
                  background: active ? vc.main : T.white,
                  color: active ? T.white : vc.main,
                  border: active ? `1px solid ${vc.main}` : `1px solid ${vc.main}40`,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {active && <span style={{ fontWeight: 700 }}>✓</span>}
                {sv!.name}
              </button>
            );
          })}
        </div>

        {/* Add-another dropdown — value stays empty, selecting appends */}
        <select
          value=""
          onChange={(e) => { addVirtueFromDropdown(e.target.value); e.currentTarget.value = ""; }}
          style={{ ...inputStyle, marginBottom: 16, color: T.gray500 }}
        >
          <option value="">+ Add another virtue...</option>
          {Object.entries(VIRTUES).map(([key, v]) => (
            <optgroup key={key} label={v.name}>
              {v.subVirtues
                .filter((sv) => !selectedVirtues.includes(sv.id))
                .map((sv) => (
                  <option key={sv.id} value={sv.id}>{sv.name} &mdash; {sv.desc}</option>
                ))}
            </optgroup>
          ))}
        </select>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500, display: "block", marginBottom: 4 }}>
            Situation <span style={{ fontWeight: 400, color: T.gray400 }}>(optional)</span>
          </label>
          <input
            value={customSituation}
            onChange={(e) => setCustomSituation(e.target.value)}
            placeholder="e.g., struggling to share with a new sibling"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500, display: "block", marginBottom: 4 }}>
            Personal touches <span style={{ fontWeight: 400, color: T.gray400 }}>(optional)</span>
          </label>
          <textarea
            value={personalTouches}
            onChange={(e) => setPersonalTouches(e.target.value)}
            placeholder="Stuffed animal, sibling, favorite food, pet, hobby, setting..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: T.fontSans }}
          />
          <div style={{ fontSize: 11, color: T.gray400, marginTop: 4, fontFamily: T.fontSans }}>
            Weaved in naturally where it fits. Examples: &ldquo;loves her teddy Bramble, has a little
            brother Theo, favorite food is pancakes.&rdquo;
          </div>
        </div>
      </div>

      {/* ── Step 3: Length ──────────────────────────────────── */}
      <div style={{
        padding: 24, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 16,
      }}>
        <div style={sectionTitleStyle}>How long?</div>
        <div className="grid grid-cols-3 gap-2">
          {LENGTH_OPTIONS.map((opt) => {
            const active = length === opt.id;
            return (
              <button key={opt.id} onClick={() => setLength(opt.id)} style={{
                padding: "12px 8px", borderRadius: T.radiusSm,
                background: active ? T.navy : T.white,
                color: active ? T.white : T.navy,
                border: active ? `1px solid ${T.navy}` : `1px solid ${T.gray200}`,
                cursor: "pointer", fontFamily: T.fontSans, textAlign: "center",
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                <div style={{
                  fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 4, color: active ? "rgba(255,255,255,0.8)" : T.gray500,
                }}>
                  <Clock size={10} />
                  {opt.minutes}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Create button ───────────────────────────────────── */}
      {atLimit ? (
        <button onClick={onPricing} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "14px 24px", borderRadius: T.radiusSm,
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
          disabled={generating}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 28px", borderRadius: T.radiusSm,
            background: generating ? T.gray200 : T.navy,
            color: generating ? T.gray400 : T.gold,
            border: "none", cursor: generating ? "default" : "pointer",
            fontFamily: T.fontSans, fontSize: 15, fontWeight: 700,
            boxShadow: generating ? "none" : "0 4px 14px rgba(10,22,40,0.25)",
          }}
        >
          {generating ? (
            <>
              <Sparkles size={16} className="animate-pulse-subtle" />
              Weaving the story...
            </>
          ) : (
            <>
              <Pen size={16} />
              Create Story
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

      {/* ── Generated Story ─────────────────────────────────── */}
      {story && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: 24 }}
        >
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
              A story for {draftName.trim() || "a young reader"} &middot; by Bedtime Virtues
            </div>
            <div style={{
              fontFamily: T.fontSerif, fontSize: 18, lineHeight: 1.9,
              color: T.gray800, whiteSpace: "pre-wrap",
            }}>
              {story.body}
            </div>
          </div>

          {story.discussionQuestions.length > 0 && (
            <div style={{
              padding: 24, borderRadius: T.radiusLg,
              background: T.goldSubtle, border: `2px solid ${T.gold}30`,
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <MessageCircle size={20} color={T.gold} />
                <h3 style={{ fontFamily: T.fontSans, fontSize: 18, fontWeight: 700, color: T.navy }}>
                  Discussion Guide
                </h3>
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
                    <div style={{ fontFamily: T.fontSans, fontSize: 15, color: T.gray800, lineHeight: 1.5 }}>
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
                  <div style={{ fontFamily: T.fontSans, fontSize: 15, color: T.gray800, lineHeight: 1.5 }}>
                    {story.familyActivity}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap",
            padding: 16, borderRadius: T.radius, background: T.gray50,
            border: `1px solid ${T.gray100}`,
          }}>
            <button onClick={shareStory} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: T.radiusSm,
              background: T.navy, color: T.white, border: "none",
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Share2 size={14} />
              Share
            </button>
            <button onClick={exportPDF} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: T.radiusSm,
              background: T.white, color: T.gray700,
              border: `1px solid ${T.gray200}`,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Download size={14} />
              Save PDF
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
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Copy size={14} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={() => {
              if (story) {
                const displayName = draftName.trim() || "a young reader";
                const subject = encodeURIComponent(`Story for ${displayName}: ${story.title}`);
                const body = encodeURIComponent(`${story.title}\n\nA story for ${displayName}, generated by Bedtime Virtues.\n\n${story.body}\n\n---\nBedtime Virtues\nbedtimevirtues.com`);
                window.open(`mailto:?subject=${subject}&body=${body}`);
              }
            }} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: T.radiusSm,
              background: T.white, color: T.gray700,
              border: `1px solid ${T.gray200}`,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Mail size={14} />
              Email
            </button>
          </div>
        </motion.div>
      )}

      <ParentalConsentModal
        open={showConsentModal}
        onConsent={() => {
          setShowConsentModal(false);
          generateStory();
        }}
        onDecline={() => setShowConsentModal(false)}
      />

      <div style={{
        display: "flex", alignItems: "flex-start", gap: 8,
        padding: 14, borderRadius: T.radiusSm,
        background: T.gray50, border: `1px solid ${T.gray100}`,
        marginTop: 16,
      }}>
        <Info size={16} color={T.gray400} style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{
          fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
          lineHeight: 1.5, margin: 0,
        }}>
          Stories are generated by AI (Anthropic Claude) and may occasionally contain unexpected
          content. Please review before sharing with your child.
        </p>
      </div>
    </motion.div>
  );
}
