"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, ArrowRight, Crown, User } from "lucide-react";
import { STRUGGLES_MAP, READING_LEVELS, getDefaultReadingLevel, type ChildProfile } from "@/lib/data";
import { T, VC, PLANS } from "@/lib/tokens";

export default function ChildManager({ children, onAdd, onRemove, premium, onNext, onPricing }: {
  children: ChildProfile[];
  onAdd: (child: ChildProfile) => void;
  onRemove: (i: number) => void;
  premium: boolean;
  onNext: () => void;
  onPricing: () => void;
}) {
  const [showForm, setShowForm] = useState(children.length === 0);
  const [name, setName] = useState("");
  const [age, setAge] = useState(5);
  const [sex, setSex] = useState("boy");
  const [readingLevel, setReadingLevel] = useState("");
  const [struggles, setStruggles] = useState<string[]>([]);

  const atLimit = !premium && children.length >= PLANS.free.children;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(), age, sex,
      readingLevel: readingLevel || getDefaultReadingLevel(age),
      struggles, readBooks: [], virtueProgress: {},
    });
    setName(""); setAge(5); setSex("boy"); setReadingLevel(""); setStruggles([]);
    setShowForm(false);
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
          My Children
        </h1>
        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray500,
        }}>
          Add your children for personalized book recommendations and character tracking.
        </p>
      </div>

      {/* Existing children */}
      {children.map((child, i) => (
        <div key={i} style={{
          padding: 20, borderRadius: T.radius, background: T.white,
          border: `1px solid ${T.gray100}`, marginBottom: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: T.bg, display: "flex", alignItems: "center",
              justifyContent: "center",
            }}>
              <User size={20} color={T.gray400} />
            </div>
            <div>
              <div style={{
                fontFamily: T.fontSans, fontSize: 16, fontWeight: 600, color: T.navy,
              }}>{child.name}</div>
              <div style={{
                fontFamily: T.fontSans, fontSize: 13, color: T.gray500,
              }}>
                Age {child.age} · {child.sex === "boy" ? "Boy" : "Girl"} · {READING_LEVELS.find((r) => r.value === child.readingLevel)?.label}
              </div>
              {child.struggles.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {child.struggles.map((s) => (
                    <span key={s} style={{
                      fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
                      padding: "2px 8px", borderRadius: 100,
                      background: VC.courage.light, color: VC.courage.main,
                    }}>
                      {STRUGGLES_MAP[s]?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => onRemove(i)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.gray300, padding: 8, borderRadius: 6,
          }}>
            <X size={18} />
          </button>
        </div>
      ))}

      {/* Add child form */}
      {showForm ? (
        <div style={{
          padding: 24, borderRadius: T.radius, background: T.white,
          border: `1px solid ${T.gray100}`, marginBottom: 20,
        }}>
          <h3 style={{
            fontFamily: T.fontSans, fontSize: 18, fontWeight: 600,
            color: T.navy, marginBottom: 20,
          }}>Add a Child</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: "block", fontFamily: T.fontSans, fontSize: 13,
              fontWeight: 600, color: T.navy, marginBottom: 6,
            }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mason" style={inputStyle} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" style={{ marginBottom: 14 }}>
            <div>
              <label style={{
                display: "block", fontFamily: T.fontSans, fontSize: 13,
                fontWeight: 600, color: T.navy, marginBottom: 6,
              }}>Age</label>
              <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                min={1} max={16} style={inputStyle} />
            </div>
            <div>
              <label style={{
                display: "block", fontFamily: T.fontSans, fontSize: 13,
                fontWeight: 600, color: T.navy, marginBottom: 6,
              }}>Sex</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: "block", fontFamily: T.fontSans, fontSize: 13,
              fontWeight: 600, color: T.navy, marginBottom: 6,
            }}>Reading Level</label>
            <select value={readingLevel || getDefaultReadingLevel(age)}
              onChange={(e) => setReadingLevel(e.target.value)} style={inputStyle}>
              {READING_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontFamily: T.fontSans, fontSize: 13,
              fontWeight: 600, color: T.navy, marginBottom: 10,
            }}>What is this child struggling with?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.entries(STRUGGLES_MAP).map(([key, val]) => {
                const active = struggles.includes(key);
                return (
                  <button key={key} onClick={() => setStruggles((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p, key])}
                    style={{
                      padding: "8px 12px", borderRadius: T.radiusSm, textAlign: "left",
                      cursor: "pointer",
                      border: active ? `2px solid ${VC.courage.main}` : `1px solid ${T.gray200}`,
                      background: active ? VC.courage.light : T.white,
                      fontFamily: T.fontSans, fontSize: 13,
                      color: active ? VC.courage.main : T.gray700,
                      fontWeight: active ? 600 : 400,
                    }}>
                    {active ? "✓ " : ""}{val.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdd} style={{
              padding: "10px 24px", borderRadius: T.radiusSm,
              background: T.navy, color: T.gold, border: "none",
              fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
              cursor: "pointer",
            }}>
              Add {name || "Child"}
            </button>
            {children.length > 0 && (
              <button onClick={() => setShowForm(false)} style={{
                padding: "10px 18px", borderRadius: T.radiusSm,
                background: T.white, color: T.gray600,
                border: `1px solid ${T.gray200}`,
                fontFamily: T.fontSans, fontSize: 14, cursor: "pointer",
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {atLimit ? (
            <button onClick={onPricing} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px", borderRadius: T.radiusSm,
              background: T.navy, color: T.gold, border: "none",
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}>
              <Crown size={16} />
              Upgrade for Unlimited Profiles
            </button>
          ) : (
            <button onClick={() => setShowForm(true)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 20px", borderRadius: T.radiusSm,
              background: T.white, color: T.navy,
              border: `1px solid ${T.gray200}`,
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}>
              <Plus size={16} />
              Add Another Child
            </button>
          )}
        </div>
      )}

      {/* Continue button */}
      {children.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onNext} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 24px", borderRadius: T.radiusSm,
            background: T.navy, color: T.gold, border: "none",
            fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
            cursor: "pointer",
          }}>
            See Book Recommendations
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
