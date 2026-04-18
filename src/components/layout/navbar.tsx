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
  { href: "/",         label: "Home"     },
  { href: "/discover", label: "Discover" },
  { href: "/search",   label: "Search"   },
  { href: "/friends",  label: "Friends"  },
  { href: "/profile",  label: "Profile"  },
];

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

  // Pill nav inline styles — guaranteed to render correctly regardless of Tailwind
  const pillStyle: React.CSSProperties = {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "6px",
    width: "max-content",   // ← shrink-wraps to content; prevents full-width stretch
    borderRadius: "9999px",
    background: "var(--glass-bg, rgba(255,255,255,0.75))",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid var(--glass-border, rgba(0,0,0,0.1))",
    boxShadow: scrolled
      ? "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)"
      : "0 4px 16px rgba(0,0,0,0.08)",
    transition: "box-shadow 0.3s ease",
    whiteSpace: "nowrap",
  };

  return (
    <>
      {/* ── Desktop pill — fully inline styled ── */}
      <nav style={pillStyle} className="hidden md:flex">

        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 16px 6px 12px",
            borderRadius: "9999px",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(0,0,0,0.05)")}
          onMouseLeave={e =>
            ((e.currentTarget as HTMLElement).style.background =
              "transparent")}
        >
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "16px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
            lineHeight: 1,
          }}>
            発見
          </span>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "8px",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
            lineHeight: 1,
          }}>
            Hakken
          </span>
        </Link>

        {/* Divider */}
        <div style={{
          width: "1px",
          height: "20px",
          background: "hsl(var(--foreground) / 0.12)",
          margin: "0 4px",
          flexShrink: 0,
        }} />

        {/* Nav links */}
        {desktopNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "7px 14px",
                borderRadius: "9999px",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "all 0.15s",
                background: isActive
                  ? "hsl(var(--primary))"
                  : "transparent",
                color: isActive
                  ? "hsl(var(--primary-foreground))"
                  : "hsl(var(--muted-foreground))",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "hsl(var(--foreground) / 0.06)";
                  (e.currentTarget as HTMLElement).style.color =
                    "hsl(var(--foreground))";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "hsl(var(--muted-foreground))";
                }
              }}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div style={{
          width: "1px",
          height: "20px",
          background: "hsl(var(--foreground) / 0.12)",
          margin: "0 4px",
          flexShrink: 0,
        }} />

        {/* Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          paddingRight: "4px",
        }}>
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-7 h-7" },
          }} />
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <header
        className="md:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "var(--glass-bg, rgba(255,255,255,0.85))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border, rgba(0,0,0,0.08))",
        }}
      >
        <Link href="/" style={{
          display: "flex", alignItems: "center",
          gap: "6px", textDecoration: "none",
        }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "18px", letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "hsl(var(--foreground))",
          }}>発見</span>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "8px", letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "hsl(var(--primary))",
          }}>Hakken</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-6 h-6" },
          }} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              width: "32px", height: "32px",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              background: "transparent", border: "none",
              cursor: "pointer",
              color: "hsl(var(--muted-foreground))",
            }}
            aria-label="Menu"
          >
            {mobileOpen
              ? <X className="w-4 h-4" />
              : <Menu className="w-4 h-4" />}
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