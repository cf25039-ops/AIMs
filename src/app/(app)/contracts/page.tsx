"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContracts, getDashboardStats } from "@/services/contracts";
import { Building2, Briefcase, AlertCircle, DollarSign, FileText, Loader2, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function ContractsPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["contracts-stats"],
    queryFn: getDashboardStats,
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts-list"],
    queryFn: getContracts,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
  };

  // Determine status badge
  const getStatusBadge = (endDate: string) => {
    if (!endDate) return <Badge variant={"secondary" as any}>Unknown</Badge>;
    const today = new Date();
    const end = new Date(endDate);
    
    if (end < today) {
      return <Badge variant={"destructive" as any}>Expired</Badge>;
    }
    
    const diffTime = Math.abs(end.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays <= 30) {
      return <Badge variant={"warning" as any}>Expiring Soon</Badge>;
    }
    
    return <Badge variant={"success" as any}>Active</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Project & Contract Management</h2>
              <p className="text-sm text-muted-foreground">Manage service agreements and vendor SLA tracking</p>
            </div>
          </div>
          <Link href="/contracts/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Contract Number
            </Button>
          </Link>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <div className="text-2xl font-bold">{stats?.projectCount}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <div className="text-2xl font-bold">{stats?.vendorCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <div className="text-2xl font-bold text-primary">{formatCurrency(stats?.totalValue || 0)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-rose-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon (30 Days)</CardTitle>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              {loadingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.expiringSoon}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Contracts Table */}
      <FadeIn delay={0.2}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Master Contracts List</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingContracts ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : contracts.length === 0 ? (
              <EmptyState
  icon={FileText}
  title="No contracts found"
  description="Add your first contract to start tracking vendor agreements"
/>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Contract No.</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Value (RM)</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.contract_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{c.project?.name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">{c.project?.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>{c.vendor?.name || "Unassigned"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs text-muted-foreground">
                            <span>Start: {c.start_date || "-"}</span>
                            <span>End: {c.end_date || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {c.value ? formatCurrency(c.value) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {getStatusBadge(c.end_date)}
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
