import { createClient } from "@/lib/supabase/client";

export async function getWarehouseItems() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("warehouse_items")
    .select(`
      id,
      name,
      sku,
      quantity,
      min_quantity,
      project:projects(name)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching warehouse items:", error);
    return [];
  }

  return data;
}

export async function getPurchaseRequests() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .select(`
      id,
      item_name,
      quantity,
      status,
      note,
      created_at,
      project:projects(name),
      requester:profiles(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching purchase requests:", error);
    return [];
  }

  return data;
}
