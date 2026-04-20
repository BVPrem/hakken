"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Sun, Moon } from "lucide-react";

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  
  if (!hydrated) return null;

  const handleToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    
    // Fallback if browser doesn't support generic view transitions
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }
    
    // Snap a photo of current state, then seamlessly crossfade to the new DOM state!
    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="group relative flex items-center justify-center overflow-hidden
        border-2 border-foreground bg-background transition-transform
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      style={{
        width: "32px",
        height: "32px",
        boxShadow: "2px 2px 0px hsl(var(--foreground))",
      }}
      aria-label="Toggle theme"
    >
      {/* Halftone hover effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity halftone" />
      
      <div className="relative z-10 flex items-center justify-center text-foreground">
        {theme === "dark" ? (
          <Moon className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" strokeWidth={2.5} />
        ) : (
          <Sun className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
}