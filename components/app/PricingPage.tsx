"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Crown, Shield, Zap } from "lucide-react";
import { T, PLANS } from "@/lib/tokens";
import { trackEvent } from "@/lib/analytics";

export default function PricingPage({ premium, onUpgrade, onBack }: {
  premium: boolean;
  onUpgrade: () => void;
  onBack: () => void;
}) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setCheckoutLoading(true);
    trackEvent("checkout_started");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        // Stripe not configured — fall back to local upgrade
        onUpgrade();
      }
    } catch {
      // Fallback to local upgrade if Stripe unavailable
      onUpgrade();
    }
    setCheckoutLoading(false);
  };
  const yearlyDiscount = Math.round((1 - PLANS.premium.yearlyPrice / (PLANS.premium.monthlyPrice * 12)) * 100);

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      {/* Nav */}
      <nav style={{
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.gray100}`,
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", height: 56,
        }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
            color: T.gray600, background: "none", border: "none", cursor: "pointer",
          }}>
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h1 style={{
            fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800, color: T.navy, lineHeight: 1.15,
            letterSpacing: "-0.02em", marginBottom: 12,
          }}>
            {premium ? "You're on Premium" : "Unlock Unlimited Stories"}
          </h1>
          <p style={{
            fontFamily: T.fontSans, fontSize: 18, color: T.gray500,
            lineHeight: 1.6, maxWidth: 500, margin: "0 auto",
          }}>
            {premium
              ? "Thank you for supporting Bedtime Virtues. You have unlimited access to all features."
              : "Everything you need to get started is free. Upgrade when your family is ready for more."
            }
          </p>
        </motion.div>

        {/* Billing toggle */}
        {!premium && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{
              display: "flex", padding: 4, borderRadius: 100,
              background: T.gray100,
            }}>
              <button onClick={() => setBilling("monthly")} style={{
                padding: "8px 20px", borderRadius: 100,
                background: billing === "monthly" ? T.white : "transparent",
                color: billing === "monthly" ? T.navy : T.gray500,
                border: "none", cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                boxShadow: billing === "monthly" ? T.shadow : "none",
              }}>
                Monthly
              </button>
              <button onClick={() => setBilling("yearly")} style={{
                padding: "8px 20px", borderRadius: 100,
                background: billing === "yearly" ? T.white : "transparent",
                color: billing === "yearly" ? T.navy : T.gray500,
                border: "none", cursor: "pointer",
                fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                boxShadow: billing === "yearly" ? T.shadow : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                Yearly
                <span style={{
                  padding: "2px 6px", borderRadius: 100,
                  background: T.green, color: T.white,
                  fontSize: 11, fontWeight: 700,
                }}>
                  Save {yearlyDiscount}%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: 32, borderRadius: T.radiusLg,
              background: T.white, border: `1px solid ${T.gray200}`,
            }}
          >
            <div style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gray500, marginBottom: 4,
            }}>Free</div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 42, fontWeight: 800,
              color: T.navy, lineHeight: 1, marginBottom: 4,
            }}>
              $0
            </div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 14, color: T.gray400, marginBottom: 28,
            }}>
              Free forever
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLANS.free.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Check size={16} color={T.green} strokeWidth={3} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray700, lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={onBack} style={{
              width: "100%", marginTop: 28, padding: "12px 20px",
              fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
              color: T.navy, background: T.gray50,
              border: `1px solid ${T.gray200}`, borderRadius: T.radiusSm,
              cursor: "pointer",
            }}>
              {premium ? "Included" : "Current Plan"}
            </button>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              padding: 32, borderRadius: T.radiusLg,
              background: T.navy, color: T.white,
              position: "relative", overflow: "hidden",
              boxShadow: T.shadowXl,
            }}
          >
            <div style={{
              position: "absolute", top: 16, right: 16,
              padding: "4px 12px", borderRadius: 100,
              background: T.gold, fontFamily: T.fontSans,
              fontSize: 11, fontWeight: 700, color: T.navy,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Zap size={11} />
              {premium ? "ACTIVE" : "POPULAR"}
            </div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
              color: T.gray400, marginBottom: 4,
            }}>Premium</div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 42, fontWeight: 800, lineHeight: 1,
              marginBottom: 4,
            }}>
              ${billing === "yearly" ? Math.round(PLANS.premium.yearlyPrice / 12) : PLANS.premium.monthlyPrice}
              <span style={{ fontSize: 16, fontWeight: 500, color: T.gray400 }}>/mo</span>
            </div>
            <div style={{
              fontFamily: T.fontSans, fontSize: 14, color: T.gray400, marginBottom: 28,
            }}>
              {billing === "yearly"
                ? `$${PLANS.premium.yearlyPrice}/year · billed annually`
                : `$${PLANS.premium.monthlyPrice}/month · billed monthly`
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PLANS.premium.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Check size={16} color={T.gold} strokeWidth={3} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray200, lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>

            {premium ? (
              <div style={{
                width: "100%", marginTop: 28, padding: "12px 20px",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                color: T.navy, background: T.gold,
                borderRadius: T.radiusSm, textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Crown size={16} />
                Active
              </div>
            ) : (
              <button onClick={handleStripeCheckout} disabled={checkoutLoading} style={{
                width: "100%", marginTop: 28, padding: "12px 20px",
                fontFamily: T.fontSans, fontSize: 15, fontWeight: 600,
                color: T.navy, background: T.gold, border: "none",
                borderRadius: T.radiusSm, cursor: checkoutLoading ? "default" : "pointer",
                transition: "opacity 0.15s",
                opacity: checkoutLoading ? 0.6 : 1,
              }}>
                {checkoutLoading ? "Loading..." : `Start Premium — ${billing === "yearly" ? `$${PLANS.premium.yearlyPrice}/year` : `$${PLANS.premium.monthlyPrice}/month`}`}
              </button>
            )}
          </motion.div>
        </div>

        {/* FAQ / Trust */}
        {!premium && (
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{
              fontFamily: T.fontSans, fontSize: 14, color: T.gray400,
            }}>
              Cancel anytime · No credit card required to start
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
