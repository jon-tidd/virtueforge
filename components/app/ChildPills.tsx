"use client";
import { T } from "@/lib/tokens";
import type { ChildProfile } from "@/lib/data";

/**
 * Shared child-selector pill row. Renders nothing when there's only one
 * (or zero) children, so every page can render it unconditionally.
 */
export default function ChildPills({ children, selected, onSelect }: {
  children: ChildProfile[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  if (children.length < 2) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {children.map((c, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-pressed={selected === i}
          style={{
            padding: "6px 16px", borderRadius: 100,
            background: selected === i ? T.navy : T.white,
            color: selected === i ? T.white : T.gray600,
            border: selected === i ? "none" : `1px solid ${T.gray200}`,
            cursor: "pointer",
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
          }}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
