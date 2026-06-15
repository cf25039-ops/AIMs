"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditTable } from "@/components/audit/audit-table";
import { getSystemAuditLogs, getActivityLogs } from "@/services/audit";
import { Shield, ShieldAlert, Activity } from "lucide-react";

export default function AuditPage() {
  const { data: auditData, isLoading: loadingAudit, error: auditError } = useQuery({
    queryKey: ["audit-logs", "system"],
    queryFn: getSystemAuditLogs,
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ["audit-logs", "activity"],
    queryFn: getActivityLogs,
  });

  if (auditData?.error || auditError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Access Denied</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          {auditData?.error || "You do not have the required administrative permissions to view the immutable audit trail."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Security & Compliance</h2>
            <p className="text-sm text-muted-foreground">Immutable audit trail and system activity logs</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="system" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              System Audit
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity Logs
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="system" className="m-0 focus-visible:outline-none">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>System Audit Trail</CardTitle>
                  <CardDescription>
                    Low-level database triggers that capture all INSERT, UPDATE, and DELETE operations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAudit ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Loading audit trail...</div>
                  ) : (
                    <AuditTable logs={auditData?.data || []} type="system" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="m-0 focus-visible:outline-none">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>User Activity Logs</CardTitle>
                  <CardDescription>
                    High-level application events such as logins, exports, and permission changes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingActivity ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Loading activity logs...</div>
                  ) : (
                    <AuditTable logs={activityData?.data || []} type="activity" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </FadeIn>
    </div>
  );
}
