import type { UserRole } from "@/types";

/** Check if the role is an admin-level role */
export function isAdmin(role?: UserRole | null): boolean {
  return role === "super_admin" || role === "admin" || role === "project_manager";
}

/** Check if the role can manage assets (create/edit/delete) */
export function canManageAssets(role?: UserRole | null): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "project_manager" ||
    role === "project_admin"
  );
}

/** Check if the role can manage tickets */
export function canManageTickets(role?: UserRole | null): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "project_manager" ||
    role === "project_admin" ||
    role === "technician"
  );
}

/** Check if the role can open/report a new repair issue */
export function canCreateTickets(role?: UserRole | null): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "project_manager" ||
    role === "project_admin" ||
    role === "department_user" ||
    role === "staff" ||
    role === "viewer"
  );
}

/** Check if the role is a scoped/limited role */
export function isScopedRole(role?: UserRole | null): boolean {
  return (
    role === "department_user" ||
    role === "viewer" ||
    role === "staff"
  );
}

/** Get a time-based greeting */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Get a human-readable label for a role */
export function getRoleLabel(role?: UserRole | null): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    project_admin: "Project Admin",
    project_manager: "Project Manager",
    technician: "Technician",
    department_user: "Department User",
    staff: "Staff",
    viewer: "Viewer",
  };
  return labels[role || ""] || "User";
}

/** Get accent color class for role badge */
export function getRoleBadgeColor(role?: UserRole | null): string {
  const colors: Record<string, string> = {
    super_admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    project_admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    project_manager: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    technician: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    department_user: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    staff: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    viewer: "bg-muted text-muted-foreground",
  };
  return colors[role || ""] || "bg-muted text-muted-foreground";
}
