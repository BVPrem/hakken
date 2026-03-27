"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Search, Compass, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — visible on mobile only */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50
        bg-surface/80 backdrop-blur-md border-b border-border
        px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-heading font-bold
            gradient-text">
            発見
          </span>
          <span className="text-sm font-heading text-text-secondary
            tracking-widest uppercase">
            Hakken
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: { avatarBox: "w-7 h-7" },
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary
              w-8 h-8"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40
              bg-surface border-b border-border px-4 py-4 flex
              flex-col gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm font-medium transition-all",
                    isActive
                      ? "text-text-primary bg-surfaceHigh \
                        border border-border"
                      : "text-text-secondary hover:text-text-primary \
                        hover:bg-surfaceHigh/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-primary" : "text-text-muted"
                    )}
                  />
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
