"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/role-context";
import { canManageTickets } from "@/utils/role";
import { calculateSLA } from "@/utils/sla";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { TicketStatusBadge } from "@/components/maintenance/ticket-status-badge";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusOptions = [
  "open",
  "assigned",
  "investigation",
  "in_repair",
  "vendor_escalation",
  "testing",
  "resolved",
  "closed",
];

export default function TicketDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { role } = useRole();
  const canManage = canManageTickets(role);
  const ticketId = params.id as string;

  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket-detail", ticketId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("repair_tickets")
        .select(
          `
          *,
          hardware:hardware_id(id, asset_tag, brand, model, type_hardware),
          assigned_user:assigned_to(id, full_name, email),
          logs:repair_logs(*, created_by:profiles(full_name)),
          attachments:repair_attachments(*)
        `,
        )
        .eq("id", ticketId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("repair_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-detail", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["repair-tickets"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("repair_logs")
        .insert({ ticket_id: ticketId, note, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-detail", ticketId] });
      setNewNote("");
      setIsAddingNote(false);
      toast.success("Note added");
    },
    onError: (err: any) => toast.error("Failed: " + err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Ticket not found</p>
        <Link href="/maintenance">
          <Button variant="outline">Back to Maintenance</Button>
        </Link>
      </div>
    );
  }

  const sla =
    ticket.status !== "resolved" && ticket.status !== "closed"
      ? calculateSLA(ticket.created_at, ticket.severity)
      : null;

  const logs = (ticket.logs || []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn>
        <div className="flex items-center gap-4 mb-2">
          <Link href="/maintenance">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="glass-card">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded">
                TKT-{ticket.id.split("-")[0].toUpperCase()}
              </span>
              <TicketStatusBadge severity={ticket.severity} />
              <TicketStatusBadge status={ticket.status} />
              {sla && (
                <span
                  className={cn(
                    "ml-auto text-xs font-medium px-2 py-0.5 rounded-md border",
                    sla.isBreached
                      ? "text-rose-600 bg-rose-500/10 border-rose-500/20"
                      : sla.isCritical
                        ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
                        : "text-muted-foreground bg-muted/50 border-border/50",
                  )}
                >
                  <Clock className="inline h-3 w-3 mr-1" />
                  {sla.label}
                </span>
              )}
            </div>
            <CardTitle className="text-xl mt-2">{ticket.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {ticket.description || "No description provided."}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Asset
                </span>
                <Link
                  href={`/assets/${ticket.hardware?.id}`}
                  className="text-foreground hover:text-primary font-medium"
                >
                  {ticket.hardware?.brand} {ticket.hardware?.model}
                </Link>
                <p className="text-xs text-muted-foreground">{ticket.hardware?.asset_tag}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Reported
                </span>
                <span className="text-foreground">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Assigned To
                </span>
                <span className="text-foreground">
                  {ticket.assigned_user?.full_name || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                  Severity
                </span>
                <span className="text-foreground capitalize">{ticket.severity}</span>
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <span className="text-xs font-semibold text-muted-foreground">Change Status:</span>
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  disabled={updateStatusMutation.isPending}
                  className="h-8 rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-primary/50"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <FadeIn delay={0.1}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManage && !isAddingNote && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingNote(true)}
                    className="gap-1.5 w-full"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Note
                  </Button>
                )}

                {isAddingNote && (
                  <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note..."
                      className="w-full h-20 rounded-lg border border-border bg-card p-2 text-sm outline-none focus:border-primary/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addNoteMutation.mutate(newNote)}
                        disabled={!newNote || addNoteMutation.isPending}
                        className="gap-1 text-xs"
                      >
                        {addNoteMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        Save Note
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingNote(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {logs.length === 0 && !isAddingNote ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                ) : (
                  logs.map((log: any) => (
                    <div key={log.id} className="flex gap-3 border-l-2 border-primary/20 pl-4 py-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {log.created_by?.full_name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{log.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        <div className="space-y-4">
          <FadeIn delay={0.15}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.attachments?.length > 0 ? (
                  <div className="space-y-2">
                    {ticket.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline truncate"
                      >
                        {att.url.split("/").pop()}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
