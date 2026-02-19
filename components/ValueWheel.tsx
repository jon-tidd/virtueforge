"use client";

import { VIRTUES } from "@/lib/data";

interface ValueWheelProps {
  selectedVirtues: string[];
  onToggle: (id: string) => void;
}

export default function ValueWheel({ selectedVirtues, onToggle }: ValueWheelProps) {
  return (
    <div>
      {Object.entries(VIRTUES).map(([key, virtue]) => (
        <div key={key} className="mb-5">
          <div
            className="flex items-center gap-2.5 rounded-lg mb-2"
            style={{ padding: "10px 14px", background: virtue.lightColor, border: `2px solid ${virtue.color}22` }}
          >
            <span className="text-2xl">{virtue.icon}</span>
            <div>
              <div className="font-bold" style={{ fontSize: 16, color: virtue.color, fontFamily: "var(--font-crimson)" }}>
                {virtue.name}{" "}
                <span className="font-normal italic text-sm">({virtue.latin})</span>
              </div>
              <div className="text-xs" style={{ color: "#666" }}>{virtue.description}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pl-2">
            {virtue.subVirtues.map((sv) => {
              const active = selectedVirtues.includes(sv.id);
              return (
                <button
                  key={sv.id}
                  onClick={() => onToggle(sv.id)}
                  className="text-left rounded-lg transition-all"
                  style={{
                    padding: "10px 12px",
                    border: active ? `2px solid ${virtue.color}` : "2px solid var(--border)",
                    background: active ? `${virtue.color}15` : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: active ? virtue.color : "#555", fontFamily: "var(--font-crimson)" }}>
                    {active ? "✓ " : ""}{sv.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#888" }}>{sv.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
