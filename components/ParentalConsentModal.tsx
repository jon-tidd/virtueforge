"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import { T } from "@/lib/tokens";
import { trackEvent } from "@/lib/analytics";

const CONSENT_KEY = "virtueforge-parental-consent";

export function hasParentalConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "granted";
}

export function setParentalConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, granted ? "granted" : "declined");
}

export default function ParentalConsentModal({ open, onConsent, onDecline }: {
  open: boolean;
  onConsent: () => void;
  onDecline: () => void;
}) {
  const handleConsent = () => {
    setParentalConsent(true);
    trackEvent("consent_granted");
    onConsent();
  };

  const handleDecline = () => {
    trackEvent("consent_declined");
    onDecline();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,22,40,0.6)", backdropFilter: "blur(4px)",
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            style={{
              maxWidth: 480, width: "100%", padding: 32,
              borderRadius: T.radiusLg, background: T.white,
              boxShadow: T.shadowXl, position: "relative",
            }}
          >
            <button onClick={handleDecline} style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none", cursor: "pointer",
              color: T.gray400, padding: 4,
            }}>
              <X size={18} />
            </button>

            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: T.goldSubtle, display: "flex",
              alignItems: "center", justifyContent: "center",
              marginBottom: 20, border: `1px solid ${T.gold}30`,
            }}>
              <Shield size={24} color={T.gold} />
            </div>

            <h2 style={{
              fontFamily: T.fontSans, fontSize: 22, fontWeight: 700,
              color: T.navy, marginBottom: 12, lineHeight: 1.3,
            }}>
              Quick confirmation before we begin
            </h2>

            <p style={{
              fontFamily: T.fontSans, fontSize: 15, color: T.gray600,
              lineHeight: 1.7, marginBottom: 8,
            }}>
              To create a personalized story, we&apos;ll use your child&apos;s name, age, and situation.
              This information is stored on your device and sent securely to our AI story engine
              (Anthropic) to generate the story. We don&apos;t store it on our servers.
            </p>

            <p style={{
              fontFamily: T.fontSans, fontSize: 15, color: T.gray600,
              lineHeight: 1.7, marginBottom: 24,
            }}>
              As the parent or guardian, do you give permission?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleConsent} style={{
                width: "100%", padding: "14px 24px",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                color: T.white, background: T.navy, border: "none",
                borderRadius: T.radiusSm, cursor: "pointer",
                transition: "opacity 0.15s",
              }}>
                Yes, I&apos;m the parent/guardian
              </button>

              <button onClick={handleDecline} style={{
                width: "100%", padding: "14px 24px",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 500,
                color: T.gray500, background: T.gray50,
                border: `1px solid ${T.gray200}`,
                borderRadius: T.radiusSm, cursor: "pointer",
              }}>
                No thanks &mdash; skip personalization
              </button>
            </div>

            <p style={{
              fontFamily: T.fontSans, fontSize: 12, color: T.gray400,
              marginTop: 16, lineHeight: 1.5, textAlign: "center",
            }}>
              Your data stays on your device. See our{" "}
              <button onClick={() => { /* navigate to privacy */ }} style={{
                color: T.navy, background: "none", border: "none",
                cursor: "pointer", textDecoration: "underline",
                fontFamily: T.fontSans, fontSize: 12,
              }}>
                Privacy Policy
              </button>{" "}
              for details.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
