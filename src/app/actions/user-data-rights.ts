"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function exportMyData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [profileRes, assetsRes, ticketsRes, auditRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("assets")
      .select("*")
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .limit(500),
    supabase.from("maintenance_tickets").select("*").eq("created_by", user.id).limit(500),
    supabase.from("audit_logs").select("*").eq("user_id", user.id).limit(500),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user_profile: profileRes.data ?? null,
    assets: assetsRes.data ?? [],
    maintenance_tickets: ticketsRes.data ?? [],
    audit_logs: auditRes.data ?? [],
  };
}

export async function deleteMyAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();

  // Nullify references to this user on assets
  await admin
    .from("assets")
    .update({ assigned_to: null, created_by: null })
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);

  // Delete profile
  await admin.from("profiles").delete().eq("id", user.id);

  // Delete audit logs
  await admin.from("audit_logs").delete().eq("user_id", user.id);

  // Delete auth user
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) throw new Error(`Failed to delete auth user: ${authErr.message}`);

  revalidatePath("/");
  return { success: true };
}
