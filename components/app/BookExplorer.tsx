"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, ExternalLink, Check, ChevronDown, Sparkles, X } from "lucide-react";
import {
  VIRTUES, BOOKS_DATABASE, READING_LEVELS, STRUGGLES_MAP,
  getSubVirtue, getVirtueParent, getAmazonUrl, type AppData,
} from "@/lib/data";
import { T, VC } from "@/lib/tokens";
import VirtueQuiz from "./VirtueQuiz";
import ChildPills from "./ChildPills";

// Use centralized affiliate link helper
const getAmazonLink = getAmazonUrl;

function getBookshopLink(title: string, author: string): string {
  const query = encodeURIComponent(`${title} ${author}`);
  return `https://bookshop.org/search?keywords=${query}&affiliate=bedtimevirtues`;
}

export default function BookExplorer({ appData, selChild, setSelChild, onMarkRead, onUpdateFamilyVirtues }: {
  appData: AppData;
  selChild: number;
  setSelChild: (i: number) => void;
  onMarkRead: (ci: number, title: string, vids: string[]) => void;
  onUpdateFamilyVirtues: (virtues: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [availFilter, setAvailFilter] = useState<string>("all");
  const [showRead, setShowRead] = useState(true);
  const [showCount, setShowCount] = useState(10);
  const [quizOpen, setQuizOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const child = appData.children[selChild];
  const hasChildren = appData.children.length > 0;
  const familyVirtues = appData.familyVirtues;

  const toggleFamilyVirtue = (id: string) => {
    onUpdateFamilyVirtues(
      familyVirtues.includes(id)
        ? familyVirtues.filter((v) => v !== id)
        : [...familyVirtues, id]
    );
  };

  const addFamilyVirtue = (id: string) => {
    if (!id || familyVirtues.includes(id)) return;
    onUpdateFamilyVirtues([...familyVirtues, id]);
  };

  // Recommendation pool: family virtues + child struggles
  const recVirtueIds = useMemo(() => {
    const ids = new Set<string>();
    if (child) child.struggles.forEach((s) => { STRUGGLES_MAP[s]?.virtues.forEach((v) => ids.add(v)); });
    familyVirtues.forEach((v) => ids.add(v));
    return [...ids];
  }, [child, familyVirtues]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let books = [...BOOKS_DATABASE];

    if (search.trim()) {
      const q = search.toLowerCase();
      books = books.filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q)
      );
    }

    // Focus mode: only show books matching family virtues
    if (focusMode && familyVirtues.length > 0) {
      books = books.filter((b) => b.virtues.some((v) => familyVirtues.includes(v)));
    }

    if (levelFilter !== "all") {
      books = books.filter((b) => b.readingLevel === levelFilter);
    }
    if (availFilter === "free") {
      books = books.filter((b) => b.publicDomain);
    } else if (availFilter === "purchase") {
      books = books.filter((b) => b.amazon);
    }
    if (!showRead && child) {
      books = books.filter((b) => !child.readBooks.includes(b.title));
    }

    // Sort: books matching family virtues / struggles rise to top
    if (recVirtueIds.length > 0) {
      books.sort((a, b) => {
        const aMatch = a.virtues.filter((v) => recVirtueIds.includes(v)).length;
        const bMatch = b.virtues.filter((v) => recVirtueIds.includes(v)).length;
        return bMatch - aMatch;
      });
    }

    return books;
  }, [search, levelFilter, availFilter, showRead, child, recVirtueIds, focusMode, familyVirtues]);

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px", borderRadius: T.radiusSm,
    border: `1px solid ${T.gray200}`, background: T.white,
    fontFamily: T.fontSans, fontSize: 13, color: T.gray700,
    cursor: "pointer", appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
    paddingRight: 28,
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
          Book Explorer
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          {BOOKS_DATABASE.length} hand-curated books mapped to classical virtues.
          {hasChildren ? ` Showing recommendations for ${child?.name}.` : ""}
        </p>
        <p style={{
          fontFamily: T.fontSans, fontSize: 11, color: T.gray400,
          marginTop: 4,
        }}>
          Links to Amazon are affiliate links. We may earn a small commission at no cost to you.
        </p>
      </div>

      <ChildPills children={appData.children} selected={selChild} onSelect={setSelChild} />

      {/* Family Virtues — chips drive recommendations and optional focus filter */}
      <div style={{
        padding: 20, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 12,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 10, flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
              color: T.gray400, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Family Virtues
            </div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 12, color: T.gray500, marginTop: 2,
            }}>
              Books matching these rise to the top{familyVirtues.length > 0 ? "." : " — add a few to personalize."}
            </div>
          </div>
          <button
            onClick={() => setQuizOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 10px", borderRadius: T.radiusSm,
              background: T.goldSubtle, border: `1px solid ${T.gold}30`,
              cursor: "pointer", fontFamily: T.fontSans,
              fontSize: 12, fontWeight: 600, color: T.gold,
            }}
          >
            <Sparkles size={12} />
            Help me choose
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {familyVirtues.map((id) => {
            const sv = getSubVirtue(id);
            const pk = getVirtueParent(id);
            if (!sv || !pk) return null;
            const vc = VC[pk as keyof typeof VC];
            return (
              <button
                key={id}
                onClick={() => toggleFamilyVirtue(id)}
                aria-label={`Remove ${sv.name}`}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px 5px 12px", borderRadius: 100,
                  background: vc.main, color: T.white,
                  border: "none", cursor: "pointer",
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                }}
              >
                {sv.name}
                <X size={12} strokeWidth={2.5} />
              </button>
            );
          })}

          <select
            value=""
            onChange={(e) => { addFamilyVirtue(e.target.value); e.currentTarget.value = ""; }}
            style={{
              padding: "6px 28px 6px 12px", borderRadius: 100,
              border: `1px dashed ${T.gray300}`, background: T.white,
              fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
              cursor: "pointer", appearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
            }}
          >
            <option value="">+ Add virtue</option>
            {Object.entries(VIRTUES).map(([key, v]) => (
              <optgroup key={key} label={v.name}>
                {v.subVirtues
                  .filter((sv) => !familyVirtues.includes(sv.id))
                  .map((sv) => (
                    <option key={sv.id} value={sv.id}>{sv.name} — {sv.desc}</option>
                  ))}
              </optgroup>
            ))}
          </select>

          {familyVirtues.length > 0 && (
            <button
              onClick={() => setFocusMode(!focusMode)}
              aria-pressed={focusMode}
              style={{
                padding: "6px 12px", borderRadius: 100,
                background: focusMode ? T.navy : T.white,
                color: focusMode ? T.white : T.gray500,
                border: focusMode ? "none" : `1px solid ${T.gray200}`,
                cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
                marginLeft: "auto",
              }}
            >
              {focusMode ? "Focus: on" : "Focus only"}
            </button>
          )}
        </div>
      </div>

      {/* Search & secondary filters */}
      <div style={{
        padding: 16, borderRadius: T.radius, background: T.white,
        border: `1px solid ${T.gray100}`, marginBottom: 20,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: T.radiusSm,
          background: T.gray50, border: `1px solid ${T.gray200}`,
          marginBottom: 12,
        }}>
          <Search size={18} color={T.gray400} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or description..."
            style={{
              flex: 1, border: "none", background: "none", outline: "none",
              fontFamily: T.fontSans, fontSize: 14, color: T.gray800,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={14} color={T.gray400} />
            <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gray500 }}>Filter:</span>
          </div>

          <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setShowCount(10); }} style={selectStyle}>
            <option value="all">All reading levels</option>
            {READING_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select value={availFilter} onChange={(e) => { setAvailFilter(e.target.value); setShowCount(10); }} style={selectStyle}>
            <option value="all">All availability</option>
            <option value="free">Free online</option>
            <option value="purchase">Purchase</option>
          </select>

          {hasChildren && (
            <button
              onClick={() => setShowRead(!showRead)}
              style={{
                padding: "8px 12px", borderRadius: T.radiusSm,
                border: `1px solid ${T.gray200}`, cursor: "pointer",
                background: showRead ? T.white : T.navy,
                color: showRead ? T.gray600 : T.white,
                fontFamily: T.fontSans, fontSize: 13,
              }}
            >
              {showRead ? "Hide read" : "Show read"}
            </button>
          )}

          <span style={{
            fontFamily: T.fontSans, fontSize: 12, color: T.gray400, marginLeft: "auto",
          }}>
            {Math.min(showCount, filteredBooks.length)} of {filteredBooks.length} books
          </span>
        </div>
      </div>

      {/* Book List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filteredBooks.slice(0, showCount).map((book) => {
          const pk = getVirtueParent(book.virtues[0]);
          const vc = pk ? VC[pk as keyof typeof VC] : { main: T.gray500, light: T.gray50 };
          const isRead = child?.readBooks?.includes(book.title) || false;
          const isRecommended = recVirtueIds.length > 0 && book.virtues.some((v) => recVirtueIds.includes(v));

          return (
            <div key={book.title} style={{
              padding: 20, borderRadius: T.radius,
              background: isRead ? T.greenLight : T.white,
              border: `1px solid ${isRead ? T.green + "30" : T.gray100}`,
              transition: "border-color 0.15s",
            }}>
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{
                      fontFamily: T.fontSans, fontSize: 16, fontWeight: 600, color: T.navy,
                    }}>
                      {book.title}
                    </h3>
                    {isRecommended && (
                      <span style={{
                        fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                        padding: "2px 6px", borderRadius: 4,
                        background: T.gold + "20", color: T.gold,
                        textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 13, color: T.gray500, marginBottom: 8,
                  }}>
                    by {book.author} ({book.year > 0 ? book.year : `c. ${Math.abs(book.year)} BC`})
                  </p>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 14, color: T.gray600,
                    lineHeight: 1.5, marginBottom: 10,
                  }}>
                    {book.desc}
                  </p>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {book.virtues.map((v) => {
                      const vpk = getVirtueParent(v);
                      const vvc = vpk ? VC[vpk as keyof typeof VC] : { main: T.gray500 };
                      return (
                        <span key={v} style={{
                          fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
                          padding: "3px 8px", borderRadius: 100,
                          background: vvc.main + "10", color: vvc.main,
                        }}>
                          {getSubVirtue(v)?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 flex-wrap sm:flex-nowrap sm:shrink-0 sm:min-w-[120px]">
                  {book.amazon && (
                    <a href={getAmazonLink(book.amazon)} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 14px", borderRadius: T.radiusSm,
                      background: "#FF9900", color: T.white,
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      textDecoration: "none",
                    }}>
                      Amazon <ExternalLink size={12} />
                    </a>
                  )}
                  {book.amazon && (
                    <a href={getBookshopLink(book.title, book.author)} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 14px", borderRadius: T.radiusSm,
                      background: "#355E3B", color: T.white,
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      textDecoration: "none",
                    }}>
                      Bookshop <ExternalLink size={12} />
                    </a>
                  )}
                  {book.publicDomain && (
                    <a href={book.publicDomain} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 14px", borderRadius: T.radiusSm,
                      background: VC.prudence.main, color: T.white,
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      textDecoration: "none",
                    }}>
                      Free Online <ExternalLink size={12} />
                    </a>
                  )}
                  {hasChildren && (
                    <button onClick={() => onMarkRead(selChild, book.title, book.virtues)} style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 14px", borderRadius: T.radiusSm,
                      background: isRead ? T.green : T.white,
                      color: isRead ? T.white : T.green,
                      border: isRead ? "none" : `2px solid ${T.green}`,
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      cursor: "pointer",
                    }}>
                      <Check size={14} />
                      {isRead ? "Read" : "Mark Read"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredBooks.length > showCount && (
          <button
            onClick={() => setShowCount((c) => c + 10)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 20px", borderRadius: T.radius,
              background: T.white, border: `1px solid ${T.gray200}`,
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.navy, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = T.gray50; }}
            onMouseOut={(e) => { e.currentTarget.style.background = T.white; }}
          >
            <ChevronDown size={16} />
            Show More Books ({filteredBooks.length - showCount} remaining)
          </button>
        )}

        {filteredBooks.length > 10 && showCount > 10 && showCount >= filteredBooks.length && (
          <button
            onClick={() => setShowCount(10)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "12px 20px", borderRadius: T.radius,
              background: "transparent", border: `1px solid ${T.gray200}`,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
              color: T.gray500, cursor: "pointer",
            }}
          >
            Show Fewer
          </button>
        )}

        {filteredBooks.length === 0 && (
          <div style={{
            padding: 40, borderRadius: T.radius, background: T.white,
            border: `1px solid ${T.gray100}`, textAlign: "center",
          }}>
            <BookOpen size={32} color={T.gray300} style={{ marginBottom: 12 }} />
            <p style={{
              fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
            }}>
              No books match your filters. Try broadening your search.
            </p>
          </div>
        )}
      </div>

      <VirtueQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={(ids) => {
          onUpdateFamilyVirtues([...new Set([...familyVirtues, ...ids])]);
        }}
      />
    </motion.div>
  );
}
