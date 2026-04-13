"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/",         label: "Home"     },
  { href: "/search",   label: "Search"   },
  { href: "/discover", label: "Discover" },
  { href: "/friends",  label: "Friends"  },
  { href: "/profile",  label: "Profile"  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-50
        h-13 glass border-b border-foreground/10
        flex items-center justify-between px-4">

        <Link href="/"
          className="flex items-center gap-2">
          <span className="font-display text-base
            tracking-widest text-foreground uppercase">
            発見
          </span>
          <span className="font-display text-[7px]
            tracking-[0.35em] text-muted-foreground uppercase">
            Hakken
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserButton appearance={{
            elements: { avatarBox: "w-6 h-6" }
          }} />
          <Button
            variant="ghost" size="icon"
            className="w-8 h-8 text-muted-foreground
              hover:text-foreground"
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="md:hidden fixed top-13 inset-x-0 z-40
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
                    "flex items-center gap-3 px-5 py-3",
                    "border-b border-foreground/5 text-sm",
                    "transition-colors",
                    isActive
                      ? "border-l-[3px] border-l-primary pl-4 text-foreground font-display tracking-wider text-xs"
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