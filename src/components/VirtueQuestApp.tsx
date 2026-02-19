"use client";

import { useState, useEffect } from "react";
import {
  VIRTUES,
  STRUGGLES_MAP,
  READING_LEVELS,
  GUIDED_QUESTIONS,
  getVirtueParent,
  getSubVirtue,
  getDefaultReadingLevel,
  getRecommendedBooks,
  type AppData,
  type ChildProfile,
} from "@/lib/data";
import { loadData, saveData } from "@/lib/storage";
import ShieldCrest from "./ShieldCrest";
import ValueWheel from "./ValueWheel";
import GuidedQuiz from "./GuidedQuiz";
import BookCard from "./BookCard";
import StoryGenerator from "./StoryGenerator";

export default function VirtueQuestApp() {
  const [page, setPage] = useState("home");
  const [appData, setAppData] = useState<AppData>({
    children: [],
    familyVirtues: [],
    setupComplete: false,
  });
  const [loaded, setLoaded] = useState(false);
  const [selectedChild, setSelectedChild] = useState(0);
  const [wheelMode, setWheelMode] = useState<"manual" | "guided" | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);

  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState(5);
  const [newSex, setNewSex] = useState("boy");
  const [newReadingLevel, setNewReadingLevel] = useState("");
  const [newStruggles, setNewStruggles] = useState<string[]>([]);

  useEffect(() => {
    setAppData(loadData());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveData(appData);
  }, [appData, loaded]);

  const updateAppData = (updates: Partial<AppData>) =>
    setAppData((prev) => ({ ...prev, ...updates }));

  const addChild = () => {
    if (!newName.trim()) return;
    const rl = newReadingLevel || getDefaultReadingLevel(newAge);
    const child: ChildProfile = {
      name: newName.trim(),
      age: newAge,
      sex: newSex,
      readingLevel: rl,
      struggles: newStruggles,
      readBooks: [],
      virtueProgress: {},
    };
    updateAppData({ children: [...appData.children, child] });
    setNewName("");
    setNewAge(5);
    setNewSex("boy");
    setNewReadingLevel("");
    setNewStruggles([]);
    setShowAddChild(false);
  };

  const toggleStruggle = (s: string) => {
    setNewStruggles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleFamilyVirtue = (id: string) => {
    updateAppData({
      familyVirtues: appData.familyVirtues.includes(id)
        ? appData.familyVirtues.filter((v) => v !== id)
        : [...appData.familyVirtues, id],
    });
  };

  const markBookRead = (childIdx: number, bookTitle: string, virtueIds: string[]) => {
    const children = [...appData.children];
    const child = { ...children[childIdx] };
    const wasRead = child.readBooks.includes(bookTitle);
    child.readBooks = wasRead
      ? child.readBooks.filter((b) => b !== bookTitle)
      : [...child.readBooks, bookTitle];
    const progress = { ...child.virtueProgress };
    virtueIds.forEach((v) => {
      if (!wasRead) {
        progress[v] = (progress[v] || 0) + 15;
      } else {
        progress[v] = Math.max(0, (progress[v] || 0) - 15);
      }
    });
    child.virtueProgress = progress;
    children[childIdx] = child;
    updateAppData({ children });
  };

  const logTime = (childIdx: number, virtueId: string, minutes: number) => {
    const children = [...appData.children];
    const child = { ...children[childIdx] };
    const progress = { ...child.virtueProgress };
    progress[virtueId] = (progress[virtueId] || 0) + minutes;
    child.virtueProgress = progress;
    children[childIdx] = child;
    updateAppData({ children });
  };

  const removeChild = (idx: number) => {
    const children = appData.children.filter((_, i) => i !== idx);
    updateAppData({ children });
    if (selectedChild >= children.length)
      setSelectedChild(Math.max(0, children.length - 1));
  };

  const resetApp = () => {
    setAppData({ children: [], familyVirtues: [], setupComplete: false });
    setPage("home");
  };

  const getChildRecommendations = (childIdx: number): string[] => {
    const child = appData.children[childIdx];
    if (!child) return [];
    const recs = new Set<string>();
    child.struggles.forEach((s) => {
      const mapping = STRUGGLES_MAP[s];
      if (mapping) mapping.virtues.forEach((v) => recs.add(v));
    });
    appData.familyVirtues.forEach((v) => recs.add(v));
    return [...recs];
  };

  const getGaps = (childIdx: number): string[] => {
    const child = appData.children[childIdx];
    if (!child) return [];
    const allSubs = Object.values(VIRTUES).flatMap((v) => v.subVirtues);
    return allSubs.filter((sv) => (child.virtueProgress?.[sv.id] || 0) === 0).map((sv) => sv.id);
  };

  if (!loaded) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: "var(--parchment)" }}>
        <div className="text-xl" style={{ fontFamily: "var(--font-crimson)", color: "var(--border-dark)" }}>
          Loading...
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "home", label: "Home" },
    { id: "values", label: "Value Wheel" },
    { id: "children", label: "My Children" },
    { id: "books", label: "Books" },
    { id: "stories", label: "Story Forge" },
    { id: "shield", label: "Shield" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--parchment)" }}>
      {/* Header */}
      <div
        className="text-center"
        style={{
          background: "linear-gradient(135deg, #2A1F14 0%, #3D2E1C 50%, #2A1F14 100%)",
          padding: "20px 24px",
          borderBottom: "3px solid var(--border-dark)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 32,
            fontWeight: 700,
            color: "#F5DEB3",
            letterSpacing: 2,
          }}
        >
          ⚜ VIRTUE<span style={{ color: "var(--gold)" }}>QUEST</span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-crimson)",
            fontSize: 13,
            color: "#A89070",
            marginTop: 4,
            fontStyle: "italic",
            letterSpacing: 1,
          }}
        >
          Classical Character Formation Through Story
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex overflow-x-auto"
        style={{
          background: "var(--ink)",
          padding: "0 16px",
          borderBottom: "3px solid var(--border-dark)",
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className="whitespace-nowrap transition-all"
            style={{
              padding: "12px 18px",
              background: page === item.id ? "#3D2E1C" : "transparent",
              color: page === item.id ? "#F5DEB3" : "#A89070",
              border: "none",
              borderBottom: page === item.id ? "3px solid var(--gold)" : "3px solid transparent",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-crimson)",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ═══ HOME ═══ */}
      {page === "home" && (
        <div>
          <div
            className="text-center"
            style={{
              background: "linear-gradient(180deg, #2A1F14 0%, #3D2E1C 100%)",
              padding: "60px 24px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 40,
                fontWeight: 700,
                color: "#F5DEB3",
                lineHeight: 1.2,
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              Shape the Soul Through Story
            </div>
            <div
              style={{
                fontFamily: "var(--font-crimson)",
                fontSize: 18,
                color: "var(--gold-dark)",
                maxWidth: 520,
                margin: "16px auto 0",
                lineHeight: 1.6,
              }}
            >
              Every civilization that endured understood one truth: character is formed in childhood,
              and stories are the oldest technology for forming it.
            </div>
            <button
              onClick={() => setPage("values")}
              style={{
                marginTop: 32,
                padding: "14px 36px",
                borderRadius: 8,
                background: "var(--gold)",
                color: "var(--ink)",
                border: "none",
                cursor: "pointer",
                fontSize: 17,
                fontWeight: 700,
                fontFamily: "var(--font-crimson)",
                letterSpacing: 0.5,
              }}
            >
              Begin Your Family&apos;s Quest →
            </button>
          </div>

          <div className="max-w-3xl mx-auto" style={{ padding: "32px 20px" }}>
            <div
              style={{
                padding: 24,
                borderRadius: 14,
                background: "#fff",
                border: "2px solid var(--border)",
                marginBottom: 20,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <h2
                className="text-center"
                style={{
                  fontFamily: "var(--font-crimson)",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: 20,
                }}
              >
                Why Virtue? Why Stories?
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-crimson)",
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "var(--ink-light)",
                }}
              >
                <p className="mb-4">
                  Plato taught that we should <em>&ldquo;tell children stories that will shape their
                  souls.&rdquo;</em> Twenty-four centuries later, modern research confirms what the
                  ancients knew: the stories children hear become the moral frameworks they live by.
                </p>
                <p className="mb-4">
                  Aristotle&apos;s great insight was that virtue is not merely known — it is{" "}
                  <strong>practiced</strong>. We don&apos;t become courageous by studying courage. We
                  become courageous by doing courageous things, again and again, until courage becomes
                  second nature. This process he called <em>hexis</em> — the forging of character
                  through habit.
                </p>
                <p className="mb-4">
                  Stories are where this practice begins. Through narrative, children rehearse virtue
                  in their imagination before they encounter it in life. They stand with Odysseus
                  against the Cyclops before they face their own bully. They sit with Charlotte as she
                  writes &ldquo;SOME PIG&rdquo; before they sacrifice for their own friends.
                </p>

                {/* Cycle Diagram */}
                <div
                  className="text-center my-6"
                  style={{
                    background: "var(--parchment-dark)",
                    borderRadius: 12,
                    padding: 24,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      color: "var(--ink)",
                      marginBottom: 16,
                      fontFamily: "var(--font-cormorant)",
                    }}
                  >
                    The Cycle of Character Formation
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-2">
                    {[
                      { label: "Stories", sub: "(Mimesis)", color: "var(--prudence)" },
                      { label: "→" },
                      { label: "Moral Imagination", sub: "(Empathy & Vision)", color: "var(--justice)" },
                      { label: "→" },
                      { label: "Habituation", sub: "(Repeated Practice)", color: "var(--courage)" },
                      { label: "→" },
                      { label: "Virtue", sub: "(Stable Character)", color: "var(--temperance)" },
                      { label: "→" },
                      { label: "Flourishing", sub: "(Eudaimonia)", color: "var(--gold)" },
                    ].map((item, i) =>
                      "sub" in item && item.sub ? (
                        <div
                          key={i}
                          className="rounded-lg text-white"
                          style={{
                            padding: "10px 16px",
                            background: item.color,
                            minWidth: 80,
                          }}
                        >
                          <div className="text-sm font-bold">{item.label}</div>
                          <div className="text-xs opacity-85">{item.sub}</div>
                        </div>
                      ) : (
                        <span key={i} className="text-xl" style={{ color: "var(--border-dark)" }}>
                          {item.label}
                        </span>
                      )
                    )}
                  </div>
                  <div
                    className="mt-3 text-xs italic"
                    style={{ color: "var(--border-dark)" }}
                  >
                    ↻ Flourishing feeds back into deeper engagement with stories
                  </div>
                </div>

                <p className="mb-4">
                  The four <strong>Cardinal Virtues</strong> — Prudence, Justice, Courage, and
                  Temperance — have anchored moral formation since antiquity. They are not arbitrary
                  values but the fundamental capacities a person needs to live well. VirtueQuest
                  organizes the entire world of children&apos;s literature around this time-tested
                  framework.
                </p>
                <p>
                  Your role as a parent is that of the <em>first storyteller</em>. VirtueQuest helps
                  you choose wisely, track where you&apos;ve been, spot the gaps, and ensure your
                  children encounter the full range of human excellence — not as abstract lessons, but
                  as living stories they will carry forever.
                </p>
              </div>
            </div>

            {/* Four Virtues Cards */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(VIRTUES).map(([key, v]) => (
                <div
                  key={key}
                  className="text-center rounded-xl"
                  style={{
                    padding: 18,
                    background: v.lightColor,
                    border: `2px solid ${v.color}22`,
                  }}
                >
                  <div className="text-3xl">{v.icon}</div>
                  <div
                    className="mt-1.5"
                    style={{
                      fontFamily: "var(--font-cormorant)",
                      fontSize: 20,
                      fontWeight: 700,
                      color: v.color,
                    }}
                  >
                    {v.name}
                  </div>
                  <div className="text-xs italic mt-0.5" style={{ color: "#777" }}>
                    {v.latin}
                  </div>
                  <div className="text-sm mt-2" style={{ color: "#555", lineHeight: 1.5 }}>
                    {v.description}
                  </div>
                </div>
              ))}
            </div>

            {appData.children.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={resetApp}
                  className="text-xs"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    background: "#fff",
                    color: "#999",
                    border: "2px solid #ddd",
                    cursor: "pointer",
                    fontFamily: "var(--font-crimson)",
                  }}
                >
                  Reset All Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ VALUE WHEEL ═══ */}
      {page === "values" && (
        <div className="max-w-3xl mx-auto" style={{ padding: "32px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-crimson)", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            Your Family&apos;s Value Wheel
          </h2>
          <p className="italic mb-7" style={{ fontSize: 14, color: "var(--border-dark)", fontFamily: "var(--font-crimson)" }}>
            Select the virtues your family wants to cultivate, or take our guided questionnaire.
          </p>

          {!wheelMode && (
            <div className="flex gap-3 mb-7">
              <button onClick={() => setWheelMode("manual")} style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                Choose Virtues Directly
              </button>
              <button onClick={() => setWheelMode("guided")} style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", color: "var(--prudence)", border: "2px solid var(--prudence)", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                Take Guided Questionnaire
              </button>
            </div>
          )}

          {wheelMode === "guided" && (
            <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <GuidedQuiz
                onComplete={(virtues) => {
                  updateAppData({ familyVirtues: virtues });
                  setWheelMode("manual");
                }}
              />
            </div>
          )}

          {wheelMode === "manual" && (
            <>
              {appData.familyVirtues.length > 0 && (
                <div className="rounded-lg mb-5" style={{ padding: 14, background: "#f0f8f4", border: "1px solid #2E5E4E33" }}>
                  <div className="text-sm font-semibold mb-1.5" style={{ color: "var(--temperance)" }}>
                    ✓ {appData.familyVirtues.length} virtues selected
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {appData.familyVirtues.map((v) => {
                      const sv = getSubVirtue(v);
                      const parent = getVirtueParent(v);
                      return sv && parent ? (
                        <span key={v} className="text-xs font-semibold rounded-full" style={{ padding: "3px 8px", background: `${VIRTUES[parent].color}20`, color: VIRTUES[parent].color }}>
                          {sv.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              <ValueWheel selectedVirtues={appData.familyVirtues} onToggle={toggleFamilyVirtue} />
              <div className="text-center mt-6">
                <button onClick={() => setPage("children")} style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                  Next: Add Your Children →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ CHILDREN ═══ */}
      {page === "children" && (
        <div className="max-w-3xl mx-auto" style={{ padding: "32px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-crimson)", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            My Children
          </h2>
          <p className="italic mb-7" style={{ fontSize: 14, color: "var(--border-dark)", fontFamily: "var(--font-crimson)" }}>
            Add your children to get personalized recommendations and track their virtue journey.
          </p>

          {appData.children.map((child, idx) => (
            <div key={idx} style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
                    {child.name}
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: "#777" }}>
                    Age {child.age} · {child.sex === "boy" ? "Boy" : "Girl"} · Reading:{" "}
                    {READING_LEVELS.find((r) => r.value === child.readingLevel)?.label || child.readingLevel}
                  </div>
                  {child.struggles.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {child.struggles.map((s) => (
                        <span key={s} className="text-xs font-semibold rounded-full" style={{ padding: "3px 8px", background: "#8B250015", color: "var(--courage)" }}>
                          {STRUGGLES_MAP[s]?.label || s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeChild(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 18 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}

          {!showAddChild ? (
            <button onClick={() => setShowAddChild(true)} style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
              + Add a Child
            </button>
          ) : (
            <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "var(--font-crimson)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>
                Add a Child
              </h3>
              <div className="mb-3.5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#555" }}>Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Mason" className="w-full rounded-lg" style={{ padding: "10px 12px", border: "2px solid var(--border)", fontSize: 14, fontFamily: "var(--font-crimson)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#555" }}>Age</label>
                  <input type="number" value={newAge} onChange={(e) => setNewAge(parseInt(e.target.value) || 0)} min={1} max={16} className="w-full rounded-lg" style={{ padding: "10px 12px", border: "2px solid var(--border)", fontSize: 14, fontFamily: "var(--font-crimson)" }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#555" }}>Sex</label>
                  <select value={newSex} onChange={(e) => setNewSex(e.target.value)} className="w-full rounded-lg" style={{ padding: "10px 12px", border: "2px solid var(--border)", fontSize: 14, fontFamily: "var(--font-crimson)" }}>
                    <option value="boy">Boy</option>
                    <option value="girl">Girl</option>
                  </select>
                </div>
              </div>
              <div className="mb-3.5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#555" }}>Reading Level</label>
                <select value={newReadingLevel || getDefaultReadingLevel(newAge)} onChange={(e) => setNewReadingLevel(e.target.value)} className="w-full rounded-lg" style={{ padding: "10px 12px", border: "2px solid var(--border)", fontSize: 14, fontFamily: "var(--font-crimson)" }}>
                  {READING_LEVELS.map((rl) => (
                    <option key={rl.value} value={rl.value}>{rl.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: "#555" }}>
                  What is this child struggling with?
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(STRUGGLES_MAP).map(([key, val]) => {
                    const active = newStruggles.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleStruggle(key)}
                        className="text-left rounded-lg transition-all"
                        style={{
                          padding: "8px 12px",
                          border: active ? "2px solid var(--courage)" : "2px solid var(--border)",
                          background: active ? "#8B250010" : "#fff",
                          cursor: "pointer",
                          fontSize: 13,
                          fontFamily: "var(--font-crimson)",
                          color: active ? "var(--courage)" : "#555",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {active ? "✓ " : ""}{val.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={addChild} style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                  Add {newName || "Child"}
                </button>
                <button onClick={() => setShowAddChild(false)} style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", color: "var(--prudence)", border: "2px solid var(--prudence)", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {appData.children.length > 0 && (
            <div className="text-center mt-6">
              <button onClick={() => setPage("books")} style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                Next: See Book Recommendations →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ BOOKS ═══ */}
      {page === "books" && (
        <div className="max-w-3xl mx-auto" style={{ padding: "32px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-crimson)", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            Book Recommendations
          </h2>

          {appData.children.length === 0 ? (
            <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-crimson)", fontSize: 15, color: "#777" }}>
                Add your children first to get personalized recommendations.
              </p>
              <button onClick={() => setPage("children")} className="mt-3" style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                Add Children →
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-5 flex-wrap">
                {appData.children.map((c, i) => (
                  <button key={i} onClick={() => setSelectedChild(i)} className="rounded-full font-semibold" style={{ padding: "8px 18px", border: selectedChild === i ? "2px solid var(--prudence)" : "2px solid #ccc", background: selectedChild === i ? "var(--prudence)" : "#fff", color: selectedChild === i ? "#fff" : "#333", cursor: "pointer", fontFamily: "var(--font-crimson)", fontSize: 14 }}>
                    {c.name}
                  </button>
                ))}
              </div>

              {(() => {
                const child = appData.children[selectedChild];
                if (!child) return null;
                const recVirtues = getChildRecommendations(selectedChild);
                const allSubIds = Object.values(VIRTUES).flatMap((v) => v.subVirtues.map((sv) => sv.id));
                const priorityBooks = getRecommendedBooks(
                  recVirtues.length > 0 ? recVirtues : allSubIds,
                  child.readingLevel,
                  child.readBooks
                );

                return (
                  <>
                    {recVirtues.length > 0 && (
                      <div className="rounded-lg mb-5" style={{ padding: 14, background: "#FFF8F0", border: "1px solid #F5A62333" }}>
                        <div className="text-sm font-semibold mb-1" style={{ color: "var(--justice)" }}>
                          🎯 Recommended focus for {child.name}:
                        </div>
                        <div className="text-sm" style={{ color: "#777" }}>
                          Based on struggles and family values: {recVirtues.map((v) => getSubVirtue(v)?.name || v).join(", ")}
                        </div>
                      </div>
                    )}

                    <p className="italic mb-5" style={{ fontSize: 14, color: "var(--border-dark)", fontFamily: "var(--font-crimson)" }}>
                      {priorityBooks.length} books for {child.name} (age {child.age}, {READING_LEVELS.find((r) => r.value === child.readingLevel)?.label})
                    </p>

                    {priorityBooks.slice(0, 15).map((book) => (
                      <BookCard
                        key={book.title}
                        book={book}
                        isRead={child.readBooks.includes(book.title)}
                        onMarkRead={() => markBookRead(selectedChild, book.title, book.virtues)}
                      />
                    ))}

                    {priorityBooks.length === 0 && (
                      <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)" }}>
                        <p style={{ fontFamily: "var(--font-crimson)", color: "#777" }}>
                          All recommended books have been read! Generate custom stories or explore other children.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ═══ STORY FORGE ═══ */}
      {page === "stories" && (
        <div className="max-w-3xl mx-auto" style={{ padding: "32px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-crimson)", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            The Story Forge
          </h2>
          <p className="italic mb-7" style={{ fontSize: 14, color: "var(--border-dark)", fontFamily: "var(--font-crimson)" }}>
            Generate an original story tailored to your child&apos;s virtue journey.
          </p>

          {appData.children.length === 0 ? (
            <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-crimson)", fontSize: 15, color: "#777" }}>
                Add your children first to generate personalized stories.
              </p>
              <button onClick={() => setPage("children")} className="mt-3" style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                Add Children →
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-5 flex-wrap">
                {appData.children.map((c, i) => (
                  <button key={i} onClick={() => setSelectedChild(i)} className="rounded-full font-semibold" style={{ padding: "8px 18px", border: selectedChild === i ? "2px solid var(--prudence)" : "2px solid #ccc", background: selectedChild === i ? "var(--prudence)" : "#fff", color: selectedChild === i ? "#fff" : "#333", cursor: "pointer", fontFamily: "var(--font-crimson)", fontSize: 14 }}>
                    {c.name}
                  </button>
                ))}
              </div>
              <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div className="text-sm mb-4" style={{ color: "#555", fontFamily: "var(--font-crimson)" }}>
                  Generating for: <strong>{appData.children[selectedChild]?.name}</strong> (age {appData.children[selectedChild]?.age})
                </div>
                <StoryGenerator child={appData.children[selectedChild]} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ SHIELD ═══ */}
      {page === "shield" && (
        <div className="max-w-3xl mx-auto" style={{ padding: "32px 20px" }}>
          <h2 style={{ fontFamily: "var(--font-crimson)", fontSize: 28, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
            The Virtue Shield
          </h2>
          <p className="italic mb-7" style={{ fontSize: 14, color: "var(--border-dark)", fontFamily: "var(--font-crimson)" }}>
            Track exposure across the four cardinal virtues. The shield fills as you read and log time together.
          </p>

          {appData.children.length === 0 ? (
            <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)" }}>
              <p style={{ fontFamily: "var(--font-crimson)", fontSize: 15, color: "#777" }}>
                Add your children first to see their shields.
              </p>
              <button onClick={() => setPage("children")} className="mt-3" style={{ padding: "12px 28px", borderRadius: 8, background: "var(--prudence)", color: "#fff", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-crimson)" }}>
                Add Children →
              </button>
            </div>
          ) : (
            <>
              <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <ShieldCrest childProfiles={appData.children} selectedChild={selectedChild} onSelectChild={setSelectedChild} />
              </div>

              {/* Gap Analysis */}
              {(() => {
                const child = appData.children[selectedChild];
                if (!child) return null;
                const gaps = getGaps(selectedChild);
                const gapsByParent: Record<string, string[]> = {};
                gaps.forEach((g) => {
                  const parent = getVirtueParent(g);
                  if (parent) {
                    if (!gapsByParent[parent]) gapsByParent[parent] = [];
                    gapsByParent[parent].push(g);
                  }
                });

                return gaps.length > 0 ? (
                  <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                    <h3 style={{ fontFamily: "var(--font-crimson)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
                      📋 Gaps to Address for {child.name}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: "#777" }}>
                      These virtues haven&apos;t been covered yet.
                    </p>
                    {Object.entries(gapsByParent).map(([parentKey, gapIds]) => (
                      <div key={parentKey} className="mb-3">
                        <div className="text-sm font-bold mb-1.5" style={{ color: VIRTUES[parentKey].color, fontFamily: "var(--font-crimson)" }}>
                          {VIRTUES[parentKey].icon} {VIRTUES[parentKey].name}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {gapIds.map((g) => (
                            <span key={g} className="text-xs rounded-full" style={{ padding: "4px 10px", background: `${VIRTUES[parentKey].color}10`, color: VIRTUES[parentKey].color, border: `1px dashed ${VIRTUES[parentKey].color}44` }}>
                              {getSubVirtue(g)?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center rounded-xl" style={{ padding: 24, background: "#f0f8f4", border: "2px solid #2E5E4E33", marginBottom: 20 }}>
                    <div className="text-3xl mb-2">🎉</div>
                    <div className="text-base font-semibold" style={{ color: "var(--temperance)", fontFamily: "var(--font-crimson)" }}>
                      {child.name}&apos;s shield is complete!
                    </div>
                    <div className="text-sm mt-1" style={{ color: "#777" }}>
                      Every virtue has been touched. Continue deepening coverage.
                    </div>
                  </div>
                );
              })()}

              {/* Log Time */}
              <div style={{ padding: 24, borderRadius: 14, background: "#fff", border: "2px solid var(--border)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontFamily: "var(--font-crimson)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
                  ⏱ Log Reading Time
                </h3>
                <p className="text-sm mb-4" style={{ color: "#777" }}>
                  Record time spent on specific virtues.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(VIRTUES).map(([key, virtue]) =>
                    virtue.subVirtues.map((sv) => {
                      const child = appData.children[selectedChild];
                      const logged = child?.virtueProgress?.[sv.id] || 0;
                      return (
                        <div
                          key={sv.id}
                          className="flex items-center justify-between rounded-lg"
                          style={{
                            padding: "8px 12px",
                            background: logged > 0 ? `${virtue.color}08` : "#fafafa",
                            border: `1px solid ${logged > 0 ? virtue.color + "33" : "#eee"}`,
                          }}
                        >
                          <div>
                            <div className="text-xs font-semibold" style={{ color: virtue.color }}>{sv.name}</div>
                            <div className="text-xs" style={{ color: "#999" }}>{logged} min</div>
                          </div>
                          <button
                            onClick={() => logTime(selectedChild, sv.id, 15)}
                            className="text-xs font-semibold rounded-md text-white"
                            style={{ padding: "4px 10px", background: virtue.color, border: "none", cursor: "pointer" }}
                          >
                            +15m
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="text-center mt-10"
        style={{
          background: "var(--ink)",
          padding: "24px 20px",
          borderTop: "3px solid var(--border-dark)",
        }}
      >
        <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 16, color: "var(--border-dark)" }}>
          ⚜ VirtueQuest
        </div>
        <div className="italic text-xs mt-1.5" style={{ color: "#5A4A3A", fontFamily: "var(--font-crimson)" }}>
          &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo; — Aristotle
        </div>
      </div>
    </div>
  );
}
