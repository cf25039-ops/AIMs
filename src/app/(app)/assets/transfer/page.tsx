"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AccessDenied } from "@/components/auth/access-denied";
import { assetTransferSchema, type AssetTransferValues } from "@/schemas/movement";
import { transferHardware } from "@/services/movement";
import { getHardwareList } from "@/services/hardware";
import { getDepartments } from "@/services/hierarchy";
import { useRole } from "@/contexts/role-context";
import { canManageAssets } from "@/utils/role";
import { ArrowLeft, ArrowRightLeft, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

export default function AssetTransferPage() {
  const router = useRouter();
  const { role, isLoading: roleLoading } = useRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: hardwareList = [] } = useQuery({
    queryKey: ["hardware"],
    queryFn: getHardwareList,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-all"],
    queryFn: async () => {
      // In a real big DB, we'd fetch departments for a specific facility, but here we'll get all for the demo
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("departments").select("id, name, facilities(name)");
      return data || [];
    },
  });

  const form = useForm<AssetTransferValues>({
    resolver: zodResolver(assetTransferSchema),
  });

  const selectedAssetId = form.watch("assetId");
  const selectedAsset = hardwareList.find((h: any) => h.id === selectedAssetId);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canManageAssets(role)) {
    return (
      <AccessDenied
        title="Asset Transfer Restricted"
        description="Only admin-level users can transfer or reassign hardware assets."
        href="/assets"
        actionLabel="Back to Assets"
      />
    );
  }

  const onSubmit = async (values: AssetTransferValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await transferHardware(values);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      router.push("/assets");
    } catch (error) {
      console.error("Failed to transfer asset:", error);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold">Asset Transfer</h2>
            <p className="text-sm text-muted-foreground">Relocate hardware and reassign Person In Charge (PIC)</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Transfer Logistics
            </CardTitle>
            <CardDescription>
              Complete the form below to securely transfer an asset. All transfers are securely logged in the immutable audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Asset Selection */}
              <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">1. Select Asset</h3>
                <div>
                  <Select {...form.register("assetId")} defaultValue="">
                    <option value="" disabled>Search or select an asset...</option>
                    {hardwareList.map((asset: any) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_tag} - {asset.brand?.name} {asset.model?.name}
                      </option>
                    ))}
                  </Select>
                  {form.formState.errors.assetId && (
                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.assetId.message}</p>
                  )}
                </div>

                {/* Current Location Info Display */}
                {selectedAsset && (
                  <div className="mt-4 flex gap-4 p-3 bg-card rounded-lg border border-border/50 text-sm">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="grid gap-1">
                      <p className="font-medium text-foreground">Current Location</p>
                      <p className="text-muted-foreground">
                        {(selectedAsset.department as any)?.name || 'Unknown Department'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current PIC: <span className="font-medium text-foreground">{selectedAsset.pic_name || 'Unassigned'}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">2. Destination</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Department</label>
                    <Select {...form.register("toDepartmentId")} defaultValue="" disabled={!selectedAssetId}>
                      <option value="" disabled>Select new department...</option>
                      {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.facilities?.name})
                        </option>
                      ))}
                    </Select>
                    {form.formState.errors.toDepartmentId && (
                      <p className="text-xs text-rose-500 mt-1">{form.formState.errors.toDepartmentId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">New PIC Name</label>
                    <Input {...form.register("toPic")} placeholder="Enter name of new PIC..." disabled={!selectedAssetId} />
                    {form.formState.errors.toPic && (
                      <p className="text-xs text-rose-500 mt-1">{form.formState.errors.toPic.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Transfer Reason</label>
                  <Input {...form.register("transferReason")} placeholder="e.g. Relocated for new staff member" disabled={!selectedAssetId} />
                  {form.formState.errors.transferReason && (
                    <p className="text-xs text-rose-500 mt-1">{form.formState.errors.transferReason.message}</p>
                  )}
                </div>
              </div>

              {serverError && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                  {serverError}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting || !selectedAssetId} className="w-full md:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    "Authorize Transfer"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
