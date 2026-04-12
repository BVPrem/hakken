"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, Search, Compass, Users, User, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/",        label: "Home",    icon: Home    },
  { href: "/search",  label: "Search",  icon: Search  },
  { href: "/discover",label: "Discover",icon: Compass },
  { href: "/friends", label: "Friends", icon: Users   },
  { href: "/profile", label: "Profile", icon: User    },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden md:flex flex-col w-60 min-h-screen
        fixed left-0 top-0 z-40
        bg-background border-r-2 border-foreground/10"
    >
      {/* Logo */}
      <Link href="/"
        className="flex items-center gap-3 px-6 py-6
          border-b-2 border-foreground/10 group">
        <div className="flex flex-col">
          <span className="font-display text-2xl uppercase
            tracking-widest text-foreground">
            発見
          </span>
          <span className="font-display text-[10px]
            uppercase tracking-[0.3em]
            text-muted-foreground">
            Hakken
          </span>
        </div>
        {/* Red accent dot */}
        <div className="w-2 h-2 rounded-full bg-primary
          ml-auto opacity-0 group-hover:opacity-100
          transition-opacity" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-col flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3",
                "px-6 py-3 text-sm font-medium",
                "transition-colors duration-150",
                isActive
                  ? "text-foreground bg-foreground/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {/* Chapter marker — red left bar on active */}
              {isActive && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-0 bottom-0
                    w-[3px] bg-primary"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}
              <Icon className={cn(
                "w-4 h-4",
                isActive ? "text-primary" : ""
              )} />
              <span className={cn(
                isActive ? "font-display uppercase tracking-wide text-xs" : ""
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-6 py-4 border-t-2 border-foreground/10
        flex flex-col gap-3">
        <Link href="/discover"
          className="flex items-center gap-2 text-xs
            text-muted-foreground hover:text-foreground
            transition-colors font-display uppercase
            tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          Releases
        </Link>
        <div className="flex items-center justify-between">
          <UserButton appearance={{
            elements: { avatarBox: "w-7 h-7" }
          }} />
          <ThemeToggle />
        </div>
      </div>
    </motion.aside>
  );
}