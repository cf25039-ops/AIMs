"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Loader2, Save } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getProjects } from "@/services/hierarchy";

type VendorOption = {
  id: string;
  name: string;
};

async function getVendorsForProject(projectId: string): Promise<VendorOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load vendors:", error);
    return [];
  }

  return data || [];
}

export default function CreateContractPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectFromUrl = params.get("projectId");
    if (projectFromUrl) {
      setProjectId(projectFromUrl);
    }
  }, []);

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors", projectId],
    queryFn: () => getVendorsForProject(projectId),
    enabled: Boolean(projectId),
  });

  const createContractMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("contracts").insert({
        project_id: projectId,
        vendor_id: vendorId || null,
        contract_number: contractNumber.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        value: value ? Number(value) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      router.push("/contracts");
      router.refresh();
      toast.success("Contract created successfully!");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate key") || error.code === "23505") {
        toast.error("Failed: Contract number already exists for this project.");
      } else {
        toast.error("Failed to create contract: " + (error.message || "Unknown error"));
      }
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    createContractMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Link href="/contracts">
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Create Contract Number</h2>
            <p className="text-sm text-muted-foreground">
              Register a contract number under a project for asset onboarding.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Contract Details
            </CardTitle>
            <CardDescription>
              The contract number will appear in the Add Hardware Wizard after it is saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  id="project"
                  value={projectId}
                  onChange={(event) => {
                    setProjectId(event.target.value);
                    setVendorId("");
                  }}
                  required
                  disabled={loadingProjects}
                >
                  <option value="" disabled>
                    {loadingProjects ? "Loading projects..." : "Select project"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-number">Contract Number</Label>
                <Input
                  id="contract-number"
                  value={contractNumber}
                  onChange={(event) => setContractNumber(event.target.value)}
                  placeholder="e.g. QT240000000022903"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Select
                  id="vendor"
                  value={vendorId}
                  onChange={(event) => setVendorId(event.target.value)}
                  disabled={!projectId || loadingVendors}
                >
                  <option value="">
                    {loadingVendors ? "Loading vendors..." : "No vendor / optional"}
                  </option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-value">Contract Value (MYR)</Label>
                <Input
                  id="contract-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Link href="/contracts">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={createContractMutation.isPending || !projectId}
                >
                  {createContractMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Contract Number
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
