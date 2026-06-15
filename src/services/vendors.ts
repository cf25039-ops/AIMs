import { createClient } from "@/lib/supabase/client";

export async function getVendors() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select(`
      id,
      name,
      email,
      phone,
      status,
      project:projects(name, code),
      contracts(count)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }

  return data;
}

export async function getVendorStats() {
  const supabase = createClient();
  const { count: totalVendors } = await supabase.from("vendors").select("*", { count: "exact", head: true });
  
  const { data: activeData } = await supabase
    .from("vendors")
    .select("id")
    .eq("status", "active");

  return {
    totalVendors: totalVendors || 0,
    activeVendors: activeData?.length || 0,
  };
}
