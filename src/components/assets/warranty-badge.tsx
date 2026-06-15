import { Badge } from "@/components/ui/badge";
import { getWarrantyStatus } from "@/utils/warranty";

export function WarrantyBadge({ warrantyExpiry }: { warrantyExpiry?: string }) {
  const status = getWarrantyStatus(warrantyExpiry);

  return <Badge variant={status.tone}>{status.label}</Badge>;
}
