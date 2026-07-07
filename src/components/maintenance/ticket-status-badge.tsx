import { cn } from "@/lib/utils";

type Status =
  | "open"
  | "triaged"
  | "assigned"
  | "investigation"
  | "in_repair"
  | "vendor_escalation"
  | "testing"
  | "resolved"
  | "closed";
type Severity = "critical" | "high" | "medium" | "low" | "informational";

interface TicketStatusBadgeProps {
  status?: Status;
  severity?: Severity;
  className?: string;
}

const statusConfig: Record<Status, { label: string; classes: string }> = {
  open: {
    label: "Open",
    classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  triaged: {
    label: "Triaged",
    classes: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  assigned: {
    label: "Assigned",
    classes: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  investigation: {
    label: "Investigation",
    classes: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  in_repair: {
    label: "In Repair",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  vendor_escalation: {
    label: "Vendor Escalation",
    classes: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  testing: {
    label: "Testing",
    classes: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
  resolved: {
    label: "Resolved",
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  closed: { label: "Closed", classes: "bg-muted text-muted-foreground border-border" },
};

const severityConfig: Record<Severity, { label: string; classes: string }> = {
  critical: {
    label: "Critical",
    classes: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  high: {
    label: "High",
    classes: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  medium: {
    label: "Medium",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low",
    classes: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  informational: { label: "Info", classes: "bg-muted text-muted-foreground border-border" },
};

export function TicketStatusBadge({ status, severity, className }: TicketStatusBadgeProps) {
  if (status) {
    const config = statusConfig[status] || statusConfig.open;
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          config.classes,
          className,
        )}
      >
        {config.label}
      </span>
    );
  }

  if (severity) {
    const config = severityConfig[severity] || severityConfig.low;
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          config.classes,
          className,
        )}
      >
        {config.label}
      </span>
    );
  }

  return null;
}
