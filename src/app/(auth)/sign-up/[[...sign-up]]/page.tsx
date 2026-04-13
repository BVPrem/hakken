import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-background flex items-center
      justify-center relative overflow-hidden halftone">

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2
          w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 manga-panel bg-background/80">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-display tracking-widest gradient-text">
            発見
          </span>
          <span className="font-display text-xl uppercase
            tracking-[0.3em] text-foreground">
            Hakken
          </span>
          <p className="text-muted-foreground text-xs text-center max-w-xs mt-2">
            Discover. Track. Obsess.
          </p>
        </div>

        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "#0d0d0d",
              colorInputBackground: "#141414",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              colorTextSecondary: "#64748b",
              colorPrimary: "#e63946",
              colorDanger: "#ef4444",
              borderRadius: "0rem",
              fontFamily: "Space Grotesk, sans-serif",
            },
            elements: {
              card: "bg-card border border-border",
              headerTitle: "font-display uppercase tracking-wider text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "border-border bg-secondary hover:bg-muted \
                text-foreground transition-colors rounded-none",
              formFieldInput:
                "bg-secondary border-border text-foreground \
                focus:border-primary/50 rounded-none",
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
