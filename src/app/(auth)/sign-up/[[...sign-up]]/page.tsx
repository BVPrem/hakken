"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return <SignUpThemed />;
}

function SignUpThemed() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const variables = isDark ? {
    colorBackground: "#0d0d0d",
    colorInputBackground: "#141414",
    colorInputText: "#f1f5f9",
    colorText: "#f1f5f9",
    colorTextSecondary: "#64748b",
    colorPrimary: "#e63946",
    colorDanger: "#ef4444",
    colorSuccess: "#22c55e",
  } : {
    colorBackground: "#f8f8f8",
    colorInputBackground: "#ffffff",
    colorInputText: "#1a1a1a",
    colorText: "#1a1a1a",
    colorTextSecondary: "#64748b",
    colorPrimary: "#e63946",
    colorDanger: "#dc2626",
    colorSuccess: "#16a34a",
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden halftone">
      {!isDark && <div className="absolute inset-0 bg-background" />}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center gap-8 p-8 manga-panel bg-card/80">
        <div className="flex flex-col items-center gap-2">
          <div className="font-display text-5xl uppercase tracking-widest text-foreground">
            発見
          </div>
          <div className="font-display text-xl uppercase tracking-[0.3em] text-foreground">
            Hakken
          </div>
          <p className="text-muted-foreground text-xs text-center max-w-xs mt-2">
            Discover. Track. Obsess.
          </p>
        </div>
        <SignUp
          appearance={{
            variables: {
              ...variables,
              borderRadius: "0rem",
              fontFamily: "Space Grotesk, sans-serif",
            },
            elements: {
              card: "bg-card border border-border",
              headerTitle: "font-display uppercase tracking-wider text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border bg-secondary hover:bg-muted text-foreground transition-colors rounded-none",
              formFieldInput: "bg-secondary border-border text-foreground focus:border-primary/50 rounded-none",
              footerActionLink: "text-primary hover:text-primary/80",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-display uppercase tracking-wider",
              input: "rounded-none",
              button: "rounded-none",
            },
          }}
        />
      </div>
    </main>
  );
}