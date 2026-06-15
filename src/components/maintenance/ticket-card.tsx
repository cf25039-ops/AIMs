"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/contexts/role-context";
import { canManageTickets } from "@/utils/role";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "./ticket-status-badge";
import { Clock, MonitorSmartphone, Loader2, Save } from "lucide-react";
import { calculateSLA } from "@/utils/sla";
import { Button } from "@/components/ui/button";

interface TicketCardProps {
  ticket: any;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { role } = useRole();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const canEditStatus = canManageTickets(role);

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      setIsUpdating(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("repair_tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);
      
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["repair-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["technician-dashboard"] });
      setIsUpdating(false);
      setIsOpen(false);
    },
    onError: (err: any) => {
      console.error("Error updating ticket status:", err);
      toast.error("Failed to update status: " + err.message);
      setIsUpdating(false);
    }
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  };

  const handleSave = () => {
    updateStatusMutation.mutate(selectedStatus);
  };

  const severityLabels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    informational: "Informational"
  };

  const statusLabels: Record<string, string> = {
    open: "Open",
    assigned: "Assigned",
    investigation: "Investigation",
    in_repair: "In Repair",
    vendor_escalation: "Vendor Escalation",
    testing: "Testing",
    resolved: "Resolved",
    closed: "Closed"
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-border/60 bg-card hover:bg-muted/10 select-none">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    TKT-{ticket.id.split("-")[0].toUpperCase()}
                  </span>
                  <TicketStatusBadge severity={ticket.severity} />
                </div>
                <h3 className="font-semibold line-clamp-1 mt-1.5 text-sm text-foreground">
                  {ticket.title || "Hardware Issue Reported"}
                </h3>
                {ticket.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {ticket.description}
                  </p>
                )}
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/20">
              <div className="flex items-center gap-1.5">
                <MonitorSmartphone className="h-3.5 w-3.5" />
                <span className="capitalize">{ticket.hardware?.type_hardware?.replace(/_/g, " ") || "Unknown Asset"}</span>
                <span>({ticket.hardware?.asset_tag})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              
              {/* SLA Countdown Badge */}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (() => {
                const sla = calculateSLA(ticket.created_at, ticket.severity);
                const colors = sla.isBreached
                  ? "text-rose-600 bg-rose-500/10 border-rose-500/20"
                  : sla.isCritical
                    ? "text-amber-600 bg-amber-500/10 border-amber-500/20 animate-pulse"
                    : "text-muted-foreground bg-muted/50 border-border/50";
                return (
                  <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-medium text-[11px] ${colors}`}>
                    <Clock className="h-3 w-3" />
                    <span>{sla.label}</span>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="glass-card max-w-lg border-border/60 p-6 sm:rounded-2xl shadow-2xl backdrop-blur-xl">
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded">
              TKT-{ticket.id.split("-")[0].toUpperCase()}
            </span>
            <TicketStatusBadge severity={ticket.severity} />
          </div>
          <DialogTitle className="text-lg font-bold mt-2 text-foreground leading-snug">
            {ticket.title || "Hardware Issue Reported"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Reported on {new Date(ticket.created_at).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4 text-sm">
          {/* Severity & Status row */}
          <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Severity</span>
              <span className="text-sm font-medium mt-1 inline-block capitalize">{severityLabels[ticket.severity] || ticket.severity}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Current Status</span>
              <div className="mt-1 inline-block">
                <TicketStatusBadge status={ticket.status} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Description</span>
            <p className="text-sm text-foreground bg-muted/40 border border-border/40 rounded-2xl p-5 leading-relaxed min-h-[100px] max-h-[300px] overflow-y-auto whitespace-pre-wrap shadow-inner">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* Associated Hardware */}
          <div className="bg-muted/20 border border-border/40 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Associated Asset</span>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
              <div>
                <span className="text-muted-foreground font-medium">Asset Tag:</span>{" "}
                <span className="font-semibold text-foreground">{ticket.hardware?.asset_tag || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Type:</span>{" "}
                <span className="font-semibold text-foreground capitalize">{ticket.hardware?.type_hardware || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Serial Number:</span>{" "}
                <span className="font-semibold text-foreground">{ticket.hardware?.serial_number || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">PIC Name:</span>{" "}
                <span className="font-semibold text-foreground">{ticket.pic_name || ticket.hardware?.pic_name || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Update Status (if permitted) */}
          {canEditStatus && (
            <div className="border-t border-border/40 pt-4 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Update Ticket Status</span>
              <div className="flex gap-3">
                <select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  className="flex-1 rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none"
                >
                  {Object.entries(statusLabels).map(([val, label]) => (
                    <option key={val} value={val} className="bg-card text-foreground">
                      {label}
                    </option>
                  ))}
                </select>
                <Button onClick={handleSave} disabled={isUpdating || selectedStatus === ticket.status} className="gap-2 shrink-0 rounded-xl">
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border/40 pt-4 mt-2">
          <Button variant="secondary" onClick={() => setIsOpen(false)} className="rounded-xl">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
