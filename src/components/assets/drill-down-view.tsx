"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Building2,
  Landmark,
  Monitor,
  SlidersHorizontal,
  Search,
  Plus,
  FileDown,
  Grid,
  List,
  Trash2,
  MoreHorizontal,
  X,
  Building,
  MapPinIcon,
  ClipboardList,
  Wrench,
  Edit,
  ExternalLink,
} from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DrillCard } from "./drill-card";
import { DrillBreadcrumb, type BreadcrumbStep } from "./drill-breadcrumb";
import {
  getRegionsWithCounts,
  getFacilitiesForRegion,
  getDepartmentsWithCounts,
  getContractsWithCounts,
} from "@/services/hierarchy";
import { getHardwareTypesWithCounts } from "@/services/hardware-types";
import { getSpecCategoriesWithCounts } from "@/services/spec-categories";
import { getHardwareByDepartment, deleteHardware } from "@/services/hardware";
import { getWarrantyStatus } from "@/utils/warranty";
import { useRole } from "@/contexts/role-context";
import { canCreateTickets, canManageAssets } from "@/utils/role";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types";
import toast from "react-hot-toast";

type DrillLevel = "contract" | "region" | "facility" | "department" | "type" | "spec" | "list";

type DrillState = {
  level: DrillLevel;
  contractId?: string;
  contractLabel?: string;
  regionId?: string;
  regionLabel?: string;
  facilityId?: string;
  facilityLabel?: string;
  departmentId?: string;
  departmentLabel?: string;
  typeId?: string;
  typeLabel?: string;
  specId?: string;
  specLabel?: string;
};

function readStateFromParams(
  params: URLSearchParams,
  _contracts: SelectOption[],
): DrillState | null {
  const level = params.get("level") as DrillLevel | null;
  if (!level) return null;
  return {
    level,
    contractId: params.get("cid") || undefined,
    contractLabel: params.get("clabel") || undefined,
    regionId: params.get("rid") || undefined,
    regionLabel: params.get("rlabel") || undefined,
    facilityId: params.get("fid") || undefined,
    facilityLabel: params.get("flabel") || undefined,
    departmentId: params.get("did") || undefined,
    departmentLabel: params.get("dlabel") || undefined,
    typeId: params.get("tid") || undefined,
    typeLabel: params.get("tlabel") || undefined,
    specId: params.get("sid") || undefined,
    specLabel: params.get("slabel") || undefined,
  };
}

function stateToParams(state: DrillState): URLSearchParams {
  const p = new URLSearchParams();
  p.set("level", state.level);
  if (state.contractId) p.set("cid", state.contractId);
  if (state.contractLabel) p.set("clabel", state.contractLabel);
  if (state.regionId) p.set("rid", state.regionId);
  if (state.regionLabel) p.set("rlabel", state.regionLabel);
  if (state.facilityId) p.set("fid", state.facilityId);
  if (state.facilityLabel) p.set("flabel", state.facilityLabel);
  if (state.departmentId) p.set("did", state.departmentId);
  if (state.departmentLabel) p.set("dlabel", state.departmentLabel);
  if (state.typeId) p.set("tid", state.typeId);
  if (state.typeLabel) p.set("tlabel", state.typeLabel);
  if (state.specId) p.set("sid", state.specId);
  if (state.specLabel) p.set("slabel", state.specLabel);
  return p;
}

const _iconMap: Record<string, any> = {
  Laptop: Monitor,
  PC: Monitor,
  Printer: Building2,
  Server: Building2,
  Projector: Monitor,
};

const typeIconMap: Record<DrillLevel, any> = {
  contract: Building,
  region: Landmark,
  facility: Building2,
  department: Building,
  type: Monitor,
  spec: SlidersHorizontal,
  list: ClipboardList,
};

