"use client";


import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type MetricCardProps = {
  title: string;
  value: string;
  delta?: string;
  tone?: "success" | "warning" | "danger" | "info";
  caption?: string;
};

export function MetricCard({ title, value, delta, tone = "info", caption }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {value}
            </motion.span>
            {delta && (
              <Badge
                variant={tone}
                className="h-5 px-1.5 text-[10px] uppercase font-semibold tracking-wider"
              >
                {delta}
              </Badge>
            )}
          </div>
        </div>

        {caption && (
          <div className="flex flex-col items-end justify-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
              {caption}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
