import { createClient } from "@/lib/supabase/client";

export async function getAnalyticsData() {
  const supabase = createClient();

  // Fetch asset statuses
  const { data: hardware } = await supabase.from("hardware").select("status");

  // Fetch repair tickets for severity distribution
  const { data: tickets } = await supabase.from("repair_tickets").select("severity");

  // Aggregate Hardware Status
  const statusCounts =
    hardware?.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {}) || {};

  const hardwareStatusChart = Object.keys(statusCounts).map((key) => ({
    name: key.replace(/_/g, " "),
    value: statusCounts[key],
  }));

  // Aggregate Ticket Severity
  const severityCounts =
    tickets?.reduce((acc: Record<string, number>, curr) => {
      acc[curr.severity] = (acc[curr.severity] || 0) + 1;
      return acc;
    }, {}) || {};

  const ticketSeverityChart = Object.keys(severityCounts).map((key) => ({
    name: key,
    value: severityCounts[key],
  }));

  return {
    hardwareStatusChart,
    ticketSeverityChart,
  };
}

export async function exportHardwareReport() {
  const supabase = createClient();
  const { data, error } = await supabase.from("hardware").select(`
      asset_tag,
      serial_number,
      type_hardware,
      status,
      purchase_date,
      warranty_expiry,
      pic_name,
      department:departments(name),
      project:projects(name)
    `);

  if (error) {
    console.error("Failed to export:", error);
    return null;
  }

  // Convert JSON to CSV
  if (!data || data.length === 0) return null;

  const headers = [
    "Asset Tag",
    "Serial Number",
    "Hardware Type",
    "Status",
    "Purchase Date",
    "Warranty Expiry",
    "PIC Name",
    "Department",
    "Project",
  ];
  const csvRows = [headers.join(",")];

  data.forEach(
    (row: {
      asset_tag: string;
      serial_number: string;
      type_hardware: string;
      status: string;
      purchase_date: string;
      warranty_expiry: string;
      pic_name: string;
      department: { name: string }[];
      project: { name: string }[];
    }) => {
      const r = row as unknown as {
        asset_tag: string;
        serial_number: string;
        type_hardware: string;
        status: string;
        purchase_date: string;
        warranty_expiry: string;
        pic_name: string;
        department: { name: string } | null;
        project: { name: string } | null;
      };
      const values = [
        r.asset_tag,
        r.serial_number,
        r.type_hardware,
        r.status,
        r.purchase_date,
        r.warranty_expiry,
        r.pic_name,
        r.department?.name || "",
        r.project?.name || "",
      ].map((v) => `"${v || ""}"`); // Escape quotes

      csvRows.push(values.join(","));
    },
  );

  return csvRows.join("\n");
}
