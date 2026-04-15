"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/",         label: "Home"     },
  { href: "/discover", label: "Discover" },
  { href: "/search",   label: "Search"   },
  { href: "/profile",  label: "Profile"  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop pill navbar */}
      <header
        className={cn(
          "hidden md:flex fixed top-4 left-1/2 -translate-x-1/2",
          "z-50 items-center gap-1 px-2 py-1.5",
          "glass border border-foreground/10",
          "transition-all duration-300",
          scrolled
            ? "shadow-lg shadow-black/20"
            : "",
          "rounded-full"
        )}
        style={{ minWidth: "520px" }}
      >
        <Link href="/"
          className="flex items-center gap-1.5 px-3 py-1
            rounded-full hover:bg-foreground/5 transition-colors">
          <span className="font-display text-sm tracking-widest
            uppercase text-foreground">
            発見
          </span>
          <span className="font-display text-[7px] tracking-[0.35em]
            uppercase text-primary">
            Hakken
          </span>
        </Link>

        <div className="w-px h-4 bg-foreground/15 mx-1" />

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-3 py-1 rounded-full text-xs",
                "font-display uppercase tracking-wider",
                "transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="w-px h-4 bg-foreground/15 mx-1" />

        <div className="flex items-center gap-1 pl-1">
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-6 h-6" }
          }} />
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50
        glass border-b border-foreground/10
        h-12 flex items-center justify-between px-4">
        <Link href="/"
          className="flex items-center gap-1.5">
          <span className="font-display text-base tracking-widest
            uppercase text-foreground">
            発見
          </span>
          <span className="font-display text-[7px] tracking-[0.3em]
            uppercase text-primary">
            Hakken
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link href="/search">
            <Search className="w-4 h-4 text-muted-foreground
              hover:text-foreground transition-colors" />
          </Link>
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-6 h-6" }
          }} />
          <button
            onClick={() => setOpen(!open)}
            className="w-7 h-7 flex items-center justify-center
              text-muted-foreground hover:text-foreground"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed top-12 inset-x-0 z-40
              glass border-b border-foreground/10"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-5 py-3 text-sm",
                    "border-b border-foreground/5 transition-colors",
                    isActive
                      ? "text-primary font-display tracking-wider text-xs uppercase border-l-[3px] border-l-primary pl-4"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}