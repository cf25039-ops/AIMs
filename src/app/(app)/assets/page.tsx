"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { DrillDownView } from "@/components/assets/drill-down-view";
import { getAccessibleContracts } from "@/services/hierarchy";

export default function AssetsPage() {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["accessible-contracts"],
    queryFn: getAccessibleContracts,
  });

  if (isLoading) {
    return (
      <FadeIn className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm">Loading assets...</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="space-y-6">
      <DrillDownView contracts={contracts} />
    </FadeIn>
  );
}
