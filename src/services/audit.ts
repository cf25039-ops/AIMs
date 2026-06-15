"use server";

import { createClient } from "@/lib/supabase/server";

async function verifyAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["superadmin", "super_admin", "admin", "auditor"];
  return profile && allowedRoles.includes(profile.role?.toLowerCase() || "");
}

export async function getSystemAuditLogs() {
  const isAdmin = await verifyAdminAccess();
  if (!isAdmin) {
    return { error: "Access Denied: You do not have permission to view audit logs." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      ip_address,
      device,
      browser,
      session_id,
      created_at,
      profiles:actor_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch system audit logs:", error);
    return { error: "Failed to fetch audit logs" };
  }

  return { data };
}

export async function getActivityLogs() {
  const isAdmin = await verifyAdminAccess();
  if (!isAdmin) {
    return { error: "Access Denied: You do not have permission to view activity logs." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      id,
      action,
      entity,
      entity_id,
      ip_address,
      metadata,
      created_at,
      profiles:actor_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch activity logs:", error);
    return { error: "Failed to fetch activity logs" };
  }

  return { data };
}
