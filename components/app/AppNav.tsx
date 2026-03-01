"use client";
import { useState } from "react";
import { Shield, LayoutDashboard, BookOpen, Pen, BarChart3, Heart, Crown, Menu, X } from "lucide-react";
import { T } from "@/lib/tokens";

const NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "virtues", label: "Virtues", icon: Heart },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "stories", label: "Story Forge", icon: Pen },
  { id: "shield", label: "Shield", icon: BarChart3 },
] as const;

export default function AppNav({ currentPage, onNavigate, premium, onPricing }: {
  currentPage: string;
  onNavigate: (page: any) => void;
  premium: boolean;
  onPricing: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${T.gray100}`,
    }}>
      <div style={{
        maxWidth: 960, margin: "0 auto", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 56,
      }}>
        {/* Logo */}
        <button
          onClick={() => handleNav("landing")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: T.fontSans, fontWeight: 700, fontSize: 16, color: T.navy,
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <Shield size={20} strokeWidth={2.5} color={T.gold} />
          Virtue Forge
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex" style={{ alignItems: "center", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: T.radiusSm,
                  background: active ? T.bg : "transparent",
                  color: active ? T.navy : T.gray500,
                  border: "none", cursor: "pointer",
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: active ? 600 : 500,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Premium badge or upgrade */}
        <div className="hidden lg:flex" style={{ alignItems: "center" }}>
          {premium ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 100,
              background: T.goldSubtle, border: `1px solid ${T.gold}30`,
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.gold,
            }}>
              <Crown size={13} />
              Premium
            </div>
          ) : (
            <button onClick={onPricing} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: T.radiusSm,
              background: T.navy, color: T.gold,
              border: "none", cursor: "pointer",
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
            }}>
              <Crown size={13} />
              Upgrade
            </button>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, borderRadius: T.radiusSm,
            background: "none", border: "none", cursor: "pointer",
            color: T.navy,
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{
            position: "absolute", top: 56, left: 0, right: 0,
            background: "rgba(255,255,255,0.98)", backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${T.gray100}`,
            boxShadow: T.shadowLg,
            padding: "8px 16px 16px",
            zIndex: 49,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "12px 14px", borderRadius: T.radiusSm,
                  background: active ? T.bg : "transparent",
                  color: active ? T.navy : T.gray600,
                  border: "none", cursor: "pointer",
                  fontFamily: T.fontSans, fontSize: 15, fontWeight: active ? 600 : 500,
                  textAlign: "left",
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}

          <div style={{ borderTop: `1px solid ${T.gray100}`, marginTop: 8, paddingTop: 12 }}>
            {premium ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 100,
                background: T.goldSubtle, border: `1px solid ${T.gold}30`,
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.gold,
              }}>
                <Crown size={14} />
                Premium Active
              </div>
            ) : (
              <button onClick={() => { onPricing(); setMobileMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "10px 14px", borderRadius: T.radiusSm,
                background: T.navy, color: T.gold,
                border: "none", cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              }}>
                <Crown size={14} />
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
