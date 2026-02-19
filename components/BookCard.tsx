"use client";
import { VIRTUES, getSubVirtue, getVirtueParent } from "@/lib/data";
import { T, VC } from "@/lib/tokens";

export default function BookCard({ book, isRead, onMarkRead }: {
  book: any; isRead: boolean; onMarkRead: () => void;
}) {
  const parentKey = getVirtueParent(book.virtues[0]);
  const vc = parentKey ? VC[parentKey] : { main: T.gray600, light: T.gray50 };

  return (
    <div style={{
      padding: 20, borderRadius: T.radius, marginBottom: 12,
      border: isRead ? `2px solid ${T.green}` : `1px solid ${T.gray100}`,
      background: isRead ? T.greenLight : T.white, boxShadow: T.shadow,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.font, fontSize: 20, fontWeight: 700, color: T.navy }}>
            {book.title}
          </div>
          <div style={{ fontSize: 15, color: T.gray600, marginTop: 4 }}>
            by {book.author} ({book.year > 0 ? book.year : `c. ${Math.abs(book.year)} BC`})
          </div>
          <div style={{ fontSize: 16, color: T.gray800, marginTop: 10, lineHeight: 1.6 }}>
            {book.desc}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {book.virtues.map((v: string) => (
              <span key={v} style={{
                fontSize: 13, padding: "4px 12px", borderRadius: 20,
                background: vc.light, color: vc.main, fontWeight: 700,
                border: `1px solid ${vc.main}30`,
              }}>
                {getSubVirtue(v)?.name || v}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 16, minWidth: 110 }}>
          {book.amazon && (
            <a href={book.amazon} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 14, padding: "10px 16px", borderRadius: 6, background: "#FF9900",
              color: T.white, textDecoration: "none", textAlign: "center", fontWeight: 700,
            }}>
              Amazon ↗
            </a>
          )}
          {book.publicDomain && (
            <a href={book.publicDomain} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 14, padding: "10px 16px", borderRadius: 6, background: "#2563EB",
              color: T.white, textDecoration: "none", textAlign: "center", fontWeight: 700,
            }}>
              Free Online ↗
            </a>
          )}
          <button onClick={onMarkRead} style={{
            fontSize: 14, padding: "10px 16px", borderRadius: 6, fontWeight: 700,
            cursor: "pointer", border: `2px solid ${T.green}`,
            background: isRead ? T.green : T.white, color: isRead ? T.white : T.green,
          }}>
            {isRead ? "✓ Read" : "Mark Read"}
          </button>
        </div>
      </div>
    </div>
  );
}
