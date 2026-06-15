"use client";

import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { RoleProvider } from "@/contexts/role-context";
import { useSessionTimeout } from "@/hooks/use-session-timeout";

export function AppShell({ children }: { children: React.ReactNode }) {
  useSessionTimeout();

  return (
    <RoleProvider>
      <div className="flex min-h-screen">
        <MobileNav />
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 pb-12 pt-6 lg:px-10">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
