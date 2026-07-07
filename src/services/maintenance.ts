import { createClient } from "@/lib/supabase/client";
import type { TicketFormValues } from "@/schemas/maintenance";
import { canCreateTickets } from "@/utils/role";

async function assertCanCreateTicket(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a repair ticket.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !canCreateTickets(profile?.role)) {
    throw new Error("Technicians can update assigned tickets, but cannot report new issues.");
  }
}

export async function getTickets() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("repair_tickets")
    .select(
      `
      id,
      title,
      description,
      severity,
      status,
      opened_at,
      created_at,
      hardware (
        asset_tag,
        type_hardware,
        departments (name)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }

  return data;
}

export async function createTicket(values: TicketFormValues) {
  const supabase = createClient();
  await assertCanCreateTicket(supabase);

  const payload: Record<string, any> = {
    hardware_id: values.assetId,
    title: values.issueTitle,
    description: values.issueDescription || "",
    severity: values.severity,
    status: "open" as const,
  };

  console.log("[createTicket] payload:", payload);

  const { data: ticket, error } = await supabase
    .from("repair_tickets")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(
      "[createTicket] Supabase error:",
      error.message,
      error.details,
      error.hint,
      error.code,
    );
    throw new Error(error.message);
  }

  // DISPATCH NOTIFICATIONS to Technicians and Admins in the same region/facility!
  try {
    const { data: hardware } = await supabase
      .from("hardware")
      .select("asset_tag, department_id, brand, model")
      .eq("id", values.assetId)
      .single();

    if (hardware && hardware.department_id) {
      const { data: department } = await supabase
        .from("departments")
        .select("name, facility_id")
        .eq("id", hardware.department_id)
        .single();

      if (department && department.facility_id) {
        const facilityId = department.facility_id;

        const { data: facility } = await supabase
          .from("facilities")
          .select("name")
          .eq("id", facilityId)
          .single();

        const facilityName = facility?.name || "Hospital Kuantan";

        // Query profiles and select only technician, project_admin, project_manager, or super_admin
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, role, assigned_facility_id, assigned_department_id");

        if (profiles) {
          const notificationsToInsert = [];

          for (const p of profiles) {
            let isSameKawasan = false;

            if (p.assigned_facility_id === facilityId) {
              isSameKawasan = true;
            } else if (p.assigned_department_id) {
              const { data: pDept } = await supabase
                .from("departments")
                .select("facility_id")
                .eq("id", p.assigned_department_id)
                .single();
              if (pDept && pDept.facility_id === facilityId) {
                isSameKawasan = true;
              }
            }

            // Super admins see all notifications
            if (p.role === "super_admin") {
              isSameKawasan = true;
            }

            const isTargetRole = [
              "technician",
              "project_admin",
              "project_manager",
              "super_admin",
            ].includes(p.role);

            if (isSameKawasan && isTargetRole) {
              notificationsToInsert.push({
                user_id: p.id,
                title: `New Ticket: TKT-${ticket.id.split("-")[0].toUpperCase()}`,
                body: `New issue reported at ${facilityName} (${department.name}): "${values.issueTitle}" for asset ${hardware.asset_tag} (${hardware.brand} ${hardware.model}).`,
                channel: "in_app",
              });
            }
          }

          if (notificationsToInsert.length > 0) {
            console.log(
              `[createTicket] Dispatching ${notificationsToInsert.length} region-specific notifications...`,
            );
            const { error: notifError } = await supabase
              .from("notifications")
              .insert(notificationsToInsert);
            if (notifError) {
              console.error("[createTicket] Error inserting notifications:", notifError);
            }
          }
        }
      }
    }
  } catch (notifErr) {
    console.error("[createTicket] Failed to generate notifications:", notifErr);
  }

  return ticket;
}

export async function uploadTicketImage(file: File) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `tickets/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("repair_attachments")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("repair_attachments").getPublicUrl(filePath);

  return data.publicUrl;
}
