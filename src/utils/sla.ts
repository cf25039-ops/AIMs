export type SLAResult = {
  hoursLeft: number;
  minutesLeft: number;
  totalHours: number;
  isBreached: boolean;
  isCritical: boolean;
  label: string;
};

const DEFAULT_HOURS: Record<string, number> = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 48,
  informational: 72,
};

export function calculateSLA(
  openedAt: string,
  severity: string,
  slaHours?: number
): SLAResult {
  const opened = new Date(openedAt);
  const now = new Date();
  const totalHours = slaHours || DEFAULT_HOURS[severity] || 24;
  const deadline = new Date(opened.getTime() + totalHours * 60 * 60 * 1000);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const hoursLeft = Math.floor(Math.max(0, diffHours));
  const minutesLeft = Math.floor(Math.max(0, (diffHours - hoursLeft) * 60));
  const isBreached = diffMs <= 0;
  const isCritical = hoursLeft <= 2 && !isBreached;

  let label = "";
  if (isBreached) {
    label = `Breached ${Math.abs(hoursLeft)}h ago`;
  } else if (hoursLeft === 0) {
    label = `${minutesLeft}m left`;
  } else if (hoursLeft >= 24) {
    label = `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h left`;
  } else {
    label = `${hoursLeft}h ${minutesLeft}m left`;
  }

  return { hoursLeft, minutesLeft, totalHours, isBreached, isCritical, label };
}