import { createClient } from "@/lib/supabase/client";

export async function getIntelligenceData() {
  const supabase = createClient();

  // 1. Fetch hardware
  const { data: hardware, error: hwError } = await supabase.from("hardware").select(`
      id,
      asset_tag,
      type_hardware,
      status,
      purchase_date,
      repair_tickets(id, severity, status)
    `);

  if (hwError || !hardware) {
    console.error("Intelligence Fetch Error:", hwError);
    return [];
  }

  // 2. Algorithm implementation
  // Health Score Calculation (0-100)
  // Base 100
  // Age factor: -5 per year old
  // Ticket factor: -10 per critical ticket, -5 per high ticket, -2 per normal ticket
  // Status factor: 'maintenance' (-20), 'disposed' (0)

  const intelligenceData = hardware.map(
    (item: {
      id: string;
      asset_tag: string;
      type_hardware: string;
      status: string;
      purchase_date: string;
      repair_tickets: { id: string; severity: string; status: string }[];
    }) => {
      let score = 100;

      // Age deduction
      if (item.purchase_date) {
        const purchaseYear = new Date(item.purchase_date).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - purchaseYear;
        score -= age * 5;
      }

      // Tickets deduction
      const tickets = item.repair_tickets || [];
      tickets.forEach((ticket: { severity: string; status: string }) => {
        if (ticket.severity === "critical") score -= 15;
        else if (ticket.severity === "high") score -= 10;
        else score -= 2;
      });

      // Status deduction
      if (item.status === "maintenance") score -= 20;
      if (item.status === "disposed") score = 0;

      // Floor at 0
      if (score < 0) score = 0;

      // Classify
      let healthClass = "healthy";
      let recommendation = "No Action Required";

      if (score === 0) {
        healthClass = "disposed";
        recommendation = "Asset is completely non-functional or disposed.";
      } else if (score < 40) {
        healthClass = "critical";
        recommendation =
          "Recommend immediate replacement or disposal. Maintenance cost will exceed value.";
      } else if (score < 70) {
        healthClass = "degraded";
        recommendation = "Schedule preventive maintenance check. Parts may be failing.";
      } else {
        recommendation = "Asset operating under normal optimal conditions.";
      }

      return {
        id: item.id,
        asset_tag: item.asset_tag,
        type: item.type_hardware,
        status: item.status,
        ticketsCount: tickets.length,
        score,
        healthClass,
        recommendation,
      };
    },
  );

  return intelligenceData.sort((a, b) => a.score - b.score);
}
