"use client";

import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/animations/fade-in";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getIntelligenceData } from "@/services/intelligence";
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Cpu,
  Server,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function IntelligencePage() {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["ai-intelligence"],
    queryFn: getIntelligenceData,
  });

  const criticalAssets = insights.filter((i: any) => i.healthClass === "critical");
  const degradedAssets = insights.filter((i: any) => i.healthClass === "degraded");
  const healthyAssets = insights.filter((i: any) => i.healthClass === "healthy");

  const getHealthColor = (score: number) => {
    if (score < 40) return "text-rose-500";
    if (score < 70) return "text-amber-500";
    return "text-emerald-500";
  };

  const getHealthBg = (score: number) => {
    if (score < 40) return "bg-rose-500";
    if (score < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">AI & Intelligence Layer</h2>
            <p className="text-sm text-muted-foreground">
              Automated health scoring and predictive maintenance recommendations
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Condition</CardTitle>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {criticalAssets.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">assets</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Degraded Performance</CardTitle>
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {degradedAssets.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">assets</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimal Condition</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {healthyAssets.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">assets</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Predictive Analysis Results</CardTitle>
            <CardDescription>
              Algorithms analyze asset age, failure frequency, and current status to generate health
              scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : insights.length === 0 ? (
              <EmptyState
                icon={BrainCircuit}
                title="No hardware data available"
                description="Add hardware assets to enable AI health scoring and analysis"
              />
            ) : (
              <div className="space-y-4">
                {insights.map((asset: any) => (
                  <div
                    key={asset.id}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-6 md:items-center"
                  >
                    {/* Identity */}
                    <div className="md:w-1/4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {asset.type?.includes("server") ? (
                          <Server className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Cpu className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{asset.asset_tag}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {asset.type?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    {/* Scoring Bar */}
                    <div className="md:w-1/3 flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          Health Score
                        </span>
                        <span className={`font-bold ${getHealthColor(asset.score)}`}>
                          {asset.score}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getHealthBg(asset.score)} transition-all duration-1000 ease-out`}
                          style={{ width: `${asset.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {asset.ticketsCount} Historical Tickets
                        </span>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="md:flex-1 p-3 rounded-md bg-muted/40 border border-muted/60">
                      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                        <BrainCircuit className="h-3 w-3 text-primary" />
                        AI Recommendation
                      </p>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {asset.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
