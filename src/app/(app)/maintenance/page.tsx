"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketCard } from "@/components/maintenance/ticket-card";
import { getTickets } from "@/services/maintenance";
import { useRole } from "@/contexts/role-context";
import { canCreateTickets } from "@/utils/role";
import { Plus, Wrench } from "lucide-react";

export default function MaintenancePage() {
  const { role } = useRole();
  const canReportIssue = canCreateTickets(role);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["repair-tickets"],
    queryFn: getTickets,
  });

  return (
    <div className="space-y-6">
      <FadeIn className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Service operations
          </p>
          <h2 className="text-3xl font-semibold">Maintenance Board</h2>
          <p className="text-sm text-muted-foreground">
            Manage repair tickets, vendor escalations, and SLA compliance.
          </p>
        </div>
        {canReportIssue && (
          <Link href="/maintenance/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Report Issue
            </Button>
          </Link>
        )}
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="glass-card col-span-full lg:col-span-2">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Active Repair Tickets
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col p-4 gap-3">
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    Loading tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Wrench className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-lg">No active tickets</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                      All systems are operational. New issues will appear here once reported by an
                      authorized user.
                    </p>
                    {canReportIssue && (
                      <Link href="/maintenance/create">
                        <Button variant="outline">Report New Issue</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  tickets.map((ticket: any) => <TicketCard key={ticket.id} ticket={ticket} />)
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="panel-grid">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  SLA Breaches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">0</div>
                <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
              </CardContent>
            </Card>

            <Card className="panel-grid">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Escalation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">0</div>
                <p className="text-xs text-muted-foreground mt-1">Waiting on vendor response</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
