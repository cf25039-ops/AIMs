"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { validatePassword } from "@/lib/password-policy";

async function assertSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin"].includes(profile.role)) {
    throw new Error("Only admins can create user accounts.");
  }

  return { user, profile };
}

export async function createUserAccount(values: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  projectId?: string;
}) {
  await assertSuperAdmin();

  const passwordErrors = validatePassword(values.password);
  if (passwordErrors.length > 0) {
    throw new Error(`Password policy: ${passwordErrors.join(", ")}`);
  }

  const admin = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.fullName,
    },
  });

  if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);
  if (!authData.user) throw new Error("No user returned from auth creation");

  const userId = authData.user.id;

  // Insert profile
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email: values.email,
    full_name: values.fullName,
    role: values.role,
  });

  if (profileError) {
    console.error("Profile insert failed:", profileError);
    throw new Error(`Auth user created but profile insert failed: ${profileError.message}`);
  }

  // If projectId provided, add as project member
  if (values.projectId) {
    const { error: memberError } = await admin.from("project_members").insert({
      project_id: values.projectId,
      user_id: userId,
      role: values.role as any,
    });

    if (memberError) {
      console.error("Project member insert failed:", memberError);
      // Don't throw - user was created, just member assignment failed
    }
  }

  revalidatePath("/settings");
  return { success: true, userId };
}

export async function deleteUserAccount(userId: string) {
  await assertSuperAdmin();

  const admin = createAdminClient();

  // Delete profile first
  const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);

  if (profileError) {
    console.error("Profile delete failed:", profileError);
  }

  // Delete auth user
  const { error: authError } = await admin.auth.admin.deleteUser(userId);

  if (authError) throw new Error(`Failed to delete user: ${authError.message}`);

  revalidatePath("/settings");
  return { success: true };
}

export async function getAllUsers() {
  await assertSuperAdmin();

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return profiles ?? [];
}

export async function updateUserRole(userId: string, role: string) {
  await assertSuperAdmin();

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);

  if (error) throw new Error(`Failed to update role: ${error.message}`);

  revalidatePath("/settings");
  return { success: true };
}
