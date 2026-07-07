import { createClient } from "@/lib/supabase/client";
import type { ActivityItem } from "@/types";

export async function getDashboardMetrics() {
  const supabase = createClient();

  const { count: totalAssets } = await supabase
    .from("hardware")
    .select("*", { count: "exact", head: true });

  const { count: underRepair } = await supabase
    .from("hardware")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_repair");

  const { count: activeContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true });

  // Warranty expiring within 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const { count: warrantyAlerts } = await supabase
    .from("hardware")
    .select("*", { count: "exact", head: true })
    .lte("warranty_expiry", thirtyDaysFromNow.toISOString().split("T")[0])
    .gte("warranty_expiry", new Date().toISOString().split("T")[0])
    .not("warranty_expiry", "is", null);

  // Active open tickets
  const { count: openTickets } = await supabase
    .from("repair_tickets")
    .select("*", { count: "exact", head: true })
    .not("status", "in", ["resolved", "closed"]);

  // SLA breaches
  const { count: slaBreaches } = await supabase
    .from("sla_events")
    .select("*", { count: "exact", head: true })
    .not("breached_at", "is", null);

  // Total SLA events for compliance calculation
  const { count: totalSLA } = await supabase
    .from("sla_events")
    .select("*", { count: "exact", head: true });

  const slaCompliance =
    totalSLA && totalSLA > 0
      ? Math.round(((totalSLA - (slaBreaches || 0)) / totalSLA) * 100) + "%"
      : "N/A";

  return [
    {
      title: "Total Assets",
      value: totalAssets?.toString() || "0",
      delta: "",
      tone: "success" as const,
      caption: `Across ${activeContracts || 0} active contracts`,
    },
    {
      title: "Under Repair",
      value: underRepair?.toString() || "0",
      delta: "",
      tone: "warning" as const,
      caption: `${openTickets || 0} open tickets`,
    },
    {
      title: "Warranty Alerts",
      value: warrantyAlerts?.toString() || "0",
      delta: "",
      tone: "danger" as const,
      caption: "Expiring within 30 days",
    },
    {
      title: "SLA Compliance",
      value: slaCompliance,
      delta: "",
      tone: slaBreaches && slaBreaches > 0 ? ("warning" as const) : ("success" as const),
      caption: `${slaBreaches || 0} breaches`,
    },
  ];
}

export async function getRecentActivities(): Promise<ActivityItem[]> {
  const supabase = createClient();
  const items: ActivityItem[] = [];

  // Recent hardware additions
  const { data: hwData } = await supabase
    .from("hardware")
    .select("id, asset_tag, type_hardware, status, created_at, department:departments(name)")
    .order("created_at", { ascending: false })
    .limit(3);

  if (hwData) {
    for (const h of hwData) {
      items.push({
        id: `hw-${h.id}`,
        title: `New hardware: ${h.type_hardware}`,
        detail: `${(h as unknown as { department?: { name: string } }).department?.name || "Unknown"} · ${h.asset_tag}`,
        time: new Date(h.created_at).toLocaleDateString(),
        tone: "success",
      });
    }
  }

  // Recent tickets
  const { data: ticketData } = await supabase
    .from("repair_tickets")
    .select("id, title, status, created_at, hardware:hardware_id(asset_tag)")
    .order("created_at", { ascending: false })
    .limit(3);

  if (ticketData) {
    for (const t of ticketData) {
      items.push({
        id: `tkt-${t.id}`,
        title: t.title,
        detail: `${(t as unknown as { hardware?: { asset_tag: string } }).hardware?.asset_tag || ""} · ${t.status.replace(/_/g, " ")}`,
        time: new Date(t.created_at).toLocaleDateString(),
        tone: t.status === "open" || t.status === "vendor_escalation" ? "warning" : "info",
      });
    }
  }

  // Contract expiry alerts
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, contract_number, end_date")
    .lte("end_date", sixtyDaysFromNow.toISOString().split("T")[0])
    .gte("end_date", new Date().toISOString().split("T")[0])
    .limit(3);

  if (contracts) {
    for (const c of contracts) {
      items.push({
        id: `ctr-${c.id}`,
        title: `Contract expiring soon`,
        detail: `${c.contract_number} · ends ${new Date(c.end_date).toLocaleDateString()}`,
        time: c.end_date,
        tone: "danger",
      });
    }
  }

  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);
}

export async function getDashboardStats() {
  const supabase = createClient();

  const { count: totalAssets } = await supabase
    .from("hardware")
    .select("*", { count: "exact", head: true });

  const { count: totalTickets } = await supabase
    .from("repair_tickets")
    .select("*", { count: "exact", head: true });

  const { count: openTickets } = await supabase
    .from("repair_tickets")
    .select("*", { count: "exact", head: true })
    .not("status", "in", ["resolved", "closed"]);

  const { count: totalContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true });

  const { count: expiringContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .lte("end_date", sixtyDaysFromNow()!)
    .gte("end_date", new Date().toISOString().split("T")[0]);

  return { totalAssets, totalTickets, openTickets, totalContracts, expiringContracts };
}

function sixtyDaysFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
}
