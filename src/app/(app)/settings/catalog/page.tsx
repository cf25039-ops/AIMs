"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Monitor, SlidersHorizontal, Layers } from "lucide-react";
import { getAccessibleContracts } from "@/services/hierarchy";
import { HardwareTypeManager } from "@/components/settings/hardware-type-manager";
import { SpecCategoryManager } from "@/components/settings/spec-category-manager";

export default function CatalogManagementPage() {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ["accessible-contracts"],
    queryFn: getAccessibleContracts,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Hardware Catalog</h2>
            <p className="text-sm text-muted-foreground">Manage hardware types, spec categories and classification rules</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Contract
            </CardTitle>
            <CardDescription>
              Select which contract you want to manage. Admin-scoped users will only see their assigned contract.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {contracts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContractId(c.id)}
                  className={`h-10 px-4 rounded-xl text-sm font-medium transition-all border ${
                    selectedContractId === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card/60 border-border/60 hover:border-primary/40 text-foreground hover:bg-card"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              {contracts.length === 0 && (
                <p className="text-sm text-muted-foreground">No contracts accessible.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {selectedContractId && (
        <>
          <FadeIn delay={0.2}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-sky-500" />
                  Hardware Types
                </CardTitle>
                <CardDescription>Define the types of hardware available (e.g. Laptop, PC, Printer, Server, Projector)</CardDescription>
              </CardHeader>
              <CardContent>
                <HardwareTypeManager contractId={selectedContractId} />
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.3}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-amber-500" />
                  Spec Categories
                </CardTitle>
                <CardDescription>
                  Create spec categories (e.g. Low Spec, High Spec) per hardware type and define auto-classification rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpecCategoryManager contractId={selectedContractId} />
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}
    </div>
  );
}