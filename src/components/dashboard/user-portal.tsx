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
  Boxes,
  Wrench,
  Ticket,
  Eye,
  Bell,
  CheckCircle2,
  Clock,
  Monitor,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export function UserPortal() {
  const { profile, isLoading: roleLoading } = useRole();

  const { data, isLoading } = useQuery({
    queryKey: ["user-portal"],
    queryFn: async () => {
      const supabase = createClient();

      // Get assets in user's department
      const deptId = profile?.assigned_department_id;

      let assets: any[] = [];
      if (deptId) {
        const { data: hw } = await supabase
          .from("hardware")
          .select("id, asset_tag, serial_number, type_hardware, brand, model, status, health_score")
          .eq("department_id", deptId)
          .order("created_at", { ascending: false })
          .limit(6);
        assets = hw || [];
      } else {
        // Fallback: get all assets the user can see (RLS will filter)
        const { data: hw } = await supabase
          .from("hardware")
          .select("id, asset_tag, serial_number, type_hardware, brand, model, status, health_score")
          .order("created_at", { ascending: false })
          .limit(6);
        assets = hw || [];
      }

      // Get user's notifications
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let notifications: any[] = [];
      if (user) {
        const { data: notifs } = await supabase
          .from("notifications")
          .select("id, title, body, read_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        notifications = notifs || [];
      }

      return { assets, notifications };
    },
    enabled: !!profile,
  });

  const loading = roleLoading || isLoading || !data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "in_repair":
        return "warning" as const;
      case "disposed":
      case "retired":
        return "danger" as const;
      default:
        return "default" as const;
    }
  };

  const getTypeIcon = (_type: string) => {
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Header */}
      <FadeIn>
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-8">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs mb-3">
            Asset Portal
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {profile?.full_name?.split(" ")[0] || "User"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {profile?.assigned_department?.name
              ? `${profile.assigned_department.name}${
                  profile.assigned_department.facility?.name
                    ? ` — ${profile.assigned_department.facility.name}`
                    : ""
                }`
              : "Your personal asset dashboard"}
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Boxes className="h-4 w-4" />
              <span>{data?.assets.length || 0} assigned assets</span>
            </div>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              <span>{data?.notifications.filter((n: any) => !n.read_at).length || 0} unread</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.05}>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Link href="/maintenance">
            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-5 rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <AlertCircle className="h-6 w-6 text-rose-500" />
              <span className="text-xs font-semibold">Report Issue</span>
            </Button>
          </Link>
          <Link href="/maintenance">
            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-5 rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <Wrench className="h-6 w-6 text-amber-500" />
              <span className="text-xs font-semibold">Request Maintenance</span>
            </Button>
          </Link>
          <Link href="/assets">
            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-5 rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <Eye className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-semibold">View Assets</span>
            </Button>
          </Link>
          <Link href="/maintenance">
            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-2 py-5 rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <Ticket className="h-6 w-6 text-violet-500" />
              <span className="text-xs font-semibold">Track Ticket</span>
            </Button>
          </Link>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* My Assets */}
        <div className="lg:col-span-3">
          <FadeIn delay={0.1}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Boxes className="h-5 w-5 text-primary" />
                  My Assigned Hardware
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : data.assets.length > 0 ? (
                  <div className="space-y-3">
                    {data.assets.map((asset: any) => (
                      <Link key={asset.id} href={`/assets/${asset.id}`}>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              {getTypeIcon(asset.type_hardware)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {asset.brand} {asset.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {asset.asset_tag} · {asset.serial_number}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={getStatusColor(asset.status)}
                            className="text-[10px] uppercase"
                          >
                            {asset.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Boxes className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    No assets assigned to your department yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2">
          <FadeIn delay={0.15}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : data.notifications.length > 0 ? (
                  <div className="space-y-3">
                    {data.notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`rounded-lg border p-3 text-sm ${
                          !n.read_at ? "bg-primary/5 border-primary/20" : "border-border/60"
                        }`}
                      >
                        <p className="font-medium text-foreground text-xs">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    You&apos;re all caught up!
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
