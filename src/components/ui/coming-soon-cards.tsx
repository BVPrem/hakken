"use client";

import { Zap, Bot, Users } from "lucide-react";

const CARDS = [
  {
    t: "Sentiment Pulse",
    d: "Real-time community mood tracking for every episode and chapter drop.",
    Icon: Zap,
  },
  {
    t: "Hakken AI",
    d: "Ask anything about anime and manga. Get instant, contextual answers.",
    Icon: Bot,
  },
  {
    t: "Friend Match",
    d: "Discover what to watch next based on your friends' taste profiles.",
    Icon: Users,
  },
];

export function ComingSoonCards() {
  return (
    <>
      {CARDS.map(({ t, d, Icon }) => (
        <div
          key={t}
          style={{
            position: "relative",
            padding: "28px 24px",
            background: "hsl(var(--background))",
            border: "2px solid hsl(var(--foreground) / 0.18)",
            boxShadow: "5px 5px 0 hsl(var(--foreground) / 0.07)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            transition: "transform 0.12s ease, box-shadow 0.12s ease",
            cursor: "default",
            overflow: "hidden",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = "translate(-2px,-2px)";
            el.style.boxShadow = "5px 5px 0 hsl(var(--primary) / 0.35)";
            el.style.borderColor = "hsl(var(--primary) / 0.5)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = "translate(0,0)";
            el.style.boxShadow = "5px 5px 0 hsl(var(--foreground) / 0.07)";
            el.style.borderColor = "hsl(var(--foreground) / 0.18)";
          }}
        >
          {/* Top accent bar */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "3px",
            background: "hsl(var(--primary))",
          }} />

          {/* Decorative halftone corner */}
          <div style={{
            position: "absolute",
            bottom: 0, right: 0,
            width: "60px",
            height: "60px",
            backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.05) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            borderTop: "2px solid hsl(var(--foreground) / 0.08)",
            borderLeft: "2px solid hsl(var(--foreground) / 0.08)",
            pointerEvents: "none",
          }} />

          {/* Icon */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            border: "2px solid hsl(var(--primary) / 0.3)",
            background: "hsl(var(--primary) / 0.07)",
          }}>
            <Icon style={{
              width: "18px",
              height: "18px",
              color: "hsl(var(--primary))",
            }} />
          </div>

          {/* Title */}
          <p style={{
            margin: 0,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "20px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
            lineHeight: 1,
          }}>
            {t}
          </p>

          {/* Description */}
          <p style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 500,
            color: "hsl(var(--muted-foreground))",
            lineHeight: 1.65,
          }}>
            {d}
          </p>

          {/* Coming Soon badge */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.4)",
            padding: "3px 10px",
            width: "fit-content",
            marginTop: "4px",
          }}>
            <span style={{
              display: "inline-block",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "hsl(var(--primary))",
            }} />
            Coming Soon
          </span>
        </div>
      ))}
    </>
  );
}
