"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion"; // still used for active bar animation
import { Home, Search, Compass, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/",         label: "Home",     icon: Home    },
  { href: "/search",   label: "Search",   icon: Search  },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/friends",  label: "Friends",  icon: Users   },
  { href: "/profile",  label: "Profile",  icon: User    },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden flex-col w-56 min-h-screen
        fixed left-0 top-0 z-40
        glass border-r border-r-foreground/10"
    >
      {/* Logo */}
      <Link href="/"
        className="flex items-center gap-2.5 px-5 py-5
          border-b border-foreground/10 group">
        <div>
          <div className="font-display text-lg tracking-widest
            text-foreground uppercase leading-none">
            発見
          </div>
          <div className="font-display text-[8px] tracking-[0.4em]
            text-muted-foreground uppercase mt-0.5">
            Hakken
          </div>
        </div>
        <div className="ml-auto w-1.5 h-1.5 rounded-full
          bg-primary opacity-0 group-hover:opacity-100
          transition-opacity" />
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col flex-1 py-3 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-5 py-2.5",
                "text-sm transition-all duration-150",
                isActive
                  ? "text-foreground bg-foreground/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {/* Active chapter marker */}
              {isActive && (
                <motion.span
                  layoutId="sidebarActiveBar"
                  className="absolute left-0 inset-y-0
                    w-[3px] bg-primary"
                  transition={{
                    type: "spring", stiffness: 500, damping: 35
                  }}
                />
              )}
              <Icon className={cn(
                "w-3.5 h-3.5 shrink-0",
                isActive ? "text-primary" : ""
              )} />
              <span className={cn(
                "text-sm",
                isActive ? "font-display tracking-wider text-xs" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-4 border-t border-foreground/10
        flex items-center justify-between">
        <UserButton appearance={{
          elements: { avatarBox: "w-7 h-7" }
        }} />
        <ThemeToggle />
      </div>
    </aside>
  );
}