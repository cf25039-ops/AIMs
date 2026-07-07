"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/contexts/role-context";
import { createClient } from "@/lib/supabase/client";
import {
  Boxes,
  FileText,
  Wrench,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export function ProjectAdminDashboard() {
  const {} = useRole();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["project-admin-stats"],
    queryFn: async () => {
      const supabase = createClient();

      // Get user's project memberships
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: memberships } = await supabase
        .from("project_members")
        .select("project_id, projects(name, code)")
        .eq("user_id", user.id);

      const projectIds = memberships?.map((m: any) => m.project_id) || [];
      const projectName = (memberships?.[0]?.projects as any)?.name || "My Project";

      // Asset count
      const { count: assetCount } = await supabase
        .from("hardware")
        .select("*", { count: "exact", head: true });

      // Active tickets
      const { count: ticketCount } = await supabase
        .from("repair_tickets")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("resolved","closed")');

      // Contracts
      const { count: contractCount } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .in(
          "project_id",
          projectIds.length > 0 ? projectIds : ["00000000-0000-0000-0000-000000000000"],
        );

      // Recent activity
      const { data: recentTickets } = await supabase
        .from("repair_tickets")
        .select("id, status, severity, title, description, created_at, hardware(asset_tag)")
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        projectName,
        assetCount: assetCount || 0,
        ticketCount: ticketCount || 0,
        contractCount: contractCount || 0,
        recentTickets: recentTickets || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <FadeIn className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
            Project Scope
          </Badge>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">{stats?.projectName}</h2>
        <p className="text-sm text-muted-foreground">
          Project-scoped management overview — assets, tickets, and SLA compliance
        </p>
      </FadeIn>

      {/* KPI Strip */}
      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.assetCount}</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.ticketCount}</p>
                <p className="text-xs text-muted-foreground">Active Tickets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.contractCount}</p>
                <p className="text-xs text-muted-foreground">Contracts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground">SLA Compliance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Recent Tickets */}
      <FadeIn delay={0.2}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Recent Tickets
            </CardTitle>
            <CardDescription>Latest support tickets in your project scope</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentTickets && stats.recentTickets.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          ticket.severity === "critical"
                            ? "bg-rose-500"
                            : ticket.severity === "high"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs">
                          {ticket.title || "Issue Reported"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.hardware?.asset_tag || "Unknown"} ·{" "}
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        ticket.status === "resolved"
                          ? ("success" as any)
                          : ticket.status === "open"
                            ? ("danger" as any)
                            : ("warning" as any)
                      }
                      className="text-[10px] uppercase"
                    >
                      {ticket.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                No recent tickets — everything looks good!
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
