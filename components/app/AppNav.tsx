"use client";
import { Shield, LayoutDashboard, BookOpen, Pen, BarChart3, Heart, Crown } from "lucide-react";
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
          onClick={() => onNavigate("landing")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: T.fontSans, fontWeight: 700, fontSize: 16, color: T.navy,
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          <Shield size={20} strokeWidth={2.5} color={T.gold} />
          Virtue Forge
        </button>

        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
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
                <span style={{ display: "none" }}>{item.label}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Premium badge or upgrade */}
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
    </nav>
  );
}
