"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { useStepper } from "@/hooks/use-stepper";
import { hardwareFormSchema, type HardwareFormValues } from "@/schemas/hardware";
import {
  getContracts,
  getProjects,
  getRegions,
  getFacilities,
  getFacilitiesForRegion,
  getDepartments,
} from "@/services/hierarchy";
import { getHardwareTypes } from "@/services/hardware-types";
import { getSpecCategories } from "@/services/spec-categories";
import { createHardware } from "@/services/hardware";
import { FilePlus2 } from "lucide-react";
import toast from "react-hot-toast";

const steps = [
  { title: "Project", description: "Select owner project" },
  { title: "Contract", description: "Choose contract number" },
  { title: "Location", description: "Region, facility & department" },
  { title: "Ownership", description: "Assign custodian & location" },
  { title: "Hardware", description: "Register asset details" },
];

const stepFields: Array<Array<keyof HardwareFormValues>> = [
  ["projectId"],
  ["contractId"],
  ["region", "state", "district"],
  ["assignedUser", "assignedDepartment", "custodianTeam", "physicalRoom"],
  [
    "hardwareProfile",
    "picName",
    "contactNumber",
    "serialNumber",
    "runningNumber",
    "status",
  ],
];

export function AddHardwareWizard() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const { currentStep, next, prev, goTo, isFirst, isLast } = useStepper(steps.length);

  const form = useForm<HardwareFormValues>({
    resolver: zodResolver(hardwareFormSchema),
    defaultValues: {
      status: "active",
      hardwareProfile: "",
      typeHardware: "",
      region: "",
      state: "",
      district: "",
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
    reset,
  } = form;

  const projectId = watch("projectId");
  const contractId = watch("contractId");
  const regionId = watch("region");
  const facilityId = watch("state");
  const departmentId = watch("district");
  const hardwareTypeId = watch("hardwareProfile");
  const specCategoryId = watch("notes");

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["contracts", projectId],
    queryFn: () => getContracts(projectId),
    enabled: Boolean(projectId),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ["regions", contractId],
    queryFn: () => getRegions(contractId),
    enabled: Boolean(contractId),
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ["facilities", regionId],
    queryFn: () => getFacilitiesForRegion(regionId!),
    enabled: Boolean(regionId),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", facilityId],
    queryFn: () => getDepartments(facilityId),
    enabled: Boolean(facilityId),
  });

  const { data: hardwareTypes = [] } = useQuery({
    queryKey: ["hardware-types", contractId],
    queryFn: () => getHardwareTypes(contractId),
    enabled: Boolean(contractId),
  });

  const { data: specCategories = [] } = useQuery({
    queryKey: ["spec-categories", hardwareTypeId],
    queryFn: () => getSpecCategories(hardwareTypeId),
    enabled: Boolean(hardwareTypeId),
  });

  const selectedHardwareType = hardwareTypes.find((t) => t.id === hardwareTypeId);
  const selectedSpecCategory = specCategories.find((s) => s.id === specCategoryId);

  const onSubmit = async (values: HardwareFormValues) => {
    try {
      await createHardware({
        ...values,
        hardwareTypeId: values.hardwareProfile || undefined,
        specCategoryId: values.notes || undefined,
        departmentId: values.district || undefined,
        typeHardware: selectedHardwareType?.name?.toLowerCase() || values.typeHardware,
      });
      setSubmitted(true);
      reset();
      toast.success("Hardware asset created successfully!");
    } catch (err: any) {
      console.error("Failed to save hardware:", err);
      const errMsg = err?.message || "Ralat tidak diketahui";
      toast.error(`Gagal mendaftar perkakasan: ${errMsg}`);
    }
  };

  const handleNext = async () => {
    const fields = stepFields[currentStep] ?? [];
    const isValid = await trigger(fields, { shouldFocus: true });
    if (isValid) {
      next();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FadeIn>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Add Hardware Wizard</CardTitle>
            <p className="text-sm text-muted-foreground">
              Follow the hierarchy flow to ensure contract-based tracking.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Stepper steps={steps} currentStep={currentStep} onStepClick={goTo} />

            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                Hardware entry saved. You can add another asset now.
              </div>
            ) : null}

            {currentStep === 0 ? (
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Project</label>
                  <Select {...register("projectId")} defaultValue="">
                    <option value="" disabled>
                      {projectsLoading ? "Loading projects..." : "Select project"}
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.label}</option>
                    ))}
                    {!projectsLoading && projects.length === 0 ? (
                      <option value="" disabled>No projects available</option>
                    ) : null}
                  </Select>
                  {errors.projectId && <p className="text-xs text-rose-500 mt-1">{errors.projectId.message}</p>}
                  {!projectsLoading && projects.length === 0 ? (
                    <p className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      No projects are visible for this account. Ask a Super Admin to assign Admin access or project membership.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="grid gap-4">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Contract Number</label>
                    {projectId ? (
                      <Link
                        href={`/contracts/create?projectId=${projectId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" />
                        Create contract number
                      </Link>
                    ) : null}
                  </div>
                  <Select {...register("contractId")} defaultValue="">
                    <option value="" disabled>
                      {contractsLoading ? "Loading contracts..." : "Select contract"}
                    </option>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>{contract.label}</option>
                    ))}
                  </Select>
                  {errors.contractId && <p className="text-xs text-rose-500 mt-1">{errors.contractId.message}</p>}
                  {projectId && contracts.length === 0 ? (
                    <p className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      No contract number exists for this project yet. Create one first, then return here.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Region</label>
                  <Select {...register("region")} defaultValue="" onChange={(e) => {
                    setValue("region", e.target.value);
                    setValue("state", "");
                    setValue("district", "");
                  }}>
                    <option value="" disabled>Select region</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </Select>
                  {errors.region && <p className="text-xs text-rose-500 mt-1">{errors.region.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Facility</label>
                  <Select {...register("state")} defaultValue="" disabled={!regionId} onChange={(e) => {
                    setValue("state", e.target.value);
                    setValue("district", "");
                  }}>
                    <option value="" disabled>Select facility</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </Select>
                  {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Select {...register("district")} defaultValue="" disabled={!facilityId}>
                    <option value="" disabled>Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </Select>
                  {errors.district && <p className="text-xs text-rose-500 mt-1">{errors.district.message}</p>}
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Assigned User</label>
                  <Input {...register("assignedUser")} placeholder="e.g. Dr. Ahmad" />
                  {errors.assignedUser && <p className="text-xs text-rose-500 mt-1">{errors.assignedUser.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Department Ownership</label>
                  <Input {...register("assignedDepartment")} placeholder="e.g. Emergency Dept" />
                  {errors.assignedDepartment && <p className="text-xs text-rose-500 mt-1">{errors.assignedDepartment.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Technical Custodian</label>
                  <Input {...register("custodianTeam")} placeholder="e.g. IT Infra Team" />
                  {errors.custodianTeam && <p className="text-xs text-rose-500 mt-1">{errors.custodianTeam.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Physical Room / Floor</label>
                  <Input {...register("physicalRoom")} placeholder="e.g. Level 2, Room ICU-03" />
                  {errors.physicalRoom && <p className="text-xs text-rose-500 mt-1">{errors.physicalRoom.message}</p>}
                </div>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Hardware Type</label>
                  <Select {...register("hardwareProfile")} defaultValue="" onChange={(e) => {
                    setValue("hardwareProfile", e.target.value);
                    setValue("notes", "");
                  }}>
                    <option value="" disabled>Select hardware type</option>
                    {hardwareTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                  {errors.hardwareProfile && <p className="text-xs text-rose-500 mt-1">{errors.hardwareProfile.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Spec Category</label>
                  <Select {...register("notes")} defaultValue="" disabled={!hardwareTypeId}>
                    <option value="" disabled>{hardwareTypeId ? "Select spec category" : "Select hardware type first"}</option>
                    {specCategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.color && <span>[{s.color}] </span>}
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  {errors.notes && <p className="text-xs text-rose-500 mt-1">{errors.notes.message}</p>}
                </div>

                <div className="md:col-span-2 my-2 border-b"></div>

                <div>
                  <label className="text-sm font-medium">Brand</label>
                  <Input {...register("brand")} placeholder="e.g. Dell, HP, Canon" />
                  {errors.brand && <p className="text-xs text-rose-500 mt-1">{errors.brand.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Input {...register("model")} placeholder="e.g. Latitude 5430" />
                  {errors.model && <p className="text-xs text-rose-500 mt-1">{errors.model.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-primary">Processor</label>
                  <Input {...register("cpu")} placeholder="e.g. Intel Core i5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-primary">RAM</label>
                  <Input {...register("ram")} placeholder="e.g. 8GB DDR4 3200 MHz" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-primary">Hard Disk</label>
                  <Input {...register("storage")} placeholder="e.g. 512GB PCIe NVMe" />
                </div>

                {selectedSpecCategory && (
                  <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                    Spec: {selectedSpecCategory.name} {selectedSpecCategory.description && ` — ${selectedSpecCategory.description}`}
                  </div>
                )}

                <div className="md:col-span-2 my-2 border-b"></div>

                <div>
                  <label className="text-sm font-medium">Serial Number</label>
                  <Input {...register("serialNumber")} placeholder="SN-" />
                  {errors.serialNumber && <p className="text-xs text-rose-500 mt-1">{errors.serialNumber.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Running Number</label>
                  <Input {...register("runningNumber")} placeholder="Office ID" />
                  {errors.runningNumber && <p className="text-xs text-rose-500 mt-1">{errors.runningNumber.message}</p>}
                </div>

                <div className="md:col-span-2 my-2 border-b"></div>

                <div>
                  <label className="text-sm font-medium">PIC Name</label>
                  <Input {...register("picName")} placeholder="e.g. Dr. Ahmad" />
                  {errors.picName && <p className="text-xs text-rose-500 mt-1">{errors.picName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Number</label>
                  <Input {...register("contactNumber")} placeholder="+60" />
                  {errors.contactNumber && <p className="text-xs text-rose-500 mt-1">{errors.contactNumber.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select {...register("status")}>
                    <option value="active">Active</option>
                    <option value="standby">Standby</option>
                    <option value="in_repair">In Repair</option>
                    <option value="in_store">In Store</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Purchase Date</label>
                  <Input type="date" {...register("purchaseDate")} />
                </div>
                <div>
                  <label className="text-sm font-medium">Warranty Expiry</label>
                  <Input type="date" {...register("warrantyExpiry")} />
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={isFirst ? () => router.push("/assets") : prev}
              >
                Back
              </Button>
              {isLast ? (
                <Button type="submit">Save Hardware</Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </form>
  );
}
