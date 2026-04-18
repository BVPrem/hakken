"use client";

const CARDS = [
  { t: "Sentiment Pulse", d: "Real-time episode mood" },
  { t: "Hakken AI",       d: "Ask anything about anime" },
  { t: "Friend Match",    d: "Find what to watch together" },
];

export function ComingSoonCards() {
  return (
    <>
      {CARDS.map((c) => (
        <div
          key={c.t}
          style={{
            padding: "16px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid var(--glass-border)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            transition: "transform 0.12s ease, box-shadow 0.12s ease",
            cursor: "default",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = "translate(-2px,-2px)";
            el.style.boxShadow = "3px 3px 0 hsl(var(--primary) / 0.4)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = "translate(0,0)";
            el.style.boxShadow = "none";
          }}
        >
          <p style={{
            margin: 0,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "13px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
          }}>
            {c.t}
          </p>
          <p style={{
            margin: 0,
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            lineHeight: 1.5,
          }}>
            {c.d}
          </p>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
            marginTop: "4px",
          }}>
            Coming Soon
          </span>
        </div>
      ))}
    </>
  );
}
