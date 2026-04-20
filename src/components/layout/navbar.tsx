"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Search, Home, Compass, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

const desktopNav = [
  { href: "/",         label: "Home",     icon: Home    },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search",   label: "Search",   icon: Search  },
  { href: "/friends",  label: "Friends",  icon: Users   },
  { href: "/profile",  label: "Profile",  icon: User    },
] as const;

const mobileNav = [
  { href: "/",         label: "Home",     icon: Home    },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search",   label: "Search",   icon: Search  },
  { href: "/friends",  label: "Friends",  icon: Users   },
  { href: "/profile",  label: "Profile",  icon: User    },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Pill appearance styles — Tailwind hidden/md:flex controls display; inline only handles position & look
  const pillStyle: React.CSSProperties = {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    // NOTE: no display here — let className="hidden md:flex" handle it
    alignItems: "center",
    gap: "4px",
    padding: "7px 8px",
    width: "max-content",
    borderRadius: "9999px",
    background: "var(--glass-bg, rgba(255,255,255,0.75))",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "2px solid hsl(var(--foreground))",
    boxShadow: scrolled
      ? "4px 4px 0px hsl(var(--primary))"
      : "4px 4px 0px hsl(var(--foreground))",
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
    whiteSpace: "nowrap",
  };

  return (
    <>
      {/* ── Desktop pill — fully inline styled ── */}
      <nav style={pillStyle} className="hidden md:flex">

        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-full no-underline text-foreground",
            "pl-3 pr-4 py-2 transition-[background,box-shadow] duration-150",
            "hover:bg-foreground/[0.06]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "24px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
            lineHeight: 1,
            marginTop: "2px"
          }}>
            発見
          </span>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
            lineHeight: 1,
          }}>
            Hakken
          </span>
        </Link>

        {/* Divider */}
        <div
          className="mx-1 h-5 w-px shrink-0 bg-foreground/12"
          aria-hidden
        />

        {/* Nav links */}
        {desktopNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 no-underline",
                "font-display text-[11px] tracking-[0.15em] uppercase",
                "border-2 transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-foreground bg-foreground text-background shadow-[2px_2px_0_hsl(var(--primary))]"
                  : "border-transparent text-muted-foreground hover:border-foreground/20 hover:bg-foreground/[0.03] hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0 opacity-100",
                  isActive ? "text-background" : "text-current"
                )}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div
          className="mx-1 h-5 w-px shrink-0 bg-foreground/12"
          aria-hidden
        />

        {/* Actions */}
        <div className="flex items-center gap-1 pr-1">
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-7 h-7" },
          }} />
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <header
        className="md:hidden flex"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: "52px",
          // NOTE: no display here — let className="md:hidden flex" handle it
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "var(--glass-bg, rgba(255,255,255,0.85))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "2px solid hsl(var(--foreground))",
          boxShadow: scrolled ? "0 4px 0px hsl(var(--primary))" : "none",
          transition: "box-shadow 0.2s ease"
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 no-underline text-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "26px", letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
            marginTop: "2px"
          }}>発見</span>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "12px", letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
            marginLeft: "2px"
          }}>Hakken</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-6 h-6" },
          }} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="group relative flex items-center justify-center overflow-hidden
              border-2 border-foreground bg-background transition-transform
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{
              width: "32px", height: "32px",
              boxShadow: "2px 2px 0px hsl(var(--foreground))",
              cursor: "pointer",
              color: "hsl(var(--foreground))",
            }}
            aria-label="Menu"
          >
            {/* Halftone hover effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity halftone" />
            
            <div className="relative z-10 flex items-center justify-center">
              {mobileOpen
                ? <X className="w-4 h-4 transition-transform group-hover:rotate-90" strokeWidth={2.5} />
                : <Menu className="w-4 h-4 transition-transform group-hover:scale-110" strokeWidth={2.5} />}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, zIndex: 9998,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "260px", zIndex: 9999,
                paddingTop: "52px",
                background: "var(--glass-bg, rgba(255,255,255,0.95))",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderLeft: "1px solid var(--glass-border)",
              }}
            >
              {mobileNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 24px",
                      borderBottom: "1px solid hsl(var(--foreground) / 0.05)",
                      borderLeft: isActive
                        ? "3px solid hsl(var(--primary))"
                        : "3px solid transparent",
                      paddingLeft: isActive ? "21px" : "24px",
                      textDecoration: "none",
                      color: isActive
                        ? "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon style={{
                      width: "16px", height: "16px", flexShrink: 0,
                      color: isActive
                        ? "hsl(var(--primary))"
                        : "currentColor",
                    }} />
                    <span style={{
                      fontFamily: isActive ? "'Bebas Neue', sans-serif" : "inherit",
                      fontSize: isActive ? "11px" : "14px",
                      letterSpacing: isActive ? "0.15em" : "normal",
                      textTransform: isActive ? "uppercase" : "none",
                      fontWeight: isActive ? "normal" : 500,
                    }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}