"use client";

import { Badge } from "@/components/ui/badge";
import type { ActivityItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="relative space-y-0 pl-2">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border/50" />

      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="group relative flex items-start gap-4 py-4"
          >
            <div
              className={cn(
                "relative z-10 flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-background",
                index === 0 ? "border-primary text-primary" : "border-border text-muted-foreground",
              )}
            >
              {index === 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40"></span>
              )}
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  index === 0 ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:justify-between sm:items-start">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {item.time}
                </div>
                <Badge variant={item.tone} className="shadow-sm">
                  {item.tone}
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
