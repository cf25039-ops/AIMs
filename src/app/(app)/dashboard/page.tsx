"use client";

import { useRole } from "@/contexts/role-context";
import { DashboardOverview } from "@/components/dashboard/overview";
import { ProjectAdminDashboard } from "@/components/dashboard/project-admin-dashboard";
import { TechnicianDashboard } from "@/components/dashboard/technician-dashboard";
import { UserPortal } from "@/components/dashboard/user-portal";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Route to the appropriate dashboard based on user role
  switch (role) {
    case "super_admin":
    case "admin":
    case "project_manager":
      return <DashboardOverview />;

    case "project_admin":
      return <ProjectAdminDashboard />;

    case "technician":
      return <TechnicianDashboard />;

    case "department_user":
    case "viewer":
    case "staff":
      return <UserPortal />;

    default:
      // Fallback to admin dashboard (for existing users with unrecognized roles)
      return <DashboardOverview />;
  }
}
