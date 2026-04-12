"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Search, Compass, Users, User }
  from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/",         label: "Home",    icon: Home    },
  { href: "/search",   label: "Search",  icon: Search  },
  { href: "/discover", label: "Discover",icon: Compass },
  { href: "/friends",  label: "Friends", icon: Users   },
  { href: "/profile",  label: "Profile", icon: User    },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0
        z-50 bg-background border-b-2 border-foreground/10
        px-4 h-14 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl uppercase
            tracking-widest text-foreground">
            発見
          </span>
          <span className="font-display text-[9px] uppercase
            tracking-[0.3em] text-muted-foreground">
            Hakken
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-7 h-7" }
          }} />
          <Button
            variant="ghost" size="icon"
            className="w-8 h-8"
            onClick={() => setOpen(!open)}
          >
            {open
              ? <X className="w-4 h-4" />
              : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed top-14 left-0 right-0
              z-40 bg-background border-b-2
              border-foreground/10"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    "border-b border-foreground/5",
                    "text-sm transition-colors",
                    isActive
                      ? "text-foreground border-l-4 border-l-primary pl-3"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-primary" : ""
                  )} />
                  <span className={cn(
                    isActive
                      ? "font-display uppercase tracking-wide text-xs"
                      : "font-medium text-sm"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}