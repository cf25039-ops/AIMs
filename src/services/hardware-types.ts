import { createClient } from "@/lib/supabase/client";

export type HardwareTypeRow = {
  id: string;
  contract_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
};

export async function getHardwareTypes(contractId?: string): Promise<HardwareTypeRow[]> {
  if (!contractId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hardware_types")
    .select("*")
    .eq("contract_id", contractId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching hardware types:", error);
    return [];
  }
  return data ?? [];
}

export async function getHardwareTypesWithCounts(
  contractId?: string,
  departmentId?: string,
): Promise<(HardwareTypeRow & { count: number })[]> {
  if (!contractId) return [];
  const supabase = createClient();

  const types = await getHardwareTypes(contractId);
  if (types.length === 0) return [];

  const typeIds = types.map((t) => t.id);
  let query = supabase
    .from("hardware")
    .select("hardware_type_id, id")
    .in("hardware_type_id", typeIds);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data: counts } = await query;

  const countMap: Record<string, number> = {};
  if (counts) {
    for (const row of counts) {
      if (row.hardware_type_id) {
        countMap[row.hardware_type_id] = (countMap[row.hardware_type_id] ?? 0) + 1;
      }
    }
  }

  return types.map((t) => ({
    ...t,
    count: countMap[t.id] ?? 0,
  }));
}

export async function createHardwareType(values: {
  contractId: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hardware_types")
    .insert({
      contract_id: values.contractId,
      name: values.name,
      description: values.description ?? null,
      icon: values.icon ?? null,
      sort_order: values.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHardwareType(
  id: string,
  values: Partial<{
    name: string;
    description: string;
    icon: string;
    sortOrder: number;
  }>,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hardware_types")
    .update({
      name: values.name,
      description: values.description,
      icon: values.icon,
      sort_order: values.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHardwareType(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("hardware_types").delete().eq("id", id);
  if (error) throw error;
}
