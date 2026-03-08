import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bedtime Virtues — Stories That Build Character";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0A1628 0%, #142240 50%, #1E3258 100%)",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(212, 168, 70, 0.2)",
              border: "2px solid #D4A846",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            🛡️
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#D4A846",
              letterSpacing: "-0.02em",
            }}
          >
            Bedtime Virtues
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "0 0 24px 0",
            }}
          >
            Stories That Actually
            <br />
            Build Character
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#9CA3AF",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Personalized AI adventures rooted in 2,400 years of wisdom.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "48px",
          }}
        >
          {["Courage", "Justice", "Wisdom", "Self-Mastery"].map((virtue) => (
            <div
              key={virtue}
              style={{
                display: "flex",
                padding: "8px 20px",
                borderRadius: "100px",
                border: "1px solid rgba(212, 168, 70, 0.4)",
                background: "rgba(212, 168, 70, 0.1)",
                fontSize: "16px",
                fontWeight: 600,
                color: "#D4A846",
              }}
            >
              {virtue}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
