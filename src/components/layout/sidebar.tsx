"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Compass,
  Users,
  User,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden md:flex flex-col w-64 min-h-screen
        bg-surface border-r border-border px-4 py-6 fixed left-0 top-0
        z-40"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-2 mb-10
        group">
        <div className="flex flex-col">
          <span className="text-2xl font-heading font-bold
            gradient-text leading-none">
            発見
          </span>
          <span className="text-xs font-heading font-semibold
            text-text-secondary tracking-widest uppercase mt-0.5">
            Hakken
          </span>
        </div>
        <Zap className="w-4 h-4 text-primary opacity-0
          group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                "relative group",
                isActive
                  ? "text-text-primary bg-surfaceHigh"
                  : "text-text-secondary hover:text-text-primary \
                    hover:bg-surfaceHigh/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-surfaceHigh
                    border border-border"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 relative z-10 transition-colors",
                  isActive ? "text-primary" : "text-text-muted \
                    group-hover:text-text-secondary"
                )}
              />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2
                  w-0.5 h-5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border">
        <Link
          href="/discover"
          className="flex items-center gap-2 px-3 py-2 rounded-lg
            text-xs text-text-secondary hover:text-accent
            hover:bg-surfaceHigh/50 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Manga Releases</span>
        </Link>
        <div className="flex items-center gap-3 px-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard:
                  "bg-surface border border-border",
                userButtonPopoverText: "text-text-primary",
              },
            }}
          />
          <span className="text-sm text-text-secondary font-medium">
            My Account
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
