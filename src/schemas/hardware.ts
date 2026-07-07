import { z } from "zod";

export const hardwareFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  contractId: z.string().min(1, "Contract is required"),
  region: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),

  picName: z.string().min(2, "PIC name is required"),
  contactNumber: z.string().min(5, "Contact number is required"),
  serialNumber: z.string().min(3, "Serial number is required"),
  status: z.enum([
    "active",
    "standby",
    "in_repair",
    "in_store",
    "retired",
    "disposed",
    "lost",
    "transferred",
    "reserved",
    "pending_deployment",
  ]),
  runningNumber: z.string().min(1, "Running number is required"),
  hardwareProfile: z.string().optional(),
  typeHardware: z.string().min(1, "Hardware type is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  assetTag: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),

  // Custodianship fields (Phase 2)
  assignedUser: z.string().optional(),
  assignedDepartment: z.string().optional(),
  custodianTeam: z.string().optional(),
  physicalRoom: z.string().optional(),

  // PC / Laptop / Server fields
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),

  // Printer fields
  printerToner: z.string().optional(),
  printerType: z.string().optional(),

  // Server fields
  serverOs: z.string().optional(),
  serverRack: z.string().optional(),

  // Drill-down FK fields (Phase 1)
  hardwareTypeId: z.string().optional(),
  specCategoryId: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  departmentId: z.string().optional(),
});

export type HardwareFormValues = z.infer<typeof hardwareFormSchema>;
