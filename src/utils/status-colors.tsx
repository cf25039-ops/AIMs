import { cn } from "@/lib/utils";

type StatusType = "active" | "pending" | "warning" | "danger" | "info" | "inactive";

const statusColors: Record<StatusType, { bg: string; text: string; border: string; dot: string }> =
  {
    active: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    pending: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
      dot: "bg-amber-500 animate-pulse",
    },
    warning: {
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/20",
      dot: "bg-orange-500",
    },
    danger: {
      bg: "bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/20",
      dot: "bg-rose-500 animate-pulse",
    },
    info: {
      bg: "bg-sky-500/10",
      text: "text-sky-600 dark:text-sky-400",
      border: "border-sky-500/20",
      dot: "bg-sky-500",
    },
    inactive: {
      bg: "bg-slate-500/10",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-500/20",
      dot: "bg-slate-400",
    },
  };

export function getStatusColor(status: StatusType) {
  return statusColors[status] || statusColors.inactive;
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusType;
  label: string;
  className?: string;
}) {
  const colors = getStatusColor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border backdrop-blur-sm select-none shadow-sm",
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {label}
    </span>
  );
}

export function getHardwareStatusColor(status: string): StatusType {
  switch (status) {
    case "active":
      return "active";
    case "in_repair":
      return "pending";
    case "standby":
      return "info";
    case "retired":
    case "disposed":
      return "inactive";
    case "lost":
      return "danger";
    default:
      return "info";
  }
}

export function getTicketStatusColor(status: string): StatusType {
  switch (status) {
    case "open":
      return "info";
    case "assigned":
    case "investigation":
      return "pending";
    case "in_repair":
      return "warning";
    case "vendor_escalation":
      return "danger";
    case "testing":
      return "info";
    case "resolved":
    case "closed":
      return "active";
    default:
      return "info";
  }
}

export function getSeverityColor(severity: string): StatusType {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "pending";
    case "low":
      return "info";
    default:
      return "info";
  }
}
