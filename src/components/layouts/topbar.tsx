"use client";

import { Command, LogOut, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/ui/global-search";
import { useRole } from "@/contexts/role-context";
import { getRoleLabel, getGreeting, canManageAssets } from "@/utils/role";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NotificationDropdown } from "@/components/layouts/notification-dropdown";

export function Topbar() {
  const { role, profile, isLoading } = useRole();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Scoped roles see a welcome message; admins see command center header
  const isScoped = role === "department_user" || role === "viewer" || role === "staff";
  const isTech = role === "technician";

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-border/70 bg-card/70 px-6 py-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        {isScoped ? (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-semibold">{profile?.full_name || "Welcome"}</h1>
            {profile?.assigned_department?.name && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {profile.assigned_department.name}
                {profile.assigned_department.facility?.name
                  ? ` — ${profile.assigned_department.facility.name}`
                  : ""}
              </p>
            )}
          </>
        ) : isTech ? (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Operations Console
            </p>
            <h1 className="text-2xl font-semibold">
              {getGreeting()}, {profile?.full_name?.split(" ")[0] || "Technician"}
            </h1>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Command Center
            </p>
            <h1 className="text-2xl font-semibold">Advanced Inventory Management</h1>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center">
        <GlobalSearch
          placeholder={
            isScoped ? "Search your assets, tickets..." : "Search assets, contracts, tickets..."
          }
        />
        {!isScoped && !isTech && (
          <Button variant="outline" className="gap-2">
            <Command className="h-4 w-4" />
            Command Palette
            <kbd className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
              Ctrl K
            </kbd>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          {canManageAssets(role) && (
            <Link href="/assets/add">
              <Button variant="accent" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </Link>
          )}
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium leading-none">
              {isLoading ? "Loading..." : profile?.full_name || profile?.email || "Admin User"}
            </span>
            <span className="text-xs text-muted-foreground capitalize mt-1">
              {isLoading ? "" : getRoleLabel(role)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
            title="Log out"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
