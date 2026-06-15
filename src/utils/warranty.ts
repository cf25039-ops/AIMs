import { differenceInCalendarDays } from "date-fns";

export type WarrantyStatus = {
  label: string;
  tone: "success" | "warning" | "danger" | "info";
  days: number;
};

export function getWarrantyStatus(warrantyDate?: string): WarrantyStatus {
  if (!warrantyDate) {
    return { label: "No warranty", tone: "info", days: 0 };
  }

  const days = differenceInCalendarDays(new Date(warrantyDate), new Date());

  if (Number.isNaN(days)) {
    return { label: "Unknown", tone: "info", days: 0 };
  }

  if (days <= 0) {
    return { label: "Expired", tone: "danger", days };
  }

  if (days <= 30) {
    return { label: "Expiring 30d", tone: "danger", days };
  }

  if (days <= 60) {
    return { label: "Expiring 60d", tone: "warning", days };
  }

  if (days <= 90) {
    return { label: "Expiring 90d", tone: "warning", days };
  }

  return { label: "Active", tone: "success", days };
}
