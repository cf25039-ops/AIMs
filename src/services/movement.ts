"use server";

import { createClient } from "@/lib/supabase/server";
import type { AssetTransferValues } from "@/schemas/movement";

export async function transferHardware(values: AssetTransferValues) {
  const supabase = await createClient();

  // 1. Get current user profile to verify admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized access. Please log in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["superadmin", "super_admin", "admin", "project_admin", "project_manager"];
  if (!profile || !allowedRoles.includes(profile.role?.toLowerCase() || "")) {
    return { error: "Permission Denied: Only High-Level Admins can approve asset transfers." };
  }

  // 2. Get the original asset details
  const { data: originalAsset, error: assetError } = await supabase
    .from("hardware")
    .select("department_id, pic_name")
    .eq("id", values.assetId)
    .single();

  if (assetError || !originalAsset) {
    return { error: "Asset not found" };
  }

  // 3. Perform a database transaction equivalent using sequential queries
  // Since we don't have a custom RPC for this, we do it sequentially.
  
  // a. Insert log
  const movementPayload = {
    hardware_id: values.assetId,
    from_department_id: originalAsset.department_id,
    to_department_id: values.toDepartmentId,
    from_pic: originalAsset.pic_name,
    to_pic: values.toPic,
    movement_type: "transfer",
    transfer_reason: values.transferReason,
    approved_by: user.id, // The admin who is performing this action
  };

  const { error: logError } = await supabase
    .from("asset_movements")
    .insert(movementPayload);

  if (logError) {
    console.error("Log error:", logError);
    return { error: "Failed to record movement log." };
  }

  // b. Update original asset
  const { error: updateError } = await supabase
    .from("hardware")
    .update({
      department_id: values.toDepartmentId,
      pic_name: values.toPic,
    })
    .eq("id", values.assetId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Failed to update asset location." };
  }

  return { success: true };
}
