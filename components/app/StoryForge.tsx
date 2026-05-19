"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pen, Crown, Copy, Mail, Sparkles, MessageCircle, Users,
  Info, Share2, Download, ChevronDown, ChevronUp, Clock, Plus, X,
  RefreshCw, Edit3, BookMarked,
} from "lucide-react";
import {
  VIRTUES, getSubVirtue, getVirtueParent, READING_LEVELS,
  getDefaultReadingLevel, wordsForMinutes, countWords, minutesForWords,
  WPM_BEDTIME,
  type AppData, type ChildProfile,
} from "@/lib/data";
import type { DemoScenario } from "@/components/landing/LandingPage";
import { T, VC, PLANS } from "@/lib/tokens";
import { getMonthlyStoryCount, incrementStoryCount } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import ParentalConsentModal, { hasParentalConsent } from "@/components/ParentalConsentModal";
import VirtueQuiz from "./VirtueQuiz";

const LENGTH_PRESETS: { id: string; label: string; minutes: number }[] = [
  { id: "quick", label: "Quick", minutes: 3 },
  { id: "standard", label: "Standard", minutes: 6 },
  { id: "long", label: "Long", minutes: 10 },
];

const DEFAULT_VIRTUE = "perseverance";
const MIN_MIN = 1;
const MAX_MIN = 20;

type SavedStory = {
  id: string;
  title: string;
  body: string;
  discussionQuestions: string[];
  familyActivity: string;
  virtueTag: string;
  virtueDetail: string;
  characterNames: string;
  createdAt: number;
};
const LIBRARY_KEY = "virtueforge-library";
const LIBRARY_MAX = 8;
function loadLibrary(): SavedStory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveLibrary(items: SavedStory[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(items)); } catch { /* */ }
}

type CharDraft = {
  name: string;
  age: number;
  sex: string;
  readingLevel: string;
  description: string;
};
const EMPTY_DRAFT: CharDraft = { name: "", age: 6, sex: "", readingLevel: "", description: "" };
function draftFromChild(c: ChildProfile): CharDraft {
  return {
    name: c.name,
    age: c.age,
    sex: c.sex || "",
    readingLevel: c.readingLevel || "",
    description: c.description || "",
  };
}

