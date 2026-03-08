"use client";
import { motion } from "framer-motion";
import { BookOpen, Pen, BarChart3, ChevronRight, Flame, Brain, Heart, TreePine, Settings, RotateCcw, UserCog } from "lucide-react";
import { VIRTUES, getSubVirtue, getVirtueParent, getRecommendedBooks, STRUGGLES_MAP } from "@/lib/data";
import { T, VC } from "@/lib/tokens";
import type { AppData } from "@/lib/data";

const VIRTUE_ICONS: Record<string, typeof Brain> = {
  prudence: Brain, justice: Heart, courage: Flame, temperance: TreePine,
};

export default function Dashboard({ appData, selChild, setSelChild, onNavigate, premium, onResetAll }: {
  appData: AppData;
  selChild: number;
  setSelChild: (i: number) => void;
  onNavigate: (page: any) => void;
  premium: boolean;
  onResetAll?: () => void;
}) {
  const child = appData.children[selChild];
  const hasChildren = appData.children.length > 0;

  // Calculate virtue coverage for active child
  const getVirtueStats = () => {
    if (!child) return [];
    return Object.entries(VIRTUES).map(([key, virtue]) => {
      const total = virtue.subVirtues.length;
      const covered = virtue.subVirtues.filter((sv) => (child.virtueProgress?.[sv.id] || 0) > 0).length;
      const time = virtue.subVirtues.reduce((s, sv) => s + (child.virtueProgress?.[sv.id] || 0), 0);
      return { key, virtue, covered, total, time, pct: total > 0 ? covered / total : 0 };
    });
  };

  const virtueStats = getVirtueStats();
  const totalBooks = child?.readBooks?.length || 0;
  const totalMinutes = virtueStats.reduce((s, v) => s + v.time, 0);
  const overallPct = virtueStats.length > 0
    ? Math.round(virtueStats.reduce((s, v) => s + v.pct, 0) / virtueStats.length * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
    >
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: T.fontSans, fontSize: 28, fontWeight: 700,
          color: T.navy, marginBottom: 6,
        }}>
          {hasChildren ? `${child?.name}'s Character Journey` : "Welcome to Virtue Forge"}
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          {hasChildren
            ? `${totalBooks} books read · ${totalMinutes} minutes logged · ${overallPct}% virtue coverage`
            : "Get started by selecting your family's virtues and adding your children."
          }
        </p>
      </div>

      {/* Child selector */}
      {appData.children.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {appData.children.map((c, i) => (
            <button key={i} onClick={() => setSelChild(i)} style={{
              padding: "8px 18px", borderRadius: 100,
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

      {!hasChildren ? (
        /* Empty state for new users */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: "Choose Virtues", desc: "Select the virtues your family wants to cultivate", page: "virtues", icon: Heart, color: VC.prudence.main },
            { title: "Add Children", desc: "Create profiles for personalized recommendations", page: "children", icon: BookOpen, color: VC.justice.main },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button key={card.page} onClick={() => onNavigate(card.page)} style={{
                padding: 28, borderRadius: T.radiusLg, textAlign: "left",
                background: T.white, border: `1px solid ${T.gray200}`,
                cursor: "pointer", transition: "border-color 0.15s",
              }}>
                <Icon size={24} color={card.color} strokeWidth={2} style={{ marginBottom: 12 }} />
                <div style={{
                  fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
                  color: T.navy, marginBottom: 6,
                }}>{card.title}</div>
                <div style={{
                  fontFamily: T.fontSans, fontSize: 14, color: T.gray500,
                }}>{card.desc}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* Virtue Shield Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{
            marginBottom: 24,
          }}>
            {virtueStats.map((stat) => {
              const vc = VC[stat.key as keyof typeof VC];
              const Icon = VIRTUE_ICONS[stat.key];
              return (
                <div key={stat.key} style={{
                  padding: 20, borderRadius: T.radius,
                  background: T.white, border: `1px solid ${T.gray100}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Icon size={18} color={vc.main} strokeWidth={2} />
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      color: vc.main,
                    }}>{stat.virtue.name}</span>
                  </div>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 24, fontWeight: 700,
                    color: T.navy, marginBottom: 4,
                  }}>
                    {stat.covered}/{stat.total}
                  </div>
                  <div style={{
                    height: 4, borderRadius: 2, background: T.gray100,
                  }}>
                    <div style={{
                      height: 4, borderRadius: 2, background: vc.main,
                      width: `${stat.pct * 100}%`, transition: "width 0.5s",
                    }} />
                  </div>
                  <div style={{
                    fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
                    marginTop: 6,
                  }}>
                    {stat.time} min logged
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{
            marginBottom: 24,
          }}>
            {[
              { title: "Browse Books", desc: `${totalBooks} read so far`, page: "books", icon: BookOpen, color: VC.prudence.main, bg: VC.prudence.light },
              { title: "Forge a Story", desc: "AI-generated tales", page: "stories", icon: Pen, color: VC.courage.main, bg: VC.courage.light },
              { title: "View Compass", desc: `${overallPct}% complete`, page: "shield", icon: BarChart3, color: VC.temperance.main, bg: VC.temperance.light },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.page} onClick={() => onNavigate(action.page)} style={{
                  padding: 24, borderRadius: T.radius, textAlign: "left",
                  background: T.white, border: `1px solid ${T.gray100}`,
                  cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.boxShadow = T.shadowMd; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = T.gray100; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: action.bg, display: "flex", alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Icon size={20} color={action.color} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                      color: T.navy, marginBottom: 2,
                    }}>{action.title}</div>
                    <div style={{
                      fontFamily: T.fontSans, fontSize: 13, color: T.gray400,
                    }}>{action.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recommended Next Reads */}
          {child && (() => {
            const recVirtues = new Set<string>();
            child.struggles.forEach((s) => { STRUGGLES_MAP[s]?.virtues.forEach((v) => recVirtues.add(v)); });
            appData.familyVirtues.forEach((v) => recVirtues.add(v));
            const allIds = Object.values(VIRTUES).flatMap((v) => v.subVirtues.map((sv) => sv.id));
            const books = getRecommendedBooks(
              recVirtues.size > 0 ? [...recVirtues] : allIds,
              child.readingLevel,
              child.readBooks
            ).slice(0, 3);

            return books.length > 0 ? (
              <div style={{
                padding: 24, borderRadius: T.radius,
                background: T.white, border: `1px solid ${T.gray100}`,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 16,
                }}>
                  <h3 style={{
                    fontFamily: T.fontSans, fontSize: 16, fontWeight: 600, color: T.navy,
                  }}>
                    Recommended Next Reads
                  </h3>
                  <button onClick={() => onNavigate("books")} style={{
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
                    color: VC.prudence.main, background: "none", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                {books.map((book) => {
                  const pk = getVirtueParent(book.virtues[0]);
                  const vc = pk ? VC[pk as keyof typeof VC] : { main: T.gray500 };
                  return (
                    <div key={book.title} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 0", borderTop: `1px solid ${T.gray100}`,
                    }}>
                      <div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.navy,
                        }}>{book.title}</div>
                        <div style={{
                          fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
                        }}>by {book.author}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {book.virtues.slice(0, 2).map((v) => (
                          <span key={v} style={{
                            fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
                            padding: "2px 8px", borderRadius: 100,
                            background: vc.main + "10", color: vc.main,
                          }}>
                            {getSubVirtue(v)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}

          {/* Manage & Settings */}
          <div style={{
            marginTop: 32, paddingTop: 24,
            borderTop: `1px solid ${T.gray100}`,
          }}>
            <div style={{
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
              color: T.gray400, textTransform: "uppercase", letterSpacing: "0.05em",
              marginBottom: 12,
            }}>
              Manage
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => onNavigate("children")} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: T.radiusSm,
                background: T.white, color: T.gray600,
                border: `1px solid ${T.gray200}`, cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
              }}>
                <UserCog size={14} />
                Edit Children
              </button>
              <button onClick={() => onNavigate("virtues")} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: T.radiusSm,
                background: T.white, color: T.gray600,
                border: `1px solid ${T.gray200}`, cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
              }}>
                <Heart size={14} />
                Edit Virtues
              </button>
              {onResetAll && (
                <button onClick={() => {
                  if (window.confirm("Reset all data? This will clear your children, virtues, reading history, and all progress. This cannot be undone.")) {
                    onResetAll();
                  }
                }} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: T.radiusSm,
                  background: T.white, color: T.red,
                  border: `1px solid ${T.gray200}`, cursor: "pointer",
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 500,
                }}>
                  <RotateCcw size={14} />
                  Reset All Data
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
