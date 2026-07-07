"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getVendors, getVendorStats } from "@/services/vendors";
import { Building2, Users, Store, Loader2, Phone, Mail } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function VendorsPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["vendors-stats"],
    queryFn: getVendorStats,
  });

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: getVendors,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Vendor Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage suppliers, contractors, and service providers
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalVendors}</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Building2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold text-emerald-600">{stats?.activeVendors}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Vendors Table */}
      <FadeIn delay={0.2}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Vendor Directory</CardTitle>
            <CardDescription>Comprehensive list of all enterprise partners</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVendors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : vendors.length === 0 ? (
              <EmptyState
                icon={Store}
                title="No vendors found"
                description="Add your first vendor to start managing supplier relationships"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Project Binding</TableHead>
                      <TableHead className="text-center">Contracts Bound</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {v.email || "-"}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {v.phone || "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{v.project?.name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">{v.project?.code}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {v.contracts?.[0]?.count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              v.status === "active" ? ("success" as any) : ("secondary" as any)
                            }
                            className="uppercase text-[10px]"
                          >
                            {v.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
