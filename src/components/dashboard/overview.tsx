"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { FadeIn } from "@/components/animations/fade-in";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardMetrics, getRecentActivities } from "@/services/dashboard";

export function DashboardOverview() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_tickets' }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  const { data: metrics = [] } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: getDashboardMetrics,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: getRecentActivities,
  });

  // Fetch real alert data
  const { data: alertData } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const supabase = createClient();

      // SLA breaches (tickets open too long)
      const { data: slaBreaches } = await supabase
        .from("repair_tickets")
        .select("id, title, severity, created_at, hardware:hardware_id(asset_tag)")
        .not("status", "in", "(resolved,closed)")
        .order("created_at", { ascending: true })
        .limit(2);

      // Warranty expiring soon (within 30 days)
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      const { data: warrantyAlerts } = await supabase
        .from("hardware")
        .select("id, brand, model, asset_tag, warranty_expiry")
        .lte("warranty_expiry", thirtyDays.toISOString().split("T")[0])
        .gte("warranty_expiry", new Date().toISOString().split("T")[0])
        .limit(5);

      // Pending purchase requests
      const { data: pendingRequests } = await supabase
        .from("purchase_requests")
        .select("id, item_name, quantity, created_at")
        .eq("status", "pending")
        .limit(5);

      return { slaBreaches, warrantyAlerts, pendingRequests };
    },
  });

  return (
    <div className="flex flex-col gap-8">
      {/* HERO COMMAND CENTER */}
      <FadeIn className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
        {/* Background glow effect */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 shadow-inner">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  System Operational
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Live Sync Active
              </span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Good Morning.
              </h2>
              <p className="max-w-xl text-base text-muted-foreground">
                All systems running across <strong className="text-foreground">24 active contracts</strong>. 
                There are currently <strong className="text-destructive">2 critical alerts</strong> requiring attention today.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/maintenance/create">
              <Button className="group relative overflow-hidden bg-foreground text-background transition-all hover:bg-foreground/90 hover:shadow-lg hover:-translate-y-0.5">
                <span className="relative z-10 flex items-center gap-2">
                  Create Ticket
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Button>
            </Link>
            <Link href="/assets/add">
              <Button variant="outline" className="group border-border/60 bg-background/50 backdrop-blur-md transition-all hover:bg-accent/10 hover:text-accent hover:border-accent/30">
                Add Asset
              </Button>
            </Link>
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ShieldCheck className="h-4 w-4" />
              Compliance
            </Button>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.length > 0 ? metrics.map((metric, index) => (
          <FadeIn key={metric.title} delay={0.1 + index * 0.05}>
            <MetricCard {...metric} />
          </FadeIn>
        )) : (
          <div className="col-span-4 flex h-32 items-center justify-center text-sm text-muted-foreground">
            Loading metrics...
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <FadeIn delay={0.2}>
          <Card className="glass-card">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg">Realtime Activity</CardTitle>
              <Button variant="ghost" className="gap-2 text-xs">
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <ActivityFeed items={activities} />
              ) : (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card className="relative overflow-hidden border-border/60 shadow-sm bg-card">
            {/* Urgent glow background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-warning to-destructive" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 blur-3xl rounded-full" />
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                  </div>
                  Critical Alerts
                </CardTitle>
                <Badge variant="danger" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0">
                  {(alertData?.slaBreaches?.length || 0) + (alertData?.warrantyAlerts?.length || 0)} Requires Action
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-3">
              {/* SLA Breach Alerts */}
              {alertData?.slaBreaches?.map((ticket: any) => {
                const hoursOpen = Math.round((Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60));
                return (
                  <div key={ticket.id} className="group relative overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-destructive">Open Ticket: {ticket.title}</p>
                      <span className="text-[10px] font-medium text-destructive/70 uppercase">{hoursOpen}h ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Severity: {ticket.severity} · Asset: {ticket.hardware?.asset_tag || "Unknown"}</p>
                  </div>
                );
              })}

              {/* Warranty Expiring Alerts */}
              {alertData?.warrantyAlerts?.map((hw: any) => {
                const daysLeft = Math.ceil((new Date(hw.warranty_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={hw.id} className="group relative overflow-hidden rounded-xl border border-warning/20 bg-warning/5 p-4 transition-colors hover:bg-warning/10">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-warning">Warranty Expiring: {hw.brand} {hw.model}</p>
                      <span className="text-[10px] font-medium text-warning/70 uppercase">{daysLeft} days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Asset: {hw.asset_tag} · Expires: {new Date(hw.warranty_expiry).toLocaleDateString()}</p>
                  </div>
                );
              })}

              {/* Pending Purchase Requests */}
              {alertData?.pendingRequests && alertData.pendingRequests.length > 0 && (
                <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-foreground">Pending Purchase Requests</p>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">{alertData.pendingRequests.length} requests</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alertData.pendingRequests.length} purchase requests awaiting approval.</p>
                </div>
              )}

              {/* Empty state if no alerts */}
              {(!alertData?.slaBreaches?.length && !alertData?.warrantyAlerts?.length && !alertData?.pendingRequests?.length) && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No critical alerts at this time
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <AnalyticsCharts />
    </div>
  );
}