export default function StoryForge({
  appData, selChild, setSelChild, premium, onPricing,
  demoScenario, onDemoConsumed, onSilentAddChild, onUpdateChild, onRemoveChild,
}: {
  appData: AppData;
  selChild: number;
  setSelChild: (i: number) => void;
  premium: boolean;
  onPricing: () => void;
  demoScenario?: DemoScenario | null;
  onDemoConsumed?: () => void;
  onSilentAddChild?: (child: ChildProfile) => void;
  onUpdateChild?: (i: number, child: ChildProfile) => void;
  onRemoveChild?: (i: number) => void;
}) {
  // Which saved characters belong to this story
  const [selectedChildren, setSelectedChildren] = useState<number[]>(
    appData.children.length > 0 ? [Math.min(selChild, appData.children.length - 1)] : []
  );

  // Inline editor: null = closed, -1 = creating new, >=0 = editing index
  const [editorIndex, setEditorIndex] = useState<number | null>(
    appData.children.length === 0 ? -1 : null
  );
  const [editorDraft, setEditorDraft] = useState<CharDraft>(EMPTY_DRAFT);

  // Virtue picker (multi-select)
  const [selectedVirtues, setSelectedVirtues] = useState<string[]>(
    appData.familyVirtues.length > 0 ? [appData.familyVirtues[0]] : [DEFAULT_VIRTUE]
  );
  const [customSituation, setCustomSituation] = useState("");
  const [personalTouches, setPersonalTouches] = useState("");

  // Length: minutes is source of truth
  const [minutes, setMinutes] = useState<number>(6);

  const [quizOpen, setQuizOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [story, setStory] = useState<{
    title: string;
    body: string;
    discussionQuestions: string[];
    familyActivity: string;
    virtueTag: string;
    virtueDetail: string;
    actualWords: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [library, setLibrary] = useState<SavedStory[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => { setLibrary(loadLibrary()); }, []);

  const monthlyCount = getMonthlyStoryCount();
  const atLimit = !premium && monthlyCount >= PLANS.free.stories;

  // ── Demo scenario from landing → load into editor with virtue pre-set ──
  useEffect(() => {
    if (demoScenario) {
      setEditorDraft({
        name: demoScenario.childName,
        age: demoScenario.age,
        sex: demoScenario.sex,
        readingLevel: getDefaultReadingLevel(demoScenario.age),
        description: "",
      });
      setEditorIndex(-1);
      setSelectedVirtues([demoScenario.virtue]);
      setCustomSituation(demoScenario.situation);
      onDemoConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoScenario]);

  // Drop deleted indices from selection
  useEffect(() => {
    setSelectedChildren((prev) => prev.filter((i) => i < appData.children.length));
  }, [appData.children.length]);

  const toggleChild = (i: number) => {
    setSelectedChildren((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
    setSelChild(i);
  };

  const openNewEditor = () => {
    setEditorIndex(-1);
    setEditorDraft(EMPTY_DRAFT);
  };

  const openEditEditor = (i: number) => {
    setEditorIndex(i);
    setEditorDraft(draftFromChild(appData.children[i]));
  };

  const cancelEditor = () => {
    setEditorIndex(null);
    setEditorDraft(EMPTY_DRAFT);
    setError(null);
  };

  const saveEditor = () => {
    const trimmedName = editorDraft.name.trim();
    if (!trimmedName) { setError("Please give the character a name."); return; }
    const age = Math.max(1, Math.min(16, editorDraft.age || 6));
    const isUpdate = editorIndex !== null && editorIndex >= 0;
    const existing = isUpdate ? appData.children[editorIndex as number] : null;
    const child: ChildProfile = {
      name: trimmedName,
      age,
      sex: editorDraft.sex,
      readingLevel: editorDraft.readingLevel || getDefaultReadingLevel(age),
      struggles: existing?.struggles ?? [],
      readBooks: existing?.readBooks ?? [],
      virtueProgress: existing?.virtueProgress ?? {},
      description: editorDraft.description.trim() || undefined,
    };
    if (editorIndex === -1) {
      const newIdx = appData.children.length;
      onSilentAddChild?.(child);
      setSelectedChildren((prev) => [...new Set([...prev, newIdx])]);
      setSelChild(newIdx);
    } else if (isUpdate) {
      onUpdateChild?.(editorIndex as number, child);
    }
    setEditorIndex(null);
    setEditorDraft(EMPTY_DRAFT);
    setError(null);
  };

  const deleteCharacter = (i: number) => {
    onRemoveChild?.(i);
    setSelectedChildren((prev) =>
      prev.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))
    );
    setEditorIndex(null);
  };

  // ── Virtues ──────────────────────────────────────────────────────────
  const removeVirtue = (id: string) => setSelectedVirtues((prev) => prev.filter((v) => v !== id));
  const addVirtueFromDropdown = (id: string) => {
    if (!id) return;
    setSelectedVirtues((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const quickVirtueChips = useMemo(() => {
    return selectedVirtues
      .map((id) => ({ id, sv: getSubVirtue(id), pk: getVirtueParent(id) }))
      .filter((x) => x.sv && x.pk);
  }, [selectedVirtues]);

  // ── Length ──────────────────────────────────────────────────────────
  const wordTarget = useMemo(() => wordsForMinutes(minutes), [minutes]);
  const isPreset = LENGTH_PRESETS.some((p) => p.minutes === minutes);

  // ── Build the prompt + call the API ──────────────────────────────────
  const generateStory = async () => {
    if (selectedChildren.length === 0) {
      setError("Pick or create at least one character first.");
      return;
    }
    if (selectedVirtues.length === 0) {
      setError("Pick at least one virtue to anchor the story.");
      return;
    }
    if (atLimit) { onPricing(); return; }
    if (!hasParentalConsent()) {
      setShowConsentModal(true);
      return;
    }

    setGenerating(true);
    setError(null);
    setStory(null);
    setCopied(false);

    const chosen = selectedChildren
      .map((i) => appData.children[i])
      .filter((c): c is ChildProfile => Boolean(c));

    const resolvedVirtues = selectedVirtues
      .map((id) => {
        const sv = getSubVirtue(id);
        const pk = getVirtueParent(id);
        const pv = pk ? VIRTUES[pk] : null;
        return sv && pv ? { sv, pv } : null;
      })
      .filter((x): x is { sv: NonNullable<ReturnType<typeof getSubVirtue>>; pv: typeof VIRTUES[keyof typeof VIRTUES] } => x !== null);

    if (resolvedVirtues.length === 0) {
      setError("Invalid virtue selection.");
      setGenerating(false);
      return;
    }

    const primary = resolvedVirtues[0];
    const supporting = resolvedVirtues.slice(1);
    const cardinalSet = [...new Set(resolvedVirtues.map((r) => r.pv.name))];

    const charDescriptions = chosen.map((c) => {
      const ageBand = c.age <= 4 ? "ages 2-4" :
        c.age <= 7 ? "ages 5-7" :
        c.age <= 10 ? "ages 8-10" : "ages 11-13";
      const gender = c.sex === "boy" ? "boy" : c.sex === "girl" ? "girl" : "child";
      const desc = c.description ? `. Looks/loves: ${c.description}` : "";
      return `${c.name} (age ${c.age}, ${ageBand}, ${gender}${desc})`;
    });
    const characterClause = chosen.length === 1
      ? `The story is for ${charDescriptions[0]}.`
      : `The story features these characters together in a single shared adventure (siblings or friends, not separate vignettes): ${charDescriptions.join("; ")}. Give each character a meaningful role.`;

    const youngestAge = Math.min(...chosen.map((c) => c.age));
    const readingLevel = chosen.find((c) => c.age === youngestAge)?.readingLevel
      || getDefaultReadingLevel(youngestAge);

    const primaryClause = `the virtue of ${primary.sv.name} (${primary.sv.desc}), which falls under the cardinal virtue of ${primary.pv.name}`;
    const supportingClause = supporting.length > 0
      ? `\nWeave in these supporting virtues where they emerge naturally from the action (don't force them, let them surface through character choices): ${supporting.map((s) => `${s.sv.name} (${s.sv.desc})`).join("; ")}.`
      : "";
    const cardinalClause = cardinalSet.length > 1
      ? ` The story should honor the harmony between ${cardinalSet.join(", ")}.`
      : "";

    const prompt = `You are a master storyteller in the tradition of Aesop, the Brothers Grimm, and C.S. Lewis. Write an original children's story that teaches ${primaryClause}.${cardinalClause}${supportingClause}

${characterClause}
Reading level: ${readingLevel}.
${customSituation ? `The child is currently dealing with: ${customSituation}. Weave this theme naturally into the story.` : ""}
${personalTouches ? `Incorporate these personal details naturally if they fit the narrative (do not force all of them, pick what works): ${personalTouches}.` : ""}

CRITICAL LENGTH REQUIREMENT:
- Target story body length: ${wordTarget.target} words (acceptable range: ${wordTarget.lo}-${wordTarget.hi} words).
- This is calibrated for ~${minutes} minute${minutes === 1 ? "" : "s"} of read-aloud time at ~${WPM_BEDTIME} words per minute (a parent reading a bedtime story to a child).
- Count words deliberately. Do NOT write significantly shorter or longer than ${wordTarget.target}.
- The word count target applies to the STORY BODY ONLY, not the title or discussion guide.

Story requirements:
- Vivid, memorable characters and settings
- The moral emerges naturally through action, never stated explicitly
- Show virtue practiced through habit and choice
- Rich, beautiful language for the reading level
- Include a compelling title
- Classical storytelling tradition; no modern ideology or didactic lecturing

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

        const actualWords = countWords(body);
        const newStory = {
          title, body, discussionQuestions, familyActivity,
          virtueTag: resolvedVirtues.map((r) => r.sv.name).join(" · "),
          virtueDetail: resolvedVirtues.map((r) => `${r.sv.name} (${r.pv.name}) — ${r.sv.desc}`).join(" · "),
          actualWords,
        };
        setStory(newStory);
        incrementStoryCount();
        trackEvent("story_generated");

        const saved: SavedStory = {
          id: String(Date.now()),
          title: newStory.title,
          body: newStory.body,
          discussionQuestions: newStory.discussionQuestions,
          familyActivity: newStory.familyActivity,
          virtueTag: newStory.virtueTag,
          virtueDetail: newStory.virtueDetail,
          characterNames: chosen.map((c) => c.name).join(", "),
          createdAt: Date.now(),
        };
        const next = [saved, ...library].slice(0, LIBRARY_MAX);
        saveLibrary(next);
        setLibrary(next);
      } else setError("No story generated. Try again.");
    } catch { setError("Failed to connect. Check your internet connection."); }
    setGenerating(false);
  };

  const generateAnother = () => {
    setStory(null);
    setTimeout(() => generateStory(), 50);
  };

  const openSavedStory = (s: SavedStory) => {
    setStory({
      title: s.title,
      body: s.body,
      discussionQuestions: s.discussionQuestions,
      familyActivity: s.familyActivity,
      virtueTag: s.virtueTag,
      virtueDetail: s.virtueDetail,
      actualWords: countWords(s.body),
    });
    setLibraryOpen(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const deleteSavedStory = (id: string) => {
    const next = library.filter((s) => s.id !== id);
    saveLibrary(next);
    setLibrary(next);
  };

  const buildStoryHTML = () => {
    if (!story) return "";
    const displayName = chosen0Name() || "a young reader";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${story.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { width: 100%; }
        body {
          font-family: 'Crimson Text', Georgia, serif;
          width: 100%; margin: 0; padding: 0.75in 1in;
          color: #1F2937; line-height: 1.8; font-size: 16px;
        }
        h1 {
          text-align: center; font-size: 26px; color: #0A1628;
          border-bottom: 3px solid #B8941F; padding-bottom: 14px; margin-bottom: 10px;
        }
        .virtue-label { text-align: center; margin-bottom: 6px; }
        .virtue-label span {
          display: inline-block; padding: 5px 16px; border-radius: 100px;
          background: #FEF3C7; color: #0A1628;
          border: 1.5px solid #B8941F;
          font-size: 13px; font-weight: 700; letter-spacing: 0.02em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .virtue-desc {
          text-align: center; font-size: 12px; color: #4B5563;
          font-style: italic; margin-bottom: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .meta { text-align: center; font-size: 13px; color: #6B7280; margin-bottom: 28px; }
        .story-body p { font-size: 16px; margin-bottom: 14px; text-indent: 1.5em; }
        .story-body p:first-child { text-indent: 0; }
        .discussion-box {
          margin-top: 36px; padding: 20px;
          border: 2px solid #B8941F; border-radius: 12px;
          background: #FFFBEB;
          break-inside: avoid; page-break-inside: avoid;
        }
        .discussion-box h2 {
          font-size: 18px; color: #0A1628; margin-bottom: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .discussion-box ol { padding-left: 22px; margin: 0; }
        .discussion-box li {
          margin-bottom: 10px; font-size: 15px;
          font-family: 'Crimson Text', Georgia, serif;
        }
        .family-activity {
          margin-top: 14px; padding: 14px;
          background: #FEF3C7; border-radius: 8px;
          break-inside: avoid; page-break-inside: avoid;
        }
        .family-activity strong {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 13px; color: #0A1628; letter-spacing: 0.02em;
        }
        .family-activity p { font-size: 14px; margin-top: 4px; }
        .footer {
          margin-top: 36px; text-align: center; font-size: 12px;
          color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 14px;
        }
        .tip-banner { display: none; }
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { padding: 0; margin: 0; width: 100%; }
          .tip-banner { display: none !important; }
          .discussion-box, .family-activity { break-inside: avoid; page-break-inside: avoid; }
          @page { size: letter; margin: 0.75in 1in; }
        }
        @media screen {
          body { max-width: 8.5in; margin: 0 auto; }
          .tip-banner {
            display: block; position: fixed; top: 0; left: 0; right: 0; z-index: 999;
            background: #0A1628; color: white; padding: 14px 20px; text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px; line-height: 1.5;
          }
        }
      </style>
    </head><body>
      <div class="tip-banner">
        📄 <strong>To save as PDF:</strong> Tap the <strong>Share button</strong> (square with arrow) then choose <strong>"Print"</strong> or <strong>"Save to Files"</strong>. On desktop, choose <strong>"Save as PDF"</strong> in the print dialog.
      </div>
      <h1>${story.title}</h1>
      ${story.virtueTag ? `<div class="virtue-label"><span>${story.virtueTag}</span></div>` : ""}
      ${story.virtueDetail ? `<div class="virtue-desc">${story.virtueDetail}</div>` : ""}
      <div class="meta">A story for ${displayName} · Generated by Bedtime Virtues</div>
      <div class="story-body">
        ${story.body.split("\n\n").map((p: string) => `<p>${p}</p>`).join("")}
      </div>
      ${story.discussionQuestions.length > 0 ? `
      <div class="discussion-box">
        <h2>Discussion Guide</h2>
        <ol>
          ${story.discussionQuestions.map((q: string) => `<li>${q}</li>`).join("")}
        </ol>
        ${story.familyActivity ? `<div class="family-activity">
          <strong>Family Activity:</strong>
          <p>${story.familyActivity}</p>
        </div>` : ""}
      </div>
      ` : ""}
      <div class="footer">Bedtime Virtues — Building Character Through Story · bedtimevirtues.com</div>
    </body></html>`;
  };

  function chosen0Name(): string {
    const c = appData.children[selectedChildren[0]];
    return c?.name ?? "";
  }

  function chosenNames(): string {
    return selectedChildren
      .map((i) => appData.children[i]?.name)
      .filter(Boolean)
      .join(" & ");
  }

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
    const displayName = chosen0Name() || "a young reader";
    const text = `${story.title}\n\nA story for ${displayName}, generated by Bedtime Virtues.\n\n${story.body}`;
    if (navigator.share) {
      try { await navigator.share({ title: story.title, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Styles ──
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: T.radiusSm,
    border: `1px solid ${T.gray200}`, fontFamily: T.fontSans, fontSize: 14,
    color: T.gray800, background: T.white, outline: "none",
    // Hide native number-input spinners in webkit/firefox
    appearance: "textfield",
    MozAppearance: "textfield",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
    color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 10,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
    color: T.gray500, display: "block", marginBottom: 4,
  };

  const hasAnyCharacters = appData.children.length > 0;
  const wordsActual = story?.actualWords ?? 0;
  const minutesActual = wordsActual > 0 ? minutesForWords(wordsActual) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
    >
      {/* Hide native number-input spinners */}
      <style>{`
        input.no-spin::-webkit-outer-spin-button,
        input.no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input.no-spin { -moz-appearance: textfield; }
      `}</style>

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

      {/* ── Section 1: Characters ────────────────────────────────────── */}
      <div style={{
        padding: 20, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={sectionTitleStyle}>Who&apos;s this story for?</div>
          {selectedChildren.length > 1 && (
            <span style={{
              fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
              padding: "3px 10px", borderRadius: 100,
              background: T.navy, color: T.gold,
            }}>
              {selectedChildren.length} characters in one story
            </span>
          )}
        </div>

        {/* Character chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {appData.children.map((c, i) => {
            const active = selectedChildren.includes(i);
            return (
              <div
                key={i}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 4px 6px 14px", borderRadius: 100,
                  background: active ? T.navy : T.white,
                  border: active ? `1px solid ${T.navy}` : `1px solid ${T.gray200}`,
                  color: active ? T.white : T.gray700,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                <button
                  onClick={() => toggleChild(i)}
                  aria-pressed={active}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: 0, background: "none", border: "none", cursor: "pointer",
                    color: "inherit", fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit",
                  }}
                >
                  <span>{c.name}</span>
                  <span style={{
                    fontWeight: 400, opacity: 0.7, fontSize: 11,
                  }}>
                    {c.age}
                  </span>
                </button>
                <button
                  onClick={() => openEditEditor(i)}
                  aria-label={`Edit ${c.name}`}
                  style={{
                    background: active ? "rgba(255,255,255,0.18)" : T.gray100,
                    border: "none", cursor: "pointer",
                    borderRadius: "50%", width: 22, height: 22, padding: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: active ? T.white : T.gray500,
                  }}
                >
                  <Edit3 size={11} />
                </button>
              </div>
            );
          })}
          {!atLimit && (
            <button
              onClick={openNewEditor}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 100,
                background: T.bg, border: `1px dashed ${T.gray300 || T.gray200}`,
                color: T.gray600, cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              }}
            >
              <Plus size={13} />
              {hasAnyCharacters ? "Add character" : "New character"}
            </button>
          )}
        </div>

        {/* Selected character details + hint */}
        {hasAnyCharacters && selectedChildren.length > 0 && editorIndex === null && (
          <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.gray500 }}>
            {selectedChildren.length === 1 ? (
              (() => {
                const c = appData.children[selectedChildren[0]];
                if (!c) return null;
                const parts: string[] = [`Age ${c.age}`];
                if (c.sex) parts.push(c.sex === "boy" ? "Boy" : "Girl");
                if (c.readingLevel) {
                  const rl = READING_LEVELS.find((r) => r.value === c.readingLevel);
                  if (rl) parts.push(rl.label);
                }
                return (
                  <div>
                    <span>{parts.join(" · ")}</span>
                    {c.description && (
                      <div style={{ marginTop: 4, fontStyle: "italic" }}>
                        &ldquo;{c.description}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <span>Tap multiple to feature them all in one story together. Tap again to remove.</span>
            )}
          </div>
        )}

        {hasAnyCharacters && selectedChildren.length === 0 && (
          <div style={{
            padding: 10, borderRadius: T.radiusSm,
            background: VC.courage.light, color: VC.courage.main,
            fontFamily: T.fontSans, fontSize: 13,
          }}>
            Tap a character above to pick who the story is for.
          </div>
        )}

        {/* Inline character editor */}
        <AnimatePresence>
          {editorIndex !== null && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden", marginTop: 16 }}
            >
              <div style={{
                padding: 18, borderRadius: T.radius, background: T.bg,
                border: `1px solid ${T.gray200}`,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 14,
                }}>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.navy,
                  }}>
                    {editorIndex === -1 ? "New character" : `Edit ${appData.children[editorIndex]?.name}`}
                  </div>
                  <button
                    onClick={cancelEditor}
                    aria-label="Close editor"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: 4, color: T.gray400,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3" style={{ marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      value={editorDraft.name}
                      onChange={(e) => setEditorDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="e.g., Mason"
                      autoFocus
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Age</label>
                    <input
                      className="no-spin"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editorDraft.age || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        setEditorDraft((d) => ({ ...d, age: v ? parseInt(v, 10) : 0 }));
                      }}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: 10 }}>
                  <div>
                    <label style={labelStyle}>Gender (optional)</label>
                    <select
                      value={editorDraft.sex}
                      onChange={(e) => setEditorDraft((d) => ({ ...d, sex: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">Skip / either</option>
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Reading level</label>
                    <select
                      value={editorDraft.readingLevel || getDefaultReadingLevel(editorDraft.age || 6)}
                      onChange={(e) => setEditorDraft((d) => ({ ...d, readingLevel: e.target.value }))}
                      style={inputStyle}
                    >
                      {READING_LEVELS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Looks &amp; loves <span style={{ fontWeight: 400, color: T.gray400 }}>(optional, woven into every story)</span>
                  </label>
                  <textarea
                    value={editorDraft.description}
                    onChange={(e) => setEditorDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="e.g., long brown hair, loves dinosaurs and her stuffed wolf Bramble"
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={saveEditor}
                    style={{
                      padding: "9px 18px", borderRadius: T.radiusSm,
                      background: T.navy, color: T.gold, border: "none",
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {editorIndex === -1 ? "Save & use" : "Save changes"}
                  </button>
                  <button
                    onClick={cancelEditor}
                    style={{
                      padding: "9px 14px", borderRadius: T.radiusSm,
                      background: T.white, color: T.gray600,
                      border: `1px solid ${T.gray200}`,
                      fontFamily: T.fontSans, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  {editorIndex !== null && editorIndex >= 0 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${appData.children[editorIndex as number]?.name}? Their progress will be lost.`)) {
                          deleteCharacter(editorIndex as number);
                        }
                      }}
                      style={{
                        marginLeft: "auto",
                        padding: "9px 14px", borderRadius: T.radiusSm,
                        background: "none", color: T.red || "#B91C1C",
                        border: "none",
                        fontFamily: T.fontSans, fontSize: 13, cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section 2: Virtue + situation + touches ─────────────────── */}
      <div style={{
        padding: 24, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 14,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 6,
        }}>
          <div style={sectionTitleStyle}>What should the story teach?</div>
          <button
            type="button"
            onClick={() => setQuizOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", background: T.goldSubtle,
              border: `1px solid ${T.gold}40`,
              borderRadius: 100,
              cursor: "pointer",
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gold,
            }}
          >
            <Sparkles size={12} />
            Help me choose
          </button>
        </div>
        <div style={{
          fontFamily: T.fontSans, fontSize: 12,
          color: selectedVirtues.length === 0 ? VC.courage.main : T.gray400,
          marginBottom: 10,
        }}>
          {selectedVirtues.length === 0
            ? "Select at least one virtue from the dropdown below."
            : "Pick one or more virtues. The first is the main thread; the rest are woven in."}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {quickVirtueChips.map(({ id, sv, pk }) => {
            const vc = VC[pk as keyof typeof VC];
            return (
              <span
                key={id}
                style={{
                  padding: "6px 8px 6px 12px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                  fontFamily: T.fontSans,
                  background: vc.main, color: T.white,
                  border: `1px solid ${vc.main}`,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                {sv!.name}
                <button
                  onClick={() => removeVirtue(id)}
                  aria-label={`Remove ${sv!.name}`}
                  style={{
                    background: "rgba(255,255,255,0.25)", border: "none", cursor: "pointer",
                    borderRadius: "50%", width: 18, height: 18, padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.white, fontSize: 12, fontWeight: 700, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>

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
          <label style={labelStyle}>
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
          <label style={labelStyle}>
            Story extras <span style={{ fontWeight: 400, color: T.gray400 }}>(optional, one-off details for this story)</span>
          </label>
          <textarea
            value={personalTouches}
            onChange={(e) => setPersonalTouches(e.target.value)}
            placeholder="A setting, a stuffed animal, a sibling, a favorite food..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", fontFamily: T.fontSans }}
          />
          <div style={{ fontSize: 11, color: T.gray400, marginTop: 4, fontFamily: T.fontSans }}>
            Save the things that stay the same (hair, favorite toy) in the character details above so they appear in every story.
          </div>
        </div>
      </div>

      {/* ── Section 3: Length ───────────────────────────────────────── */}
      <div style={{
        padding: 20, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={sectionTitleStyle}>How long?</div>
          <span style={{
            fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
          }}>
            ~{wordTarget.target} words · ~{minutes} min read-aloud
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {LENGTH_PRESETS.map((opt) => {
            const active = minutes === opt.minutes;
            return (
              <button
                key={opt.id}
                onClick={() => setMinutes(opt.minutes)}
                style={{
                  padding: "9px 18px", borderRadius: 100,
                  background: active ? T.navy : T.white,
                  color: active ? T.white : T.gray700,
                  border: active ? `1px solid ${T.navy}` : `1px solid ${T.gray200}`,
                  cursor: "pointer", fontFamily: T.fontSans,
                  fontSize: 13, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Clock size={12} />
                {opt.label}
                <span style={{ opacity: 0.7, fontWeight: 400 }}>{opt.minutes} min</span>
              </button>
            );
          })}

          {/* Custom: inline number input always visible */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 6px 4px 14px", borderRadius: 100,
            background: !isPreset ? T.navy : T.white,
            border: !isPreset ? `1px solid ${T.navy}` : `1px solid ${T.gray200}`,
            color: !isPreset ? T.white : T.gray700,
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
          }}>
            <Pen size={12} />
            <span>Custom</span>
            <input
              className="no-spin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={!isPreset ? String(minutes) : ""}
              placeholder={String(minutes)}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                if (!v) return;
                const n = Math.max(MIN_MIN, Math.min(MAX_MIN, parseInt(v, 10)));
                setMinutes(n);
              }}
              style={{
                width: 38, padding: "4px 6px", borderRadius: 8,
                border: "none", background: !isPreset ? "rgba(255,255,255,0.18)" : T.bg,
                color: "inherit", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                textAlign: "center", outline: "none",
              }}
            />
            <span style={{ opacity: 0.7, fontWeight: 400, paddingRight: 8 }}>min</span>
          </div>
        </div>
      </div>

      {/* ── Create button ───────────────────────────────────────────── */}
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
              Create story for {chosenNames() || "..."}
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

      {/* ── Generated Story ─────────────────────────────────────────── */}
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
            {story.virtueTag && (
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <span style={{
                  display: "inline-block", padding: "5px 16px", borderRadius: 100,
                  background: "#FEF3C7", color: T.navy,
                  border: `1.5px solid #B8941F`,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                  letterSpacing: "0.02em",
                }}>
                  {story.virtueTag}
                </span>
              </div>
            )}
            {story.virtueDetail && (
              <div style={{
                textAlign: "center", fontFamily: T.fontSans, fontSize: 12,
                color: T.gray500, fontStyle: "italic", marginBottom: 6,
              }}>
                {story.virtueDetail}
              </div>
            )}
            <div style={{
              textAlign: "center", fontFamily: T.fontSans, fontSize: 13,
              color: T.gray400, marginBottom: 12,
            }}>
              A story for {chosenNames() || "a young reader"} &middot; by Bedtime Virtues
            </div>
            {story.actualWords > 0 && (
              <div style={{
                textAlign: "center", fontFamily: T.fontSans, fontSize: 11,
                color: T.gray400, marginBottom: 24,
                paddingBottom: 24, borderBottom: `2px solid ${T.gold}40`,
              }}>
                {story.actualWords} words · ~{minutesActual.toFixed(1)} min read-aloud
                {Math.abs(minutesActual - minutes) > 1 && (
                  <span style={{ color: VC.courage.main, marginLeft: 6 }}>
                    (target was {minutes} min)
                  </span>
                )}
              </div>
            )}
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
            <button onClick={generateAnother} disabled={generating} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: T.radiusSm,
              background: T.navy, color: T.gold, border: "none",
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
              cursor: generating ? "default" : "pointer",
              opacity: generating ? 0.5 : 1,
            }}>
              <RefreshCw size={14} />
              Another like this
            </button>
            <button onClick={shareStory} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: T.radiusSm,
              background: T.white, color: T.gray700,
              border: `1px solid ${T.gray200}`,
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
                const displayName = chosenNames() || "a young reader";
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

      {/* ── Story library ───────────────────────────────────────────── */}
      {library.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setLibraryOpen(!libraryOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "12px 16px", borderRadius: T.radius,
              background: T.white, border: `1px solid ${T.gray100}`,
              cursor: "pointer", fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.navy,
            }}
          >
            <BookMarked size={16} color={T.gold} />
            Your recent stories ({library.length})
            <span style={{ marginLeft: "auto", color: T.gray400 }}>
              {libraryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          <AnimatePresence>
            {libraryOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginTop: 8 }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {library.map((s) => (
                    <div key={s.id} style={{
                      padding: 12, borderRadius: T.radius,
                      background: T.white, border: `1px solid ${T.gray100}`,
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <button
                        onClick={() => openSavedStory(s)}
                        style={{
                          flex: 1, textAlign: "left",
                          background: "none", border: "none", cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                          color: T.navy, marginBottom: 2,
                        }}>
                          {s.title}
                        </div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
                        }}>
                          {s.characterNames || "—"} · {s.virtueTag} · {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteSavedStory(s.id)}
                        aria-label="Remove from library"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: T.gray300, padding: 4,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <ParentalConsentModal
        open={showConsentModal}
        onConsent={() => {
          setShowConsentModal(false);
          generateStory();
        }}
        onDecline={() => setShowConsentModal(false)}
      />

      <VirtueQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={(ids) => {
          setSelectedVirtues((prev) => [...new Set([...prev, ...ids])]);
        }}
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
