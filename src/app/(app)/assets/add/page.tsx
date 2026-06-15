"use client";

import { AddHardwareWizard } from "@/components/assets/add-hardware-wizard";
import { AccessDenied } from "@/components/auth/access-denied";
import { useRole } from "@/contexts/role-context";
import { canManageAssets } from "@/utils/role";
import { Loader2 } from "lucide-react";

export default function AddHardwarePage() {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canManageAssets(role)) {
    return (
      <AccessDenied
        title="Asset Registration Restricted"
        description="Only admin-level users can register new hardware assets."
        href="/assets"
        actionLabel="Back to Assets"
      />
    );
  }

  return <AddHardwareWizard />;
}
