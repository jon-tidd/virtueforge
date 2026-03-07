"use client";
import { T } from "@/lib/tokens";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  const h2Style: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 22, fontWeight: 700,
    color: T.navy, marginTop: 40, marginBottom: 12,
  };
  const h3Style: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 17, fontWeight: 600,
    color: T.navy, marginTop: 28, marginBottom: 8,
  };
  const pStyle: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 15, color: T.gray600,
    lineHeight: 1.75, marginBottom: 12,
  };
  const liStyle: React.CSSProperties = {
    fontFamily: T.fontSans, fontSize: 15, color: T.gray600,
    lineHeight: 1.75, marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: T.white }}>
      <nav style={{
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.gray100}`,
      }}>
        <div style={{
          maxWidth: 700, margin: "0 auto", padding: "0 24px",
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

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Shield size={20} color={T.gold} />
          <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.gold, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Legal
          </span>
        </div>

        <h1 style={{
          fontFamily: T.fontSans, fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 800, color: T.navy, lineHeight: 1.15,
          marginBottom: 8,
        }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.gray400, marginBottom: 32 }}>
          Last Updated: March 7, 2026
        </p>

        <p style={pStyle}>
          Virtue Forge (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the websites at virtueforge.ai
          and virtueforge.org (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, and
          protect information when you use our Service.
        </p>

        <h2 style={h2Style}>Children&apos;s Privacy &amp; COPPA Compliance</h2>
        <p style={pStyle}>
          Virtue Forge is designed for use by <strong>parents and guardians</strong>, not by children directly.
          We do not knowingly collect personal information directly from children under 13.
          All child-related information (first name, age, and optional behavioral challenges) is provided
          by and controlled by the parent or guardian for the purpose of generating personalized stories.
        </p>
        <p style={pStyle}>
          We obtain verifiable parental consent through an in-app confirmation dialog before any
          child-related information is used for story generation. Parents may decline personalization
          at any time.
        </p>

        <h2 style={h2Style}>Information We Collect</h2>

        <h3 style={h3Style}>Information You Provide</h3>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li style={liStyle}><strong>Child information:</strong> First name, age, sex, reading level, and optional behavioral challenges (e.g., &ldquo;struggles with sharing&rdquo;). This is used solely to personalize AI-generated stories.</li>
          <li style={liStyle}><strong>Family virtues:</strong> Your selected virtue focus areas for your family.</li>
          <li style={liStyle}><strong>Email address:</strong> If you subscribe to our newsletter or create an account.</li>
          <li style={liStyle}><strong>Payment information:</strong> If you subscribe to Premium, payment is processed by Stripe. We never see or store your full credit card number.</li>
        </ul>

        <h3 style={h3Style}>Information Collected Automatically</h3>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li style={liStyle}><strong>Usage analytics:</strong> We use Vercel Analytics and Speed Insights to collect anonymous page view and performance data. No personal information is included.</li>
        </ul>

        <h2 style={h2Style}>How We Use Information</h2>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li style={liStyle}>To generate personalized AI stories tailored to your child&apos;s age, name, and situation.</li>
          <li style={liStyle}>To recommend books matched to your family&apos;s virtue focus and reading level.</li>
          <li style={liStyle}>To track virtue progress on your device.</li>
          <li style={liStyle}>To process payments and manage subscriptions (via Stripe).</li>
          <li style={liStyle}>To send newsletter content if you subscribe.</li>
          <li style={liStyle}>We never use child information for advertising, marketing, or profiling.</li>
        </ul>

        <h2 style={h2Style}>Third-Party Services</h2>
        <p style={pStyle}>We use the following third-party services that may process data on our behalf:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li style={liStyle}><strong>Anthropic (Claude AI):</strong> When you generate a story, your child&apos;s first name, age, sex, and situation are included in the prompt sent to Anthropic&apos;s API. Anthropic processes this data to generate the story and does not retain it for training. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: T.navy }}>Anthropic&apos;s Privacy Policy</a>.</li>
          <li style={liStyle}><strong>Vercel:</strong> Hosting and anonymous analytics. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: T.navy }}>Vercel&apos;s Privacy Policy</a>.</li>
          <li style={liStyle}><strong>Supabase:</strong> User authentication and data storage (when account features are enabled). See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: T.navy }}>Supabase&apos;s Privacy Policy</a>.</li>
          <li style={liStyle}><strong>Stripe:</strong> Payment processing for Premium subscriptions. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: T.navy }}>Stripe&apos;s Privacy Policy</a>.</li>
          <li style={liStyle}><strong>Amazon:</strong> We link to books on Amazon through the Amazon Associates Program. Amazon&apos;s own privacy policy governs their site.</li>
          <li style={liStyle}><strong>Bookshop.org:</strong> We link to books on Bookshop.org through their affiliate program. Bookshop.org&apos;s own privacy policy governs their site.</li>
        </ul>

        <h2 style={h2Style}>Data Storage &amp; Security</h2>
        <p style={pStyle}>
          When used without an account, all personal data (child profiles, virtue progress, reading history)
          is stored locally in your browser&apos;s localStorage. We do not have access to this data. You can
          delete it at any time by clearing your browser storage.
        </p>
        <p style={pStyle}>
          When used with an account, data is stored securely in our Supabase database with row-level
          security ensuring each user can only access their own data.
        </p>

        <h2 style={h2Style}>Parental Rights</h2>
        <p style={pStyle}>As a parent or guardian, you have the right to:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li style={liStyle}>Review the information you&apos;ve provided about your child.</li>
          <li style={liStyle}>Delete your child&apos;s information at any time (clear browser storage, or delete your account).</li>
          <li style={liStyle}>Refuse further data collection by choosing general (non-personalized) stories.</li>
          <li style={liStyle}>Contact us with any questions about your child&apos;s data.</li>
        </ul>

        <h2 style={h2Style}>Data Retention</h2>
        <p style={pStyle}>
          Local data exists only while you keep it in your browser. Account data is retained while
          your account is active. You may delete your account and all associated data at any time
          by contacting us.
        </p>

        <h2 style={h2Style}>California Residents (CCPA)</h2>
        <p style={pStyle}>
          California residents have additional rights including the right to know what personal information
          we collect, the right to delete it, and the right to opt out of its sale. We do not sell personal
          information.
        </p>

        <h2 style={h2Style}>Changes to This Policy</h2>
        <p style={pStyle}>
          We may update this Privacy Policy from time to time. We will notify you of material changes
          by posting the updated policy on our website with a new &ldquo;Last Updated&rdquo; date.
        </p>

        <h2 style={h2Style}>Contact Us</h2>
        <p style={pStyle}>
          If you have questions about this Privacy Policy or your child&apos;s data, please contact us at:
        </p>
        <p style={{ ...pStyle, fontWeight: 600 }}>
          hello@virtueforge.ai
        </p>
      </div>
    </div>
  );
}
