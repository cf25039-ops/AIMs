import { createClient } from "@/lib/supabase/client";
import type { HardwareFormValues } from "@/schemas/hardware";
import { canManageAssets } from "@/utils/role";

async function assertCanManageHardware(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to manage hardware assets.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !canManageAssets(profile?.role)) {
    throw new Error("Only admin-level users can manage hardware assets.");
  }
}

export async function createHardware(values: HardwareFormValues) {
  const supabase = createClient();
  await assertCanManageHardware(supabase);

  // Find a department associated with the contractId
  let departmentId = null;
  if (values.contractId) {
    // 1. Get region
    const { data: regionData } = await supabase
      .from("regions")
      .select("id")
      .eq("contract_id", values.contractId)
      .limit(1);
    const regionId = regionData?.[0]?.id;

    // 2. Get state
    let stateId = null;
    if (regionId) {
      const { data: stateData } = await supabase
        .from("states")
        .select("id")
        .eq("region_id", regionId)
        .limit(1);
      stateId = stateData?.[0]?.id;
    }

    // 3. Get facility
    let facilityId = null;
    if (stateId) {
      const { data: facilityData } = await supabase
        .from("facilities")
        .select("id")
        .eq("state_id", stateId)
        .limit(1);
      facilityId = facilityData?.[0]?.id;
    }

    // 4. Get department
    if (facilityId) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("id")
        .eq("facility_id", facilityId)
        .limit(1);
      departmentId = deptData?.[0]?.id;
    }
  }

  // Fallback to first department in the DB if none matched
  if (!departmentId) {
    const projectDeptFallback: Record<string, string> = {
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "11111111-2222-3333-4444-555555555555", // Kementerian Kesihatan Malaysia
      "3dec4c83-ff18-47b7-8012-8cb561aa2c00": "0121b7b6-fec2-4df4-b297-bc33ae856a98", // KKM
      "b84d8dc8-812f-4301-b828-33acb8482b63": "5f1af898-c4ba-4e90-8ab0-58dcbcff9c32", // PDRM
      "11111111-1111-1111-1111-111111111111": "77777777-7777-7777-7777-777777777771", // Enterprise AIMS Rollout
    };

    departmentId = (values.projectId && projectDeptFallback[values.projectId]) || null;

    if (!departmentId) {
      const { data: fallbackDept } = await supabase.from("departments").select("id").limit(1);
      departmentId = fallbackDept?.[0]?.id || "11111111-2222-3333-4444-555555555555";
    }
  }

  const normalizedType = (values.typeHardware || "").toLowerCase();

  // Generate appropriate asset tag based on project and contract
  let generatedAssetTag = values.assetTag;
  if (!generatedAssetTag) {
    let projectPrefix = "ASSET";
    if (values.projectId) {
      const { data: projectData } = await supabase
        .from("projects")
        .select("code, name")
        .eq("id", values.projectId)
        .single();
      if (projectData) {
        const { code } = projectData;
        if (code && code.trim()) {
          projectPrefix = code.trim().toUpperCase();
        } else {
          projectPrefix = code || projectData.name.split(" ")[0].toUpperCase();
        }
      }
    }

    let contractNo = "";
    if (values.contractId) {
      const { data: contractData } = await supabase
        .from("contracts")
        .select("contract_number")
        .eq("id", values.contractId)
        .single();
      if (contractData) {
        contractNo = (contractData.contract_number || "").trim().toUpperCase();
      }
    }

    const typeCodeMap: Record<string, string> = {
      pc: "PC",
      laptop: "LPT",
      printer: "PRT",
      server: "SVR",
      projector: "PRJ",
    };
    const typeCode = typeCodeMap[normalizedType] || normalizedType.toUpperCase();
    const cleanRunningNumber = (values.runningNumber || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-");

    if (contractNo) {
      if (contractNo.includes(projectPrefix)) {
        generatedAssetTag = `${contractNo}-${typeCode}-${cleanRunningNumber}`;
      } else {
        generatedAssetTag = `${projectPrefix}-${contractNo}-${typeCode}-${cleanRunningNumber}`;
      }
    } else {
      generatedAssetTag = `${projectPrefix}-${typeCode}-${cleanRunningNumber}`;
    }
  }

  // Auto-assign spec_category_id if not provided
  let specCategoryId = values.specCategoryId;
  if (!specCategoryId && values.hardwareTypeId) {
    const { data: defaultCat } = await supabase
      .from("spec_categories")
      .select("id")
      .eq("hardware_type_id", values.hardwareTypeId)
      .eq("name", "Low Spec")
      .maybeSingle();

    if (defaultCat) specCategoryId = defaultCat.id;
  }

  const payload = {
    department_id: departmentId,
    asset_tag: generatedAssetTag,
    serial_number: values.serialNumber,
    pic_name: values.picName,
    contact_number: values.contactNumber,
    running_number: values.runningNumber,
    type_hardware: normalizedType,
    brand: values.brand,
    model: values.model,
    cpu: values.cpu,
    ram: values.ram,
    storage: values.storage,
    purchase_date: values.purchaseDate || null,
    warranty_expiry: values.warrantyExpiry || null,
    status: values.status,
    notes: values.notes,
    condition: "good",

    // Custodianship (Phase 2)
    assigned_user: values.assignedUser,
    assigned_department: values.assignedDepartment,
    custodian_team: values.custodianTeam,
    physical_room: values.physicalRoom,

    // Drill-down FKs (Phase 1)
    hardware_type_id: values.hardwareTypeId || null,
    spec_category_id: specCategoryId,
    brand_id: values.brandId || null,
    model_id: values.modelId || null,
  };

  const { data, error } = await supabase.from("hardware").insert(payload).select().single();

  if (error) {
    console.error("Error creating hardware (full details):", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  return data;
}

export async function getHardwareList() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hardware")
    .select(
      `
      id,
      asset_tag,
      serial_number,
      pic_name,
      type_hardware,
      brand,
      model,
      status,
      warranty_expiry,
      physical_room,
      department:departments(
        name,
        facility:facilities(
          name,
          state:states(name)
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching hardware:", error);
    return [];
  }

  // Map state and department structure back to maintain compatibility with existing frontend code.
  return data.map((hw) => {
    const dept = (
      hw as unknown as { department?: { name: string; facility?: { state?: { name: string } } } }
    ).department;
    return {
      ...hw,
      state: dept?.facility?.state?.name || "",
      department: { name: dept?.name || "" },
    };
  });
}

export async function getHardwareByDepartment(
  departmentId: string,
  hardwareTypeId?: string,
  specCategoryId?: string,
) {
  const supabase = createClient();
  let query = supabase
    .from("hardware")
    .select(
      `
      id,
      asset_tag,
      serial_number,
      pic_name,
      type_hardware,
      brand,
      model,
      status,
      warranty_expiry,
      physical_room,
      hardware_type_id,
      spec_category_id,
      hardware_types:hardware_type_id(name, icon),
      spec_categories:spec_category_id(name, color),
      department:departments(
        name,
        facility:facilities(
          name,
          state:states(name)
        )
      )
    `,
    )
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });

  if (hardwareTypeId) {
    query = query.eq("hardware_type_id", hardwareTypeId);
  }

  if (specCategoryId) {
    query = query.eq("spec_category_id", specCategoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching hardware by department:", error);
    return [];
  }

  return data ?? [];
}

export async function deleteHardware(id: string) {
  const supabase = createClient();
  await assertCanManageHardware(supabase);

  const { error } = await supabase.from("hardware").delete().eq("id", id);

  if (error) {
    console.error("Error deleting hardware:", error);
    throw error;
  }
}
