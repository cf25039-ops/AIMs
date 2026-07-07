"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DrillCardProps = {
  label: string;
  count: number;
  icon?: LucideIcon;
  onClick: () => void;
  className?: string;
};

export function DrillCard({ label, count, icon: Icon, onClick, className }: DrillCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-5",
        "backdrop-blur-md transition-all duration-200",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        "text-left",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary/10 transition-colors">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary border border-primary/10">
          {count}
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{label}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {count === 0 ? "No assets" : count === 1 ? "1 asset" : `${count} assets`}
        </p>
      </div>

      <div className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-primary/60 transition-all duration-300 group-hover:w-12" />
    </motion.button>
  );
}
