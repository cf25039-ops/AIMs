"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Printer,
  Server,
  Cpu,
  HardDrive,
  Network,
  User,
  MapPin,
  Calendar,
  Shield,
  Hash,
  Wrench,
  Activity,
  Loader2,
} from "lucide-react";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ["asset-detail", id],
    queryFn: async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("hardware")
        .select(`
          *,
          department:departments(
            id, name, code,
            facility:facilities(
              id, name,
              state:states(id, name)
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-destructive font-medium">Asset not found or access denied.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const qrUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://aims.local/assets/${id}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "success" as const;
      case "in_repair": return "warning" as const;
      case "disposed": case "retired": case "lost": return "danger" as const;
      default: return "info" as const;
    }
  };

  const healthScore = asset.health_score ?? null;
  const healthColor =
    healthScore === null ? "text-muted-foreground" :
    healthScore < 40 ? "text-rose-500" :
    healthScore < 70 ? "text-amber-500" :
    "text-emerald-500";

  const facilityName = (asset.department as any)?.facility?.name || null;
  const stateName = (asset.department as any)?.facility?.state?.name || null;
  const locationParts = [
    (asset.department as any)?.name,
    facilityName,
    stateName,
  ].filter(Boolean);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="print:hidden">
        <FadeIn>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-9 w-9 p-0 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Asset Details
              </h2>
              <p className="text-sm text-muted-foreground">
                {asset.brand} {asset.model} — {asset.asset_tag}
              </p>
            </div>
            <div className="ml-auto">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Label
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: QR Code & Identity */}
        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <Card className="glass-card flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm print:shadow-none print:border-none print:p-0">
                <QRCode value={qrUrl} size={180} />
              </div>
              <h3 className="mt-6 text-xl font-bold font-mono tracking-tight">
                {asset.asset_tag}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scan QR to view this profile
              </p>
              <Badge
                variant={getStatusBadge(asset.status)}
                className="uppercase px-3 py-1"
              >
                {asset.status.replace(/_/g, " ")}
              </Badge>
            </Card>
          </FadeIn>

          {/* Location & Assignment */}
          <FadeIn delay={0.15} className="print:hidden">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location & Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Person In Charge</p>
                    <p className="text-sm font-medium">{asset.pic_name || "Unassigned"}</p>
                    {asset.contact_number && (
                      <p className="text-xs text-muted-foreground">{asset.contact_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">
                      {locationParts.length > 0 ? locationParts.join(" → ") : "Unassigned"}
                    </p>
                  </div>
                </div>
                {healthScore !== null && (
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Health Score</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${healthColor}`}>
                          {healthScore}%
                        </span>
                        <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              healthScore < 40 ? "bg-rose-500" :
                              healthScore < 70 ? "bg-amber-500" :
                              "bg-emerald-500"
                            }`}
                            style={{ width: `${healthScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Right Column: Specs */}
        <div className="md:col-span-2 space-y-6 print:hidden">
          {/* Hardware Info */}
          <FadeIn delay={0.2}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Hardware Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Serial Number
                    </dt>
                    <dd className="font-mono font-medium">{asset.serial_number || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Server className="h-3 w-3" /> Hardware Type
                    </dt>
                    <dd className="font-medium capitalize">{asset.type_hardware?.replace(/_/g, " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Brand & Model
                    </dt>
                    <dd className="font-medium">{asset.brand} {asset.model}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Condition
                    </dt>
                    <dd className="font-medium capitalize">{asset.condition?.replace(/_/g, " ") || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Purchase Date
                    </dt>
                    <dd className="font-medium">{asset.purchase_date || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Warranty Expiry
                    </dt>
                    <dd className="font-medium">{asset.warranty_expiry || "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Technical Specs */}
          <FadeIn delay={0.3}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu className="h-4 w-4 text-primary" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">CPU</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{asset.cpu || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Server className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">RAM</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{asset.ram || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Storage</span>
                    </div>
                    <p className="text-sm font-semibold truncate">{asset.storage || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Network className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">IP Address</span>
                    </div>
                    <p className="text-sm font-mono truncate">{asset.ip_address || "DHCP"}</p>
                  </div>
                </div>

                {/* MAC Address */}
                {asset.mac_address && (
                  <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Network className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">MAC Address</span>
                    </div>
                    <p className="text-sm font-mono">{asset.mac_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Notes */}
          {asset.notes && (
            <FadeIn delay={0.35}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{asset.notes}</p>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
