"use client";
import { useState, useEffect } from "react";
import {
  VIRTUES, STRUGGLES_MAP, READING_LEVELS, getVirtueParent, getSubVirtue,
  getDefaultReadingLevel, getRecommendedBooks, type AppData, type ChildProfile,
} from "@/lib/data";
import { loadData, saveData } from "@/lib/storage";
import { T, VC, btn, card, inputStyle } from "@/lib/tokens";
import VirtueCompass from "./VirtueCompass";
import GuidedQuiz from "./GuidedQuiz";
import BookCard from "./BookCard";
import StoryGenerator from "./StoryGenerator";
import ShieldCrest from "./ShieldCrest";

export default function VirtueForgeApp() {
  const [page, setPage] = useState("home");
  const [appData, setAppData] = useState<AppData>({ children: [], familyVirtues: [], setupComplete: false });
  const [loaded, setLoaded] = useState(false);
  const [selChild, setSelChild] = useState(0);
  const [wheelMode, setWheelMode] = useState<"compass" | "guided" | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nn, setNn] = useState(""); const [na, setNa] = useState(5);
  const [ns, setNs] = useState("boy"); const [nrl, setNrl] = useState("");
  const [nst, setNst] = useState<string[]>([]);

  useEffect(() => { setAppData(loadData()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveData(appData); }, [appData, loaded]);

  const upd = (u: Partial<AppData>) => setAppData((p) => ({ ...p, ...u }));

  const addChild = () => {
    if (!nn.trim()) return;
    upd({ children: [...appData.children, { name: nn.trim(), age: na, sex: ns, readingLevel: nrl || getDefaultReadingLevel(na), struggles: nst, readBooks: [], virtueProgress: {} }] });
    setNn(""); setNa(5); setNs("boy"); setNrl(""); setNst([]); setShowAdd(false);
  };

  const markRead = (ci: number, title: string, vids: string[]) => {
    const ch = [...appData.children]; const c = { ...ch[ci] };
    const was = c.readBooks.includes(title);
    c.readBooks = was ? c.readBooks.filter((b) => b !== title) : [...c.readBooks, title];
    const p = { ...c.virtueProgress };
    vids.forEach((v) => { p[v] = was ? Math.max(0, (p[v] || 0) - 15) : (p[v] || 0) + 15; });
    c.virtueProgress = p; ch[ci] = c; upd({ children: ch });
  };

  const logTime = (ci: number, vid: string, min: number) => {
    const ch = [...appData.children]; const c = { ...ch[ci] };
    c.virtueProgress = { ...c.virtueProgress, [vid]: (c.virtueProgress[vid] || 0) + min };
    ch[ci] = c; upd({ children: ch });
  };

  const removeChild = (i: number) => {
    upd({ children: appData.children.filter((_, idx) => idx !== i) });
    if (selChild >= appData.children.length - 1) setSelChild(Math.max(0, appData.children.length - 2));
  };

  const getRecs = (ci: number) => {
    const c = appData.children[ci]; if (!c) return [];
    const r = new Set<string>();
    c.struggles.forEach((s) => { STRUGGLES_MAP[s]?.virtues.forEach((v) => r.add(v)); });
    appData.familyVirtues.forEach((v) => r.add(v));
    return [...r];
  };

  const getGaps = (ci: number) => {
    const c = appData.children[ci]; if (!c) return [];
    return Object.values(VIRTUES).flatMap((v) => v.subVirtues).filter((sv) => !(c.virtueProgress?.[sv.id])).map((sv) => sv.id);
  };

  if (!loaded) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: T.offWhite }}>
      <div style={{ fontSize: 20, color: T.gray400, fontFamily: T.font }}>Loading...</div>
    </div>
  );

  const navItems = [
    { id: "home", label: "Home" }, { id: "virtues", label: "Family Virtues" },
    { id: "children", label: "My Children" }, { id: "books", label: "Books" },
    { id: "stories", label: "Story Forge" }, { id: "shield", label: "Shield" },
  ];

  const sec: React.CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "40px 24px" };
  const h2: React.CSSProperties = { fontFamily: T.font, fontSize: 34, fontWeight: 700, color: T.navy, marginBottom: 8, letterSpacing: -0.5 };
  const sub: React.CSSProperties = { fontSize: 17, color: T.gray600, marginBottom: 32, fontFamily: T.font, lineHeight: 1.5 };

  const childTabs = (
    <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
      {appData.children.map((c, i) => (
        <button key={i} onClick={() => setSelChild(i)} style={{
          ...btn(selChild === i ? T.navy : T.white, selChild === i ? T.gold : T.navy,
            selChild === i ? "none" : `2px solid ${T.gray200}`),
          padding: "10px 22px", fontSize: 15,
        }}>{c.name}</button>
      ))}
    </div>
  );

  const noChildren = (
    <div style={card}>
      <p style={{ fontFamily: T.font, fontSize: 17, color: T.gray600 }}>Add your children first to get started.</p>
      <button onClick={() => setPage("children")} style={{ ...btn(T.navy, T.gold), marginTop: 16 }}>Add Children →</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.offWhite }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 100%)`, padding: "22px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: T.font, fontSize: 34, fontWeight: 700, color: T.gold, letterSpacing: 3 }}>
          ⚒ VIRTUE FORGE
        </div>
        <div style={{ fontFamily: T.font, fontSize: 14, color: T.gray400, marginTop: 4, letterSpacing: 1 }}>
          Building Character Through Story
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <nav style={{ display: "flex", background: T.navy, padding: "0 16px", overflowX: "auto", borderBottom: `3px solid ${T.gold}40` }}>
        {navItems.map((n) => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            padding: "14px 20px", background: page === n.id ? T.navyLight : "transparent",
            color: page === n.id ? T.gold : T.gray400, border: "none",
            borderBottom: page === n.id ? `3px solid ${T.gold}` : "3px solid transparent",
            cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: T.font, whiteSpace: "nowrap",
          }}>{n.label}</button>
        ))}
      </nav>

      {/* ═══ HOME ═══ */}
      {page === "home" && (
        <div>
          <div style={{ background: `linear-gradient(180deg, ${T.navy} 0%, ${T.navyMid} 100%)`, padding: "70px 24px", textAlign: "center" }}>
            <div style={{ fontFamily: T.font, fontSize: 48, fontWeight: 700, color: T.white, lineHeight: 1.15, maxWidth: 620, margin: "0 auto" }}>
              Shape the Soul<br />Through Story
            </div>
            <div style={{ fontFamily: T.font, fontSize: 20, color: T.gray200, maxWidth: 540, margin: "20px auto 0", lineHeight: 1.6 }}>
              Every civilization that endured understood one truth: character is formed in childhood, and stories are the oldest technology for forming it.
            </div>
            <button onClick={() => setPage("virtues")} style={{
              ...btn(T.gold, T.navy), marginTop: 36, fontSize: 19, padding: "16px 40px", letterSpacing: 0.5,
            }}>
              Begin Your Family&apos;s Quest →
            </button>
          </div>

          <div style={sec}>
            <div style={card}>
              <h2 style={{ fontFamily: T.font, fontSize: 28, fontWeight: 700, color: T.navy, marginBottom: 24, textAlign: "center" }}>
                Why Virtue? Why Stories?
              </h2>
              <div style={{ fontFamily: T.font, fontSize: 17, lineHeight: 1.9, color: T.gray800 }}>
                <p style={{ marginBottom: 18 }}>
                  Plato taught that we should <em>&ldquo;tell children stories that will shape their souls.&rdquo;</em> Twenty-four centuries later, modern research confirms what the ancients knew: the stories children hear become the moral frameworks they live by.
                </p>
                <p style={{ marginBottom: 18 }}>
                  Aristotle&apos;s great insight was that virtue is not merely known — it is <strong>practiced</strong>. We don&apos;t become courageous by studying courage. We become courageous by doing courageous things, again and again, until courage becomes second nature. This process he called <em>hexis</em> — the forging of character through habit.
                </p>
                <p style={{ marginBottom: 18 }}>
                  Stories are where this practice begins. Through narrative, children rehearse virtue in their imagination before they encounter it in life. They stand with Odysseus against the Cyclops before they face their own fears. They sit with Charlotte as she writes &ldquo;SOME PIG&rdquo; before they sacrifice for their own friends.
                </p>

                {/* Cycle */}
                <div style={{ background: T.navy, borderRadius: 12, padding: 28, margin: "28px 0", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: T.gold, marginBottom: 20, fontFamily: T.font }}>
                    The Cycle of Character Formation
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 }}>
                    {[
                      { l: "Stories", s: "Mimesis", c: VC.prudence.main },
                      null,
                      { l: "Moral Imagination", s: "Empathy", c: VC.justice.main },
                      null,
                      { l: "Habituation", s: "Practice", c: VC.courage.main },
                      null,
                      { l: "Virtue", s: "Character", c: VC.temperance.main },
                      null,
                      { l: "Flourishing", s: "Eudaimonia", c: T.gold },
                    ].map((item, i) => item ? (
                      <div key={i} style={{ padding: "10px 16px", borderRadius: 8, background: item.c, color: T.white, minWidth: 80 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{item.l}</div>
                        <div style={{ fontSize: 11, opacity: 0.85 }}>{item.s}</div>
                      </div>
                    ) : (
                      <span key={i} style={{ fontSize: 22, color: T.gold }}>→</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 13, color: T.gray400, fontStyle: "italic" }}>
                    ↻ Flourishing feeds back into deeper engagement with stories
                  </div>
                </div>

                <p style={{ marginBottom: 18 }}>
                  The four <strong>Cardinal Virtues</strong> — Prudence, Justice, Courage, and Temperance — have anchored moral formation since antiquity. They are not arbitrary values but the fundamental capacities a person needs to live well.
                </p>
                <p>
                  Your role as a parent is that of the <em>first storyteller</em>. Virtue Forge helps you choose wisely, track where you&apos;ve been, spot the gaps, and ensure your children encounter the full range of human excellence.
                </p>
              </div>
            </div>

            {/* Four Virtues Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {Object.entries(VIRTUES).map(([key, v]) => {
                const vc = VC[key];
                return (
                  <div key={key} style={{ padding: 22, borderRadius: 12, background: T.white, border: `2px solid ${vc.main}20`, textAlign: "center", boxShadow: T.shadow }}>
                    <div style={{ fontSize: 36 }}>{v.icon}</div>
                    <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: vc.main, marginTop: 6 }}>{v.name}</div>
                    <div style={{ fontSize: 13, fontStyle: "italic", color: T.gray400, marginTop: 2 }}>{v.latin}</div>
                    <div style={{ fontSize: 15, color: T.gray600, marginTop: 10, lineHeight: 1.5 }}>{v.description}</div>
                  </div>
                );
              })}
            </div>

            {appData.children.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <button onClick={() => { upd({ children: [], familyVirtues: [], setupComplete: false }); setPage("home"); }}
                  style={{ ...btn(T.white, T.gray400, `1px solid ${T.gray200}`), fontSize: 13 }}>
                  Reset All Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FAMILY VIRTUES ═══ */}
      {page === "virtues" && (
        <div style={sec}>
          <h2 style={h2}>Family Virtues</h2>
          <p style={sub}>Select the virtues your family wants to cultivate. Click a quadrant on the compass or expand the panels below.</p>

          {!wheelMode && (
            <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
              <button onClick={() => setWheelMode("compass")} style={{ ...btn(T.navy, T.gold), fontSize: 17 }}>
                Select Virtues
              </button>
              <button onClick={() => setWheelMode("guided")} style={{ ...btn(T.white, T.navy, `2px solid ${T.navy}`), fontSize: 17 }}>
                Take Guided Quiz
              </button>
            </div>
          )}

          {wheelMode === "guided" && (
            <div style={card}>
              <GuidedQuiz onComplete={(v) => { upd({ familyVirtues: v }); setWheelMode("compass"); }} />
            </div>
          )}

          {wheelMode === "compass" && (
            <>
              {appData.familyVirtues.length > 0 && (
                <div style={{ padding: 16, borderRadius: 10, background: T.greenLight, border: `2px solid ${T.green}30`, marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.green, marginBottom: 8 }}>
                    ✓ {appData.familyVirtues.length} virtues selected
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {appData.familyVirtues.map((v) => {
                      const sv = getSubVirtue(v); const pk = getVirtueParent(v);
                      return sv && pk ? (
                        <span key={v} style={{ fontSize: 13, padding: "5px 12px", borderRadius: 20, background: T.white, color: VC[pk].main, fontWeight: 700, border: `1px solid ${VC[pk].main}40` }}>
                          {sv.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              <VirtueCompass selectedVirtues={appData.familyVirtues}
                onToggle={(id) => upd({ familyVirtues: appData.familyVirtues.includes(id) ? appData.familyVirtues.filter((v) => v !== id) : [...appData.familyVirtues, id] })} />
              <div style={{ textAlign: "center", marginTop: 28 }}>
                <button onClick={() => setPage("children")} style={{ ...btn(T.navy, T.gold), fontSize: 17 }}>
                  Next: Add Your Children →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ MY CHILDREN ═══ */}
      {page === "children" && (
        <div style={sec}>
          <h2 style={h2}>My Children</h2>
          <p style={sub}>Add your children to get personalized book recommendations and track their character journey.</p>

          {appData.children.map((child, i) => (
            <div key={i} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: T.font, fontSize: 24, fontWeight: 700, color: T.navy }}>{child.name}</div>
                  <div style={{ fontSize: 16, color: T.gray600, marginTop: 4 }}>
                    Age {child.age} · {child.sex === "boy" ? "Boy" : "Girl"} · {READING_LEVELS.find((r) => r.value === child.readingLevel)?.label}
                  </div>
                  {child.struggles.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      {child.struggles.map((s) => (
                        <span key={s} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 20, background: VC.courage.light, color: VC.courage.main, fontWeight: 700 }}>
                          {STRUGGLES_MAP[s]?.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeChild(i)} style={{ background: "none", border: "none", cursor: "pointer", color: T.gray200, fontSize: 24, fontWeight: 700 }}>✕</button>
              </div>
            </div>
          ))}

          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} style={{ ...btn(T.navy, T.gold), fontSize: 17 }}>+ Add a Child</button>
          ) : (
            <div style={card}>
              <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.navy, marginBottom: 20 }}>Add a Child</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Name</label>
                <input value={nn} onChange={(e) => setNn(e.target.value)} placeholder="e.g., Mason" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Age</label>
                  <input type="number" value={na} onChange={(e) => setNa(parseInt(e.target.value) || 0)} min={1} max={16} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Sex</label>
                  <select value={ns} onChange={(e) => setNs(e.target.value)} style={inputStyle}>
                    <option value="boy">Boy</option><option value="girl">Girl</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Reading Level</label>
                <select value={nrl || getDefaultReadingLevel(na)} onChange={(e) => setNrl(e.target.value)} style={inputStyle}>
                  {READING_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 10 }}>What is this child struggling with?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(STRUGGLES_MAP).map(([key, val]) => {
                    const act = nst.includes(key);
                    return (
                      <button key={key} onClick={() => setNst((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p, key])}
                        style={{ padding: "10px 14px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                          border: act ? `2px solid ${T.red}` : `2px solid ${T.gray100}`,
                          background: act ? VC.courage.light : T.white, fontSize: 14,
                          fontFamily: T.font, color: act ? T.red : T.gray800, fontWeight: act ? 700 : 400 }}>
                        {act ? "✓ " : ""}{val.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={addChild} style={{ ...btn(T.navy, T.gold), fontSize: 17 }}>Add {nn || "Child"}</button>
                <button onClick={() => setShowAdd(false)} style={{ ...btn(T.white, T.navy, `2px solid ${T.navy}`) }}>Cancel</button>
              </div>
            </div>
          )}

          {appData.children.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button onClick={() => setPage("books")} style={{ ...btn(T.navy, T.gold), fontSize: 17 }}>
                Next: See Book Recommendations →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ BOOKS ═══ */}
      {page === "books" && (
        <div style={sec}>
          <h2 style={h2}>Book Recommendations</h2>
          {appData.children.length === 0 ? noChildren : (
            <>
              {childTabs}
              {(() => {
                const child = appData.children[selChild]; if (!child) return null;
                const rv = getRecs(selChild);
                const allIds = Object.values(VIRTUES).flatMap((v) => v.subVirtues.map((sv) => sv.id));
                const books = getRecommendedBooks(rv.length > 0 ? rv : allIds, child.readingLevel, child.readBooks);
                return (
                  <>
                    {rv.length > 0 && (
                      <div style={{ padding: 18, borderRadius: 10, background: VC.justice.light, border: `2px solid ${VC.justice.main}25`, marginBottom: 20 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: VC.justice.main, marginBottom: 6 }}>🎯 Recommended focus for {child.name}:</div>
                        <div style={{ fontSize: 15, color: T.gray600 }}>{rv.map((v) => getSubVirtue(v)?.name).filter(Boolean).join(", ")}</div>
                      </div>
                    )}
                    <p style={{ ...sub, marginBottom: 20 }}>{books.length} books for {child.name} (age {child.age}, {READING_LEVELS.find((r) => r.value === child.readingLevel)?.label})</p>
                    {books.slice(0, 15).map((b) => (
                      <BookCard key={b.title} book={b} isRead={child.readBooks.includes(b.title)} onMarkRead={() => markRead(selChild, b.title, b.virtues)} />
                    ))}
                    {books.length === 0 && <div style={card}><p style={{ fontSize: 16, color: T.gray600 }}>All recommended books read! Try the Story Forge.</p></div>}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ═══ STORY FORGE ═══ */}
      {page === "stories" && (
        <div style={sec}>
          <h2 style={h2}>The Story Forge</h2>
          <p style={sub}>Generate an original story tailored to your child&apos;s virtue journey and current struggles.</p>
          {appData.children.length === 0 ? noChildren : (
            <>
              {childTabs}
              <div style={card}>
                <div style={{ fontSize: 17, color: T.gray600, marginBottom: 20 }}>
                  Generating for: <strong style={{ color: T.navy }}>{appData.children[selChild]?.name}</strong> (age {appData.children[selChild]?.age})
                </div>
                <StoryGenerator child={appData.children[selChild]} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ SHIELD ═══ */}
      {page === "shield" && (
        <div style={sec}>
          <h2 style={h2}>The Virtue Shield</h2>
          <p style={sub}>Track your children&apos;s exposure across the four cardinal virtues. The shield fills as you read and log time.</p>
          {appData.children.length === 0 ? noChildren : (
            <>
              <div style={card}>
                <ShieldCrest childProfiles={appData.children} selectedChild={selChild} onSelectChild={setSelChild} />
              </div>

              {/* Gap analysis */}
              {(() => {
                const child = appData.children[selChild]; if (!child) return null;
                const gaps = getGaps(selChild);
                const gapMap: Record<string, string[]> = {};
                gaps.forEach((g) => { const pk = getVirtueParent(g); if (pk) { if (!gapMap[pk]) gapMap[pk] = []; gapMap[pk].push(g); } });
                return gaps.length > 0 ? (
                  <div style={card}>
                    <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.navy, marginBottom: 14 }}>📋 Gaps for {child.name}</h3>
                    <p style={{ fontSize: 15, color: T.gray600, marginBottom: 18 }}>These virtues haven&apos;t been covered yet.</p>
                    {Object.entries(gapMap).map(([pk, gids]) => (
                      <div key={pk} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: VC[pk].main, marginBottom: 8 }}>{VIRTUES[pk].icon} {VIRTUES[pk].name}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {gids.map((g) => (
                            <span key={g} style={{ fontSize: 13, padding: "5px 12px", borderRadius: 20, background: VC[pk].light, color: VC[pk].main, border: `1px dashed ${VC[pk].main}50` }}>
                              {getSubVirtue(g)?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...card, background: T.greenLight, textAlign: "center", border: `2px solid ${T.green}30` }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.green }}>{child.name}&apos;s shield is complete!</div>
                    <div style={{ fontSize: 15, color: T.gray600, marginTop: 6 }}>Every virtue touched. Keep deepening.</div>
                  </div>
                );
              })()}

              {/* Log time */}
              <div style={card}>
                <h3 style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.navy, marginBottom: 14 }}>⏱ Log Reading Time</h3>
                <p style={{ fontSize: 15, color: T.gray600, marginBottom: 18 }}>Record time spent reading, discussing, or practicing virtues.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(VIRTUES).map(([key, virtue]) =>
                    virtue.subVirtues.map((sv) => {
                      const c = appData.children[selChild]; const logged = c?.virtueProgress?.[sv.id] || 0;
                      const vc = VC[key];
                      return (
                        <div key={sv.id} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 14px", borderRadius: 8,
                          background: logged > 0 ? vc.light : T.white,
                          border: `1px solid ${logged > 0 ? vc.main + "30" : T.gray100}`,
                        }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: vc.main }}>{sv.name}</div>
                            <div style={{ fontSize: 13, color: T.gray400 }}>{logged} min</div>
                          </div>
                          <button onClick={() => logTime(selChild, sv.id, 15)} style={{
                            padding: "6px 14px", borderRadius: 6, background: vc.main,
                            color: T.white, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 700,
                          }}>+15m</button>
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

      {/* ═══ FOOTER ═══ */}
      <div style={{ background: T.navy, padding: "28px 24px", textAlign: "center", marginTop: 48, borderTop: `3px solid ${T.gold}40` }}>
        <div style={{ fontFamily: T.font, fontSize: 18, color: T.gold }}>⚒ Virtue Forge</div>
        <div style={{ fontFamily: T.font, fontSize: 14, color: T.gray400, marginTop: 8, fontStyle: "italic" }}>
          &ldquo;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&rdquo; — Aristotle
        </div>
      </div>
    </div>
  );
}
