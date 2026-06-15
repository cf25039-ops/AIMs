import { createClient } from "@/lib/supabase/client";
import type { SelectOption } from "@/types";

export async function getProjects(): Promise<SelectOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return data.map((item: any) => ({ id: item.id, label: item.name }));
}

export async function getAccessibleContracts(): Promise<SelectOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number")
    .order("contract_number", { ascending: true });
  if (error) {
    console.error("Error fetching accessible contracts:", error);
    return [];
  }
  return data.map((item: any) => ({ id: item.id, label: item.contract_number }));
}

export async function getContracts(projectId?: string): Promise<SelectOption[]> {
  if (!projectId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number")
    .eq("project_id", projectId)
    .order("contract_number", { ascending: true });
  if (error) {
    console.error("Error fetching contracts:", error);
    return [];
  }
return data.map((item: any) => ({ id: item.id, label: item.contract_number }));
}

export async function getRegions(contractId?: string): Promise<SelectOption[]> {
  if (!contractId) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("regions").select("id, name").eq("contract_id", contractId);
  if (error) return [];
  return data.map((item: any) => ({ id: item.id, label: item.name }));
}

export async function getStates(regionId?: string): Promise<SelectOption[]> {
  if (!regionId) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("states").select("id, name").eq("region_id", regionId);
  if (error) return [];
  return data.map((item: any) => ({ id: item.id, label: item.name }));
}

export async function getFacilities(stateId?: string): Promise<SelectOption[]> {
  if (!stateId) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("facilities").select("id, name").eq("state_id", stateId);
  if (error) return [];
  return data.map((item: any) => ({ id: item.id, label: item.name }));
}

export async function getDepartments(facilityId?: string): Promise<SelectOption[]> {
  if (!facilityId) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("departments").select("id, name").eq("facility_id", facilityId);
  if (error) return [];
  return data.map((item: any) => ({ id: item.id, label: item.name }));
}

export type DrillNode = SelectOption & { count: number };

export async function getRegionsWithCounts(contractId: string): Promise<DrillNode[]> {
  const supabase = createClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("id, name")
    .eq("contract_id", contractId)
    .order("name");
  if (!regions) return [];

  const states = await supabase.from("states").select("id, region_id").in("region_id", regions.map((r) => r.id));
  const facilities = states.data
    ? await supabase.from("facilities").select("id, state_id").in("state_id", states.data.map((s: any) => s.id))
    : { data: [] };
  const departments = facilities.data
    ? await supabase.from("departments").select("id, facility_id").in("facility_id", facilities.data.map((f: any) => f.id))
    : { data: [] };
  const hardware = departments.data
    ? await supabase.from("hardware").select("id, department_id").in("department_id", departments.data.map((d: any) => d.id))
    : { data: [] };

  const deptToRegion: Record<string, string> = {};
  if (departments.data) {
    for (const d of departments.data) {
      const fac = facilities.data?.find((f: any) => f.id === d.facility_id);
      if (fac) {
        const st = states.data?.find((s: any) => s.id === fac.state_id);
        if (st) deptToRegion[d.id] = st.region_id;
      }
    }
  }

  const countMap: Record<string, number> = {};
  if (hardware.data) {
    for (const h of hardware.data) {
      const regionId = deptToRegion[h.department_id];
      if (regionId) countMap[regionId] = (countMap[regionId] ?? 0) + 1;
    }
  }

  return regions.map((r) => ({
    id: r.id,
    label: r.name,
    count: countMap[r.id] ?? 0,
  }));
}

export async function getFacilitiesWithCounts(stateId: string): Promise<DrillNode[]> {
  const supabase = createClient();
  const { data: facilities } = await supabase
    .from("facilities")
    .select("id, name")
    .eq("state_id", stateId)
    .order("name");
  if (!facilities) return [];

  const departments = await supabase
    .from("departments")
    .select("id, facility_id")
    .in("facility_id", facilities.map((f) => f.id));
  const hardware = departments.data
    ? await supabase
        .from("hardware")
        .select("id, department_id")
        .in("department_id", departments.data.map((d: any) => d.id))
    : { data: [] };

  const deptToFac: Record<string, string> = {};
  if (departments.data) {
    for (const d of departments.data) deptToFac[d.id] = d.facility_id;
  }

  const countMap: Record<string, number> = {};
  if (hardware.data) {
    for (const h of hardware.data) {
      const facId = deptToFac[h.department_id];
      if (facId) countMap[facId] = (countMap[facId] ?? 0) + 1;
    }
  }

  return facilities.map((f) => ({
    id: f.id,
    label: f.name,
    count: countMap[f.id] ?? 0,
  }));
}

export async function getFacilitiesForRegion(regionId: string): Promise<DrillNode[]> {
  const supabase = createClient();

  const { data: states } = await supabase
    .from("states")
    .select("id")
    .eq("region_id", regionId);

  if (!states || states.length === 0) return [];

  const { data: facilities } = await supabase
    .from("facilities")
    .select("id, name, state_id")
    .in("state_id", states.map((s) => s.id))
    .order("name");

  if (!facilities) return [];

  const departments = await supabase
    .from("departments")
    .select("id, facility_id")
    .in("facility_id", facilities.map((f) => f.id));

  const hardware = departments.data
    ? await supabase
        .from("hardware")
        .select("id, department_id")
        .in("department_id", departments.data.map((d: any) => d.id))
    : { data: [] };

  const deptToFac: Record<string, string> = {};
  if (departments.data) {
    for (const d of departments.data) deptToFac[d.id] = d.facility_id;
  }

  const countMap: Record<string, number> = {};
  if (hardware.data) {
    for (const h of hardware.data) {
      const facId = deptToFac[h.department_id];
      if (facId) countMap[facId] = (countMap[facId] ?? 0) + 1;
    }
  }

  return facilities.map((f) => ({
    id: f.id,
    label: f.name,
    count: countMap[f.id] ?? 0,
  }));
}

export async function getContractsWithCounts(): Promise<DrillNode[]> {
  const supabase = createClient();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("id, contract_number")
    .order("contract_number");

  if (!contracts) return [];

  const { data: regions } = await supabase
    .from("regions")
    .select("id, contract_id");

  const { data: states } = regions
    ? await supabase.from("states").select("id, region_id")
    : { data: [] as any[] };

  const { data: facilities } = states && states.length > 0
    ? await supabase.from("facilities").select("id, state_id").in("state_id", states.map((s: any) => s.id))
    : { data: [] as any[] };

  const { data: departments } = facilities && facilities.length > 0
    ? await supabase.from("departments").select("id, facility_id").in("facility_id", facilities.map((f: any) => f.id))
    : { data: [] as any[] };

  const { data: hardware } = departments && departments.length > 0
    ? await supabase.from("hardware").select("id, department_id").in("department_id", departments.map((d: any) => d.id))
    : { data: [] as any[] };

  const deptToContract: Record<string, string> = {};
  if (departments) {
    for (const d of departments) {
      const fac = facilities?.find((f: any) => f.id === d.facility_id);
      if (fac) {
        const st = states?.find((s: any) => s.id === fac.state_id);
        if (st) {
          const reg = regions?.find((r: any) => r.id === st.region_id);
          if (reg) deptToContract[d.id] = reg.contract_id;
        }
      }
    }
  }

  const countMap: Record<string, number> = {};
  if (hardware) {
    for (const h of hardware) {
      const contractId = deptToContract[h.department_id];
      if (contractId) countMap[contractId] = (countMap[contractId] ?? 0) + 1;
    }
  }

  return contracts.map((c) => ({
    id: c.id,
    label: c.contract_number,
    count: countMap[c.id] ?? 0,
  }));
}

export async function getDepartmentsWithCounts(facilityId: string): Promise<DrillNode[]> {
  const supabase = createClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("facility_id", facilityId)
    .order("name");
  if (!departments) return [];

  const { data: hardware } = await supabase
    .from("hardware")
    .select("department_id")
    .in("department_id", departments.map((d) => d.id));

  const countMap: Record<string, number> = {};
  if (hardware) {
    for (const h of hardware) countMap[h.department_id] = (countMap[h.department_id] ?? 0) + 1;
  }

  return departments.map((d) => ({
    id: d.id,
    label: d.name,
    count: countMap[d.id] ?? 0,
  }));
}

export async function getContractIdForDepartment(departmentId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("departments")
    .select("facility:facilities(state:states(region:regions(contract_id)))")
    .eq("id", departmentId)
    .single();

  return (data as any)?.facility?.state?.region?.contract_id ?? null;
}
