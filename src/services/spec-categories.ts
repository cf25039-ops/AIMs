import { createClient } from "@/lib/supabase/client";

export type SpecCategoryRow = {
  id: string;
  contract_id: string;
  hardware_type_id: string;
  name: string;
  description: string | null;
  color: string | null;
  sort_order: number;
};

export type SpecRuleRow = {
  id: string;
  spec_category_id: string;
  rule_type: string;
  rule_operator: string;
  rule_value: string;
};

export async function getSpecCategories(hardwareTypeId?: string): Promise<SpecCategoryRow[]> {
  if (!hardwareTypeId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spec_categories")
    .select("*")
    .eq("hardware_type_id", hardwareTypeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching spec categories:", error);
    return [];
  }
  return data ?? [];
}

export async function getSpecCategoriesWithCounts(
  hardwareTypeId?: string,
  departmentId?: string,
): Promise<(SpecCategoryRow & { count: number })[]> {
  if (!hardwareTypeId) return [];
  const supabase = createClient();

  const categories = await getSpecCategories(hardwareTypeId);
  if (categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);
  let query = supabase
    .from("hardware")
    .select("spec_category_id, id")
    .in("spec_category_id", categoryIds)
    .eq("hardware_type_id", hardwareTypeId);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data: counts } = await query;

  const countMap: Record<string, number> = {};
  if (counts) {
    for (const row of counts) {
      if (row.spec_category_id) {
        countMap[row.spec_category_id] = (countMap[row.spec_category_id] ?? 0) + 1;
      }
    }
  }

  return categories.map((c) => ({
    ...c,
    count: countMap[c.id] ?? 0,
  }));
}

export async function createSpecCategory(values: {
  contractId: string;
  hardwareTypeId: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spec_categories")
    .insert({
      contract_id: values.contractId,
      hardware_type_id: values.hardwareTypeId,
      name: values.name,
      description: values.description ?? null,
      color: values.color ?? null,
      sort_order: values.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSpecCategory(
  id: string,
  values: Partial<{
    name: string;
    description: string;
    color: string;
    sortOrder: number;
  }>,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spec_categories")
    .update({
      name: values.name,
      description: values.description,
      color: values.color,
      sort_order: values.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSpecCategory(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("spec_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function getSpecRules(specCategoryId?: string): Promise<SpecRuleRow[]> {
  if (!specCategoryId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("spec_rules")
    .select("*")
    .eq("spec_category_id", specCategoryId);

  if (error) {
    console.error("Error fetching spec rules:", error);
    return [];
  }
  return data ?? [];
}

export async function saveSpecRules(
  specCategoryId: string,
  rules: Array<{
    id?: string;
    rule_type: string;
    rule_operator: string;
    rule_value: string;
  }>,
) {
  const supabase = createClient();

  const existing = await getSpecRules(specCategoryId);
  const existingIds = new Set(existing.map((r) => r.id));
  const incomingIds = new Set(rules.filter((r) => r.id).map((r) => r.id!));

  const toDelete = existing.filter((r) => !incomingIds.has(r.id));
  if (toDelete.length > 0) {
    await supabase
      .from("spec_rules")
      .delete()
      .in(
        "id",
        toDelete.map((r) => r.id),
      );
  }

  const toInsert = rules.filter((r) => !r.id);
  const toUpdate = rules.filter((r) => r.id && existingIds.has(r.id));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("spec_rules").insert(
      toInsert.map((r) => ({
        spec_category_id: specCategoryId,
        rule_type: r.rule_type,
        rule_operator: r.rule_operator,
        rule_value: r.rule_value,
      })),
    );
    if (error) throw error;
  }

  for (const r of toUpdate) {
    const { error } = await supabase
      .from("spec_rules")
      .update({
        rule_type: r.rule_type,
        rule_operator: r.rule_operator,
        rule_value: r.rule_value,
      })
      .eq("id", r.id);
    if (error) throw error;
  }
}

export async function autoClassifyHardware(specCategoryId: string) {
  const rules = await getSpecRules(specCategoryId);
  if (rules.length === 0) return { matched: 0 };

  const supabase = createClient();

  const { data: allHardware } = await supabase
    .from("hardware")
    .select("id, cpu, ram, storage")
    .eq(
      "hardware_type_id",
      (
        await supabase
          .from("spec_categories")
          .select("hardware_type_id")
          .eq("id", specCategoryId)
          .single()
      ).data?.hardware_type_id,
    );

  if (!allHardware) return { matched: 0 };

  let matched = 0;
  for (const hw of allHardware) {
    const matches = rules.every((rule) => matchRule(hw, rule));
    if (matches) {
      await supabase.from("hardware").update({ spec_category_id: specCategoryId }).eq("id", hw.id);
      matched++;
    }
  }

  return { matched };
}

function matchRule(
  hw: { cpu: string | null; ram: string | null; storage: string | null },
  rule: SpecRuleRow,
): boolean {
  const fieldValue = hw[rule.rule_type as keyof typeof hw]?.toLowerCase() ?? "";
  const value = rule.rule_value.toLowerCase();

  switch (rule.rule_operator) {
    case "eq":
      return fieldValue === value;
    case "ne":
      return fieldValue !== value;
    case "contains":
      return fieldValue.includes(value);
    case "gte":
      return parseFloat(fieldValue) >= parseFloat(value);
    case "lte":
      return parseFloat(fieldValue) <= parseFloat(value);
    case "gt":
      return parseFloat(fieldValue) > parseFloat(value);
    case "lt":
      return parseFloat(fieldValue) < parseFloat(value);
    default:
      return false;
  }
}