export function DrillDownView({
  contracts,
  contractLabel: _initialContractLabel,
}: {
  contracts: SelectOption[];
  contractLabel?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useRole();
  const canManageHardware = canManageAssets(role);
  const canReportIssue = canCreateTickets(role);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<DrillState>(() => {
    const fromUrl = readStateFromParams(searchParams, contracts);
    if (fromUrl) return fromUrl;
    if (contracts.length === 1) {
      return { level: "region", contractId: contracts[0].id, contractLabel: contracts[0].label };
    }
    return { level: "contract" };
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDeletingId, setActiveDeletingId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteHardware,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-by-dept", state.departmentId] });
      setOpenMenuId(null);
      setActiveDeletingId(null);
    },
    onError: (err) => {
      console.error("Failed to delete hardware:", err);
      toast.error("Failed to delete asset. Please check your permissions.");
      setActiveDeletingId(null);
    },
  });

  const navigate = useCallback(
    (updates: Partial<DrillState>) => {
      setState((prev) => {
        const next = { ...prev, ...updates };
        const p = stateToParams(next);
        router.replace(`/assets?${p.toString()}`, { scroll: false });
        return next;
      });
      setSearchQuery("");
      setSelectedIds([]);
      setOpenMenuId(null);
    },
    [router],
  );

  // Queries
  const contractsQuery = useQuery({
    queryKey: ["contracts-with-counts"],
    queryFn: getContractsWithCounts,
    enabled: state.level === "contract",
  });

  const regionsQuery = useQuery({
    queryKey: ["regions-with-counts", state.contractId],
    queryFn: () => getRegionsWithCounts(state.contractId!),
    enabled: state.level === "region" && !!state.contractId,
  });

  const facilitiesQuery = useQuery({
    queryKey: ["facilities-for-region", state.regionId],
    queryFn: () => getFacilitiesForRegion(state.regionId!),
    enabled: state.level === "facility" && !!state.regionId,
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments-with-counts", state.facilityId],
    queryFn: () => getDepartmentsWithCounts(state.facilityId!),
    enabled: state.level === "department" && !!state.facilityId,
    refetchOnMount: true,
  });

  const typesQuery = useQuery({
    queryKey: ["hardware-types-with-counts", state.contractId, state.departmentId],
    queryFn: () => getHardwareTypesWithCounts(state.contractId!, state.departmentId),
    enabled: state.level === "type" && !!state.contractId,
  });

  const specsQuery = useQuery({
    queryKey: ["spec-categories-with-counts", state.typeId, state.departmentId],
    queryFn: () => getSpecCategoriesWithCounts(state.typeId!, state.departmentId),
    enabled: state.level === "spec" && !!state.typeId,
  });

  const hardwareQuery = useQuery({
    queryKey: ["hardware-by-dept", state.departmentId, state.typeId, state.specId],
    queryFn: () => getHardwareByDepartment(state.departmentId!, state.typeId, state.specId),
    enabled: state.level === "list" && !!state.departmentId,
  });

  const buildBreadcrumb = (): BreadcrumbStep[] => {
    const steps: BreadcrumbStep[] = [];
    if (contracts.length > 1) {
      steps.push({ label: "Contracts", onClick: () => navigate({ level: "contract" }) });
    }
    if (state.contractLabel) {
      const goBack = () => navigate({ level: "contract" });
      steps.push({
        label: state.contractLabel!,
        onClick: state.level !== "contract" ? goBack : undefined,
      });
    }
    if (state.regionLabel) {
      const goBack = () =>
        navigate({
          level: "region",
          regionId: undefined,
          regionLabel: undefined,
          facilityId: undefined,
          facilityLabel: undefined,
          departmentId: undefined,
          departmentLabel: undefined,
          typeId: undefined,
          typeLabel: undefined,
          specId: undefined,
          specLabel: undefined,
        });
      steps.push({
        label: state.regionLabel!,
        onClick: state.level !== "region" ? goBack : undefined,
      });
    }
    if (state.facilityLabel) {
      const goBack = () =>
        navigate({
          level: "facility",
          facilityId: undefined,
          facilityLabel: undefined,
          departmentId: undefined,
          departmentLabel: undefined,
          typeId: undefined,
          typeLabel: undefined,
          specId: undefined,
          specLabel: undefined,
        });
      steps.push({
        label: state.facilityLabel!,
        onClick: state.level !== "facility" ? goBack : undefined,
      });
    }
    if (state.departmentLabel) {
      const goBack = () =>
        navigate({
          level: "department",
          departmentId: undefined,
          departmentLabel: undefined,
          typeId: undefined,
          typeLabel: undefined,
          specId: undefined,
          specLabel: undefined,
        });
      steps.push({
        label: state.departmentLabel!,
        onClick: state.level !== "department" ? goBack : undefined,
      });
    }
    if (state.typeLabel) {
      const goBack = () =>
        navigate({
          level: "type",
          typeId: undefined,
          typeLabel: undefined,
          specId: undefined,
          specLabel: undefined,
        });
      steps.push({ label: state.typeLabel!, onClick: state.level !== "type" ? goBack : undefined });
    }
    if (state.specLabel) {
      const goBack = () => navigate({ level: "spec", specId: undefined, specLabel: undefined });
      steps.push({ label: state.specLabel!, onClick: state.level !== "spec" ? goBack : undefined });
    }
    return steps;
  };

  const breadcrumb = buildBreadcrumb();

  const getLevelTitle = () => {
    switch (state.level) {
      case "contract":
        return "Select Contract";
      case "region":
        return "Select Region";
      case "facility":
        return "Select Facility";
      case "department":
        return "Select Department";
      case "type":
        return "Select Hardware Type";
      case "spec":
        return "Select Spec Category";
      case "list":
        return "Hardware List";
    }
  };

  // Render contract selection
  if (state.level === "contract") {
    const contractItems =
      contractsQuery.data ?? contracts.map((c) => ({ id: c.id, label: c.label, count: 0 }));
    return (
      <FadeIn className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 1</p>
          <h2 className="text-3xl font-semibold bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            {getLevelTitle()}
          </h2>
        </div>
        {contractsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl border border-border/30 bg-card/30 animate-pulse"
              />
            ))}
          </div>
        ) : contractItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-card/30 p-8 text-center backdrop-blur-md">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground/60 stroke-[1.5]" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">No contracts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No contracts accessible to your account.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contractItems.map((contract) => (
              <DrillCard
                key={contract.id}
                label={contract.label}
                count={contract.count}
                icon={Building}
                onClick={() =>
                  navigate({
                    level: "region",
                    contractId: contract.id,
                    contractLabel: contract.label,
                  })
                }
              />
            ))}
          </div>
        )}
      </FadeIn>
    );
  }

  // Render region/facility/department/type/spec as drill levels
  const renderDrillCards = () => {
    let items: { id: string; label: string; count: number }[] = [];
    let levelLabelPlural = "";

    switch (state.level) {
      case "region":
        items = regionsQuery.data ?? [];
        levelLabelPlural = "regions";
        break;
      case "facility":
        items = facilitiesQuery.data ?? [];
        levelLabelPlural = "facilities";
        break;
      case "department":
        items = departmentsQuery.data ?? [];
        levelLabelPlural = "departments";
        break;
      case "type":
        items = (typesQuery.data ?? []).map((t) => ({ id: t.id, label: t.name, count: t.count }));
        levelLabelPlural = "hardware types";
        break;
      case "spec":
        items = (specsQuery.data ?? []).map((s) => ({ id: s.id, label: s.name, count: s.count }));
        levelLabelPlural = "spec categories";
        break;
    }

    const onClickLevel = (item: { id: string; label: string }) => {
      switch (state.level) {
        case "region":
          navigate({ level: "facility", regionId: item.id, regionLabel: item.label });
          break;
        case "facility":
          navigate({ level: "department", facilityId: item.id, facilityLabel: item.label });
          break;
        case "department":
          navigate({
            level: "type",
            contractId: state.contractId,
            departmentId: item.id,
            departmentLabel: item.label,
          });
          break;
        case "type":
          navigate({
            level: "spec",
            typeId: item.id,
            typeLabel: item.label,
          });
          break;
        case "spec":
          navigate({
            level: "list",
            specId: item.id,
            specLabel: item.label,
          });
          break;
      }
    };

    const isLoading =
      state.level === "region"
        ? regionsQuery.isLoading
        : state.level === "facility"
          ? facilitiesQuery.isLoading
          : state.level === "department"
            ? departmentsQuery.isLoading
            : state.level === "type"
              ? typesQuery.isLoading
              : state.level === "spec"
                ? specsQuery.isLoading
                : false;

    const Icon = typeIconMap[state.level];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {state.level === "region"
                ? "Step 2"
                : state.level === "type"
                  ? "Step 3"
                  : state.level === "spec"
                    ? "Step 4"
                    : ""}
            </p>
            <h2 className="text-3xl font-semibold bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              {getLevelTitle()}
            </h2>
          </div>
          {canManageHardware && (
            <Link href="/assets/add">
              <Button
                variant="accent"
                className="gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] transition"
              >
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DrillBreadcrumb steps={breadcrumb} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl border border-border/30 bg-card/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-card/30 p-8 text-center backdrop-blur-md">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground/60 stroke-[1.5]" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">No {levelLabelPlural} found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No items available at this level.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <DrillCard
                  key={item.id}
                  label={item.label}
                  count={item.count}
                  icon={Icon}
                  onClick={() => onClickLevel(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  // Render hardware list
  const renderHardwareList = () => {
    const assets = hardwareQuery.data ?? [];

    const filteredAssets = assets.filter((asset: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        `${asset.brand || ""} ${asset.model || ""}`.toLowerCase().includes(q) ||
        (asset.serial_number || "").toLowerCase().includes(q) ||
        (asset.asset_tag || "").toLowerCase().includes(q) ||
        (asset.pic_name || "").toLowerCase().includes(q)
      );
    });

    const handleBulkDelete = async () => {
      if (
        confirm(
          `Adakah anda pasti mahu memadam ${selectedIds.length} aset yang dipilih secara serentak?`,
        )
      ) {
        try {
          for (const id of selectedIds) {
            await deleteHardware(id);
          }
          queryClient.invalidateQueries({ queryKey: ["hardware-by-dept", state.departmentId] });
          setSelectedIds([]);
          toast.success("Assets deleted successfully!");
        } catch (err) {
          console.error(err);
          toast.error("Failed to delete assets.");
        }
      }
    };

    const exportToCSV = () => {
      if (filteredAssets.length === 0) return;
      const headers = [
        "ID",
        "Asset Tag",
        "Asset Name",
        "Type",
        "Serial Number",
        "Status",
        "PIC",
        "Room",
        "Warranty Expiry",
      ];
      const rows = filteredAssets.map((asset: any) => [
        asset.id,
        asset.asset_tag,
        `${asset.brand || ""} ${asset.model || ""}`.trim() || asset.type_hardware,
        asset.type_hardware,
        asset.serial_number || "",
        asset.status,
        asset.pic_name || "",
        asset.physical_room || "",
        asset.warranty_expiry || "",
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          headers.join(","),
          ...rows.map((e: string[]) => e.map((val: string) => `"${val}"`).join(",")),
        ].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `AIMS_Asset_List_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 5</p>
            <h2 className="text-3xl font-semibold bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Hardware Inventory
            </h2>
          </div>
          {canManageHardware && (
            <Link href="/assets/add">
              <Button
                variant="accent"
                className="gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] transition"
              >
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </Link>
          )}
        </div>

        <DrillBreadcrumb steps={breadcrumb} />

        {/* Toolbar */}
        <div className="sticky top-[73px] z-20 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between shadow-sm">
          <div className="relative w-full md:max-w-xs group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search assets... (Press '/')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/80 bg-card/50 pl-9 pr-8 text-sm outline-none transition focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {canManageHardware && selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-10 rounded-xl gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Padam ({selectedIds.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredAssets.length === 0}
              className="h-10 rounded-xl gap-1.5"
              title="Export CSV"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <div className="flex items-center border border-border/80 rounded-xl bg-card/40 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition",
                  viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition",
                  viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {hardwareQuery.isLoading ? (
          <div className="space-y-4 rounded-3xl border border-border/50 bg-card/50 p-6 backdrop-blur-md">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex h-14 items-center rounded-2xl border border-border/30 bg-card/30 px-4 animate-pulse"
              >
                <div className="h-4 w-4 rounded bg-muted mr-4" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-card/30 p-8 text-center backdrop-blur-md">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground/60 stroke-[1.5]" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Tiada Aset Ditemui</h3>
              <p className="text-sm text-muted-foreground mt-1">Tiada rekod aset pada tahap ini.</p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/60 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 backdrop-blur-md select-none">
                    {canManageHardware && (
                      <th className="w-12 px-5 py-4">
                        <input
                          type="checkbox"
                          checked={
                            filteredAssets.length > 0 &&
                            filteredAssets.every((a: any) => selectedIds.includes(a.id))
                          }
                          onChange={() => {
                            const ids = filteredAssets.map((a: any) => a.id);
                            const allSelected = ids.every((id: string) => selectedIds.includes(id));
                            if (allSelected)
                              setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
                            else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-4">Asset Name</th>
                    <th className="px-4 py-4 hidden md:table-cell">Serial Number</th>
                    <th className="px-4 py-4">Asset Tag</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 hidden lg:table-cell">PIC</th>
                    <th className="px-4 py-4 hidden xl:table-cell">Room</th>
                    <th className="px-4 py-4">Warranty</th>
                    <th className="w-16 px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <AnimatePresence initial={false}>
                    {filteredAssets.map((asset: any) => {
                      const isSelected = selectedIds.includes(asset.id);
                      const _warranty = getWarrantyStatus(asset.warranty_expiry);
                      const displayName =
                        `${asset.brand || ""} ${asset.model || ""}`.trim() ||
                        (asset.type_hardware
                          ? asset.type_hardware.charAt(0).toUpperCase() +
                            asset.type_hardware.slice(1)
                          : "Unnamed Asset");
                      return (
                        <motion.tr
                          key={asset.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "group hover:bg-muted/10 transition-colors select-none",
                            isSelected && "bg-primary/5",
                          )}
                        >
                          {canManageHardware && (
                            <td className="px-5 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedIds((prev) =>
                                    prev.includes(asset.id)
                                      ? prev.filter((id) => id !== asset.id)
                                      : [...prev, asset.id],
                                  )
                                }
                                className="h-4 w-4 rounded border-border text-primary accent-primary"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                                <span className="text-[10px] font-bold uppercase">
                                  {asset.type_hardware?.substring(0, 2) || "HW"}
                                </span>
                              </div>
                              <Link
                                href={`/assets/${asset.id}`}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                              >
                                {displayName}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden md:table-cell">
                            {asset.serial_number || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground border border-border/50">
                              {asset.asset_tag}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                                asset.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : asset.status === "in_repair"
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  asset.status === "active"
                                    ? "bg-emerald-500"
                                    : asset.status === "in_repair"
                                      ? "bg-amber-500 animate-pulse"
                                      : "bg-blue-500",
                                )}
                              />
                              {asset.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-foreground hidden lg:table-cell">
                            {asset.pic_name || "Unassigned"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                              {asset.physical_room || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              if (!asset.warranty_expiry)
                                return (
                                  <span className="text-[9px] text-muted-foreground">
                                    No Warranty
                                  </span>
                                );
                              const days = Math.ceil(
                                (new Date(asset.warranty_expiry).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24),
                              );
                              if (days <= 0)
                                return (
                                  <span className="text-[9px] font-semibold text-rose-600">
                                    Expired
                                  </span>
                                );
                              if (days <= 90)
                                return (
                                  <span className="text-[9px] font-semibold text-amber-600">
                                    {days}d left
                                  </span>
                                );
                              return (
                                <span className="text-[9px] text-emerald-600">
                                  {(days / 365).toFixed(1)}y
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-3 text-center relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === asset.id ? null : asset.id);
                              }}
                              className="h-8 w-8 rounded-lg hover:bg-muted border border-transparent hover:border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <AnimatePresence>
                              {openMenuId === asset.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.1 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-6 top-10 mt-1 w-48 rounded-xl border border-border bg-popover/90 p-1 shadow-xl z-30 overflow-hidden backdrop-blur-xl select-none"
                                >
                                  <Link
                                    href={`/assets/${asset.id}`}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-muted text-foreground transition-colors"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                                    View Details
                                  </Link>
                                  {canManageHardware && (
                                    <>
                                      <Link
                                        href={`/assets/${asset.id}`}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-muted text-foreground transition-colors"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                                        Asset
                                      </Link>
                                      <Link
                                        href="/assets/transfer"
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-muted text-foreground transition-colors"
                                      >
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                                        Transfer Asset
                                      </Link>
                                    </>
                                  )}
                                  <Link
                                    href="/maintenance"
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-muted text-foreground transition-colors"
                                  >
                                    <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                                    History logs
                                  </Link>
                                  {canReportIssue && (
                                    <Link
                                      href={`/maintenance/create?hardware_id=${asset.id}`}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-muted text-primary transition-colors"
                                    >
                                      <Wrench className="h-3.5 w-3.5" /> Report Issue
                                    </Link>
                                  )}
                                  {canManageHardware && (
                                    <>
                                      <div className="h-px bg-border/60 my-1" />
                                      <button
                                        onClick={() => {
                                          if (
                                            confirm(
                                              `Adakah anda pasti mahu memadam aset "${displayName}"?`,
                                            )
                                          ) {
                                            setActiveDeletingId(asset.id);
                                            deleteMutation.mutate(asset.id);
                                          }
                                        }}
                                        disabled={
                                          deleteMutation.isPending && activeDeletingId === asset.id
                                        }
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-rose-500/10 text-rose-600 hover:text-rose-500 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {deleteMutation.isPending && activeDeletingId === asset.id
                                          ? "Deleting..."
                                          : "Delete Asset"}
                                      </button>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/50 bg-muted/5 px-6 py-4 gap-3 text-xs text-muted-foreground select-none">
              <p>
                Showing <strong>{filteredAssets.length}</strong> of <strong>{assets.length}</strong>{" "}
                total assets.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {filteredAssets.map((asset: any) => {
                const displayName =
                  `${asset.brand || ""} ${asset.model || ""}`.trim() || asset.type_hardware;
                return (
                  <motion.div
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="relative group rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/30 transition shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="info" className="capitalize text-[9px] px-2 py-0.5">
                          {asset.type_hardware || "hardware"}
                        </Badge>
                        <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {asset.asset_tag}
                        </code>
                      </div>
                      <Link
                        href={`/assets/${asset.id}`}
                        className="font-medium text-foreground hover:text-primary block text-base leading-tight hover:underline"
                      >
                        {displayName}
                      </Link>
                      <span className="text-[10px] font-mono text-muted-foreground block">
                        S/N: {asset.serial_number || "—"}
                      </span>
                    </div>
                    <div className="mt-3 border-t border-border/40 pt-3 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          asset.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : asset.status === "in_repair"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "",
                        )}
                      >
                        {asset.status?.replace(/_/g, " ")}
                      </span>
                      <Link
                        href={`/assets/${asset.id}`}
                        className="text-[10px] text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  if (state.level === "list") return renderHardwareList();
  return renderDrillCards();
}
