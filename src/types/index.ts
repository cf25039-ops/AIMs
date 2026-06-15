import type { ComponentType } from "react";

export type UserRole =
  | "super_admin"
  | "admin"
  | "project_admin"
  | "project_manager"
  | "technician"
  | "department_user"
  | "staff"
  | "viewer";

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  roles?: UserRole[];
  group?: "main" | "operations" | "inventory" | "analytics" | "system" | "user";
};

export type SelectOption = {
  id: string;
  label: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "success" | "warning" | "danger" | "info";
};
