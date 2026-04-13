import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background halftone
      flex items-center justify-center">
      <div className="flex flex-col items-center gap-7">
        <div className="text-center">
          <div className="font-display text-5xl uppercase
            tracking-widest text-foreground">
            発見
          </div>
          <div className="font-display text-[9px] tracking-[0.5em]
            uppercase text-primary mt-1">
            Hakken
          </div>
          <div className="w-8 h-[2px] bg-primary mx-auto mt-3" />
          <p className="text-xs text-muted-foreground mt-2
            tracking-wider">
            The intelligence layer for the anime community
          </p>
        </div>
        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "#111111",
              colorInputBackground: "#1a1a1a",
              colorInputText: "#f0ede8",
              colorText: "#f0ede8",
              colorTextSecondary: "#888",
              colorPrimary: "#e63946",
              borderRadius: "0px",
              fontFamily: "Space Grotesk, sans-serif",
            },
            elements: {
              card: "shadow-2xl",
              headerTitle: "font-display tracking-wider",
              footerActionLink: "text-primary",
            },
          }}
        />
      </div>
    </main>
  );
}