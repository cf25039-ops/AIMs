export const demoProjects = [
  { id: "proj_kkm", label: "KKM", code: "KKM" },
  { id: "proj_pdrm", label: "PDRM", code: "PDRM" },
];

export const demoContracts = [
  {
    id: "contract_kkm_2026_001",
    projectId: "proj_kkm",
    label: "KKM-ICT-2026-001",
  },
  {
    id: "contract_kkm_2027_004",
    projectId: "proj_kkm",
    label: "KKM-ICT-2027-004",
  },
  {
    id: "contract_pdrm_2026_002",
    projectId: "proj_pdrm",
    label: "PDRM-ICT-2026-002",
  },
];

export const demoRegions = [
  {
    id: "region_central",
    contractId: "contract_kkm_2026_001",
    label: "Central Region",
  },
  {
    id: "region_north",
    contractId: "contract_kkm_2026_001",
    label: "Northern Region",
  },
  {
    id: "region_selatan",
    contractId: "contract_pdrm_2026_002",
    label: "Southern Region",
  },
];

export const demoStates = [
  { id: "state_selangor", regionId: "region_central", label: "Selangor" },
  { id: "state_kuala", regionId: "region_central", label: "Kuala Lumpur" },
  { id: "state_perak", regionId: "region_north", label: "Perak" },
];

export const demoFacilities = [
  {
    id: "facility_hsa",
    stateId: "state_selangor",
    label: "Hospital Shah Alam",
  },
  {
    id: "facility_hkl",
    stateId: "state_kuala",
    label: "Hospital Kuala Lumpur",
  },
  {
    id: "facility_hj",
    stateId: "state_perak",
    label: "Hospital Ipoh",
  },
];

export const demoDepartments = [
  {
    id: "dept_emergency",
    facilityId: "facility_hsa",
    label: "Emergency Department",
  },
  {
    id: "dept_icu",
    facilityId: "facility_hsa",
    label: "Intensive Care Unit",
  },
  {
    id: "dept_it",
    facilityId: "facility_hkl",
    label: "IT Department",
  },
];
