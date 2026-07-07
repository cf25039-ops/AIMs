import { createClient } from "@/lib/supabase/client";

export async function getContracts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
      id,
      contract_number,
      start_date,
      end_date,
      value,
      project:projects(name, code),
      vendor:vendors(name, email, phone)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contracts:", error);
    return [];
  }

  return data;
}

export async function getDashboardStats() {
  const supabase = createClient();

  // Get counts
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });
  const { count: vendorCount } = await supabase
    .from("vendors")
    .select("*", { count: "exact", head: true });

  const { data: contracts } = await supabase.from("contracts").select("value, end_date");

  let totalValue = 0;
  let expiringSoon = 0;

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  if (contracts) {
    contracts.forEach((c) => {
      if (c.value) totalValue += Number(c.value);
      if (c.end_date) {
        const endDate = new Date(c.end_date);
        if (endDate > today && endDate <= nextMonth) {
          expiringSoon++;
        }
      }
    });
  }

  return {
    projectCount: projectCount || 0,
    vendorCount: vendorCount || 0,
    totalValue,
    expiringSoon,
  };
}
