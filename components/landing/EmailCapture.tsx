"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, ArrowRight } from "lucide-react";
import { T } from "@/lib/tokens";
import { trackEvent } from "@/lib/analytics";

export default function EmailCapture({ variant = "full" }: { variant?: "full" | "inline" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus("error");
        setErrorMsg(data.error);
      } else {
        setStatus("success");
        trackEvent("email_subscribed");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, maxWidth: 400 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          style={{
            flex: 1, padding: "8px 14px", borderRadius: T.radiusSm,
            border: `1px solid ${T.gray200}`, fontFamily: T.fontSans,
            fontSize: 13, color: T.gray800, background: T.white, outline: "none",
          }}
        />
        {status === "success" ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: T.fontSans, fontSize: 13, color: T.green, fontWeight: 600,
          }}>
            <Check size={14} /> Subscribed
          </div>
        ) : (
          <button type="submit" disabled={status === "loading"} style={{
            padding: "8px 16px", borderRadius: T.radiusSm,
            background: T.navy, color: T.white, border: "none",
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
            cursor: status === "loading" ? "default" : "pointer",
            opacity: status === "loading" ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}>
            Subscribe
          </button>
        )}
      </form>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.5 }}
      style={{
        padding: 40, borderRadius: T.radiusLg,
        background: T.navy, textAlign: "center",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Subtle gradient accent */}
      <div style={{
        position: "absolute", top: -100, right: -100, width: 300, height: 300,
        borderRadius: "50%", background: `radial-gradient(circle, ${T.gold}15, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <Mail size={24} color={T.gold} />
        </div>

        <h3 style={{
          fontFamily: T.fontSans, fontSize: 24, fontWeight: 700,
          color: T.white, marginBottom: 8,
        }}>
          Weekly Virtue Stories &amp; Reading Ideas
        </h3>

        <p style={{
          fontFamily: T.fontSans, fontSize: 15, color: T.gray300,
          lineHeight: 1.6, maxWidth: 460, margin: "0 auto 28px",
        }}>
          Join our newsletter for virtue-building tips, book recommendations,
          and family discussion guides delivered to your inbox.
        </p>

        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "14px 24px", borderRadius: T.radiusSm,
              background: "rgba(5,150,105,0.2)", color: T.green,
              fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
            }}
          >
            <Check size={18} />
            You&apos;re subscribed! Check your inbox.
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" style={{
            justifyContent: "center", alignItems: "center", maxWidth: 440, margin: "0 auto",
          }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@email.com"
              required
              style={{
                flex: 1, width: "100%", padding: "14px 18px", borderRadius: T.radiusSm,
                border: "1px solid rgba(255,255,255,0.15)",
                fontFamily: T.fontSans, fontSize: 15, color: T.white,
                background: "rgba(255,255,255,0.08)", outline: "none",
              }}
            />
            <button type="submit" disabled={status === "loading"} style={{
              padding: "14px 28px", borderRadius: T.radiusSm,
              background: T.gold, color: T.navy, border: "none",
              fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
              cursor: status === "loading" ? "default" : "pointer",
              opacity: status === "loading" ? 0.6 : 1,
              display: "flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
            }}>
              Subscribe
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {status === "error" && (
          <p style={{
            fontFamily: T.fontSans, fontSize: 13, color: "#f87171",
            marginTop: 12,
          }}>
            {errorMsg}
          </p>
        )}

        <p style={{
          fontFamily: T.fontSans, fontSize: 12, color: T.gray500,
          marginTop: 16,
        }}>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </motion.div>
  );
}
