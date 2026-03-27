import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background flex items-center
      justify-center relative overflow-hidden">

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2
          w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3
          w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl font-heading font-bold gradient-text">
            発見
          </span>
          <span className="text-xl font-heading font-semibold
            text-text-primary tracking-widest uppercase">
            Hakken
          </span>
          <p className="text-text-secondary text-sm text-center max-w-xs">
            The intelligence layer for the anime community
          </p>
        </div>

        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "#111118",
              colorInputBackground: "#1a1a24",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94a3b8",
              colorPrimary: "#6d28d9",
              colorDanger: "#ef4444",
              borderRadius: "0.75rem",
              fontFamily: "Space Grotesk, sans-serif",
            },
            elements: {
              card: "bg-surface border border-border shadow-2xl",
              headerTitle: "text-text-primary font-heading",
              headerSubtitle: "text-text-secondary",
              socialButtonsBlockButton:
                "border-border bg-surfaceHigh hover:bg-border \
                text-text-primary transition-colors",
              formFieldInput:
                "bg-surfaceHigh border-border text-text-primary \
                focus:border-primary/50",
              footerActionLink: "text-accent hover:text-primary",
            },
          }}
        />
      </div>
    </main>
  );
}