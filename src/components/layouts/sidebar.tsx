"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, navGroups } from "@/constants/nav";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/role-context";
import { getRoleLabel, getRoleBadgeColor } from "@/utils/role";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

export function Sidebar() {
  const pathname = usePathname();
  const { role, profile, isLoading } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  // Filter nav items based on user role
  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true; // visible to all
    if (!role) return false;
    return item.roles.includes(role);
  });

  const groupedNav = groupNavItems(filteredNav);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r border-border/70 bg-card/70 py-6 backdrop-blur-xl lg:flex transition-all duration-300 ease-in-out overflow-y-auto",
        isCollapsed ? "w-20 px-2" : "w-72 px-4",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-2",
          isCollapsed && "flex-col gap-4 justify-center px-0",
        )}
      >
        <div className={cn("flex items-center gap-3", isCollapsed && "flex-col justify-center")}>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
            A
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                Enterprise Suite
              </p>
              <p className="text-base font-bold text-foreground">AIMS Control</p>
            </div>
          )}
        </div>

        {/* Toggle Button for Expanded mode */}
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Toggle Button below Logo for Collapsed mode */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all focus:outline-none"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role Badge */}
      {!isLoading && role && !isCollapsed && (
        <div className="mt-4 mx-2">
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

      {/* Navigation */}
      <nav
        className={cn("mt-6 flex flex-1 flex-col gap-1 relative", isCollapsed && "items-center")}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          groupedNav.map((section) => (
            <div key={section.group} className="mb-2">
              {!isCollapsed && section.group !== "main" && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.label}
                </p>
              )}
              {isCollapsed && section.group !== "main" && (
                <div className="my-1 h-px w-6 bg-border/60 mx-auto" />
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                        isCollapsed ? "justify-center px-0 py-3 w-12 h-12" : "gap-3",
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeSidebarTab"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent shadow-md"
                          initial={false}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-transparent text-lg transition-colors",
                          active
                            ? "text-primary-foreground"
                            : "bg-background/60 group-hover:bg-background shadow-sm",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {!isCollapsed && (
                        <div className="relative z-10 min-w-0">
                          <p className="leading-none font-semibold truncate">{item.label}</p>
                          {item.description ? (
                            <span
                              className={cn(
                                "text-[11px] mt-0.5 block transition-colors truncate",
                                active ? "text-primary-foreground/80" : "text-muted-foreground",
                              )}
                            >
                              {item.description}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Footer - Profile Context */}
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-card/70 text-xs text-muted-foreground transition-all duration-300",
          isCollapsed ? "p-2 flex justify-center w-12 h-12 items-center mx-auto" : "p-4",
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 justify-center">
            <Loader2 className="h-3 w-3 animate-spin" />
            {!isCollapsed && <span>Loading...</span>}
          </div>
        ) : isCollapsed ? (
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shadow-sm cursor-pointer hover:bg-primary/20 transition-all"
            title={`${profile?.full_name || profile?.email || "User"} (${getRoleLabel(role)})`}
          >
            {(profile?.full_name || profile?.email || "U")[0].toUpperCase()}
          </div>
        ) : (
          <>
            <p className="font-semibold text-foreground truncate">
              {profile?.full_name || profile?.email || "User"}
            </p>
            <p className="mt-1 truncate">{profile?.assigned_department?.name || "All Access"}</p>
            <p className="mt-1 text-[10px]">RLS enforced per project</p>
          </>
        )}
      </div>
    </aside>
  );
}
