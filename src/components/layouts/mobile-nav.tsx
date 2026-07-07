"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, navGroups } from "@/constants/nav";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/role-context";
import { getRoleLabel, getRoleBadgeColor } from "@/utils/role";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { NavItem } from "@/types";

function groupNavItems(
  items: NavItem[],
): Array<{ group: string; label: string; items: NavItem[] }> {
  const groups: Record<string, NavItem[]> = {};
  for (const item of items) {
    const g = item.group || "user";
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  }
  return Object.entries(groups).map(([key, items]) => ({
    group: key,
    label: navGroups[key] || key,
    items,
  }));
}

export function MobileNav() {
  const pathname = usePathname();
  const { role, profile } = useRole();
  const [open, setOpen] = useState(false);

  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  const groupedNav = groupNavItems(filteredNav);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-card border-r border-border z-50 lg:hidden flex flex-col py-6 px-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
                    A
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                      Enterprise Suite
                    </p>
                    <p className="text-base font-bold text-foreground">AIMS Control</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {role && (
                <div className="mb-4 mx-2">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
                      getRoleBadgeColor(role),
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {getRoleLabel(role)}
                  </div>
                </div>
              )}

              <nav className="flex flex-1 flex-col gap-1">
                {groupedNav.map((section) => (
                  <div key={section.group} className="mb-2">
                    {section.group !== "main" && (
                      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        {section.label}
                      </p>
                    )}
                    <div className="flex flex-col gap-0.5">
                      {section.items.map((item) => {
                        const active =
                          pathname === item.href || pathname.startsWith(item.href + "/");
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                              active
                                ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted",
                            )}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="leading-none font-semibold">{item.label}</p>
                              {item.description && (
                                <span
                                  className={cn(
                                    "text-[11px] mt-0.5 block",
                                    active ? "text-primary-foreground/80" : "text-muted-foreground",
                                  )}
                                >
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {profile && (
                <div className="rounded-2xl border border-border/60 p-4 mt-4 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground truncate">
                    {profile.full_name || profile.email}
                  </p>
                  <p className="mt-1 truncate">
                    {profile.assigned_department?.name || "All Access"}
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
