"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/role-context";
import { getGreeting } from "@/utils/role";
import { createClient } from "@/lib/supabase/client";
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  ListChecks,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export function TechnicianDashboard() {
  const { profile } = useRole();

  const { data, isLoading } = useQuery({
    queryKey: ["technician-dashboard"],
    queryFn: async () => {
      const supabase = createClient();

      // Get all tickets (technician sees assigned/available tickets)
      const { data: tickets } = await supabase
        .from("repair_tickets")
        .select("id, status, severity, title, description, created_at, hardware(asset_tag, type_hardware)")
        .not("status", "in", '("resolved","closed")')
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: resolvedToday } = await supabase
        .from("repair_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("created_at", new Date().toISOString().split("T")[0]);

      return {
        activeTickets: tickets || [],
        resolvedTodayCount: resolvedToday?.length || 0,
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

  const criticalTickets = data?.activeTickets.filter((t: any) => t.severity === "critical") || [];
  const otherTickets = data?.activeTickets.filter((t: any) => t.severity !== "critical") || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-rose-500";
      case "high": return "bg-amber-500";
      case "medium": return "bg-yellow-500";
      default: return "bg-emerald-500";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs mb-2">
              Technician Console
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              {getGreeting()}, {profile?.full_name?.split(" ")[0] || "Tech"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {data?.activeTickets.length || 0} active tickets in your queue
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/assets">
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                QR Scan
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <FadeIn delay={0.05}>
        <div className="grid gap-4 grid-cols-3">
          <Card className="glass-card border-l-4 border-l-rose-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <div>
                <p className="text-2xl font-bold">{criticalTickets.length}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{data?.activeTickets.length || 0}</p>
                <p className="text-xs text-muted-foreground">In Queue</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{data?.resolvedTodayCount || 0}</p>
                <p className="text-xs text-muted-foreground">Resolved Today</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Critical Tickets */}
      {criticalTickets.length > 0 && (
        <FadeIn delay={0.1}>
          <Card className="glass-card border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Critical — Immediate Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {criticalTickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {ticket.title || "Critical Issue"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.hardware?.asset_tag} · {ticket.hardware?.type_hardware}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" className="shrink-0 gap-1">
                    Action <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Repair Queue */}
      <FadeIn delay={0.15}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Repair Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {otherTickets.length > 0 ? (
              <div className="space-y-2">
                {otherTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${getSeverityColor(ticket.severity)}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ticket.title || "Issue Reported"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.hardware?.asset_tag || "Unknown"} ·{" "}
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={ticket.severity === "high" ? ("warning" as any) : ("default" as any)}
                        className="text-[10px] uppercase"
                      >
                        {ticket.severity}
                      </Badge>
                      <Badge variant={"default" as any} className="text-[10px] uppercase">
                        {ticket.status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                Queue is clear — no pending repairs!
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
