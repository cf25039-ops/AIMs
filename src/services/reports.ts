import { createClient } from "@/lib/supabase/client";

export async function getAnalyticsData() {
  const supabase = createClient();

  // Fetch asset statuses
  const { data: hardware } = await supabase.from("hardware").select("status");
  
  // Fetch repair tickets for severity distribution
  const { data: tickets } = await supabase.from("repair_tickets").select("severity");

  // Aggregate Hardware Status
  const statusCounts = hardware?.reduce((acc: any, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const hardwareStatusChart = Object.keys(statusCounts).map((key) => ({
    name: key.replace(/_/g, " "),
    value: statusCounts[key],
  }));

  // Aggregate Ticket Severity
  const severityCounts = tickets?.reduce((acc: any, curr) => {
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
  const { data, error } = await supabase
    .from("hardware")
    .select(`
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
  
  const headers = ["Asset Tag", "Serial Number", "Hardware Type", "Status", "Purchase Date", "Warranty Expiry", "PIC Name", "Department", "Project"];
  const csvRows = [headers.join(",")];

  data.forEach((row: any) => {
    const values = [
      row.asset_tag,
      row.serial_number,
      row.type_hardware,
      row.status,
      row.purchase_date,
      row.warranty_expiry,
      row.pic_name,
      row.department?.name || "",
      row.project?.name || ""
    ].map(v => `"${v || ""}"`); // Escape quotes
    
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
}
