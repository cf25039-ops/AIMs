"use client";

import { ChevronRight, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type BreadcrumbStep = {
  label: string;
  onClick?: () => void;
};

type DrillBreadcrumbProps = {
  steps: BreadcrumbStep[];
  className?: string;
};

export function DrillBreadcrumb({ steps, className }: DrillBreadcrumbProps) {
  return (
    <nav className={cn("flex items-center gap-1.5 overflow-x-auto whitespace-nowrap py-2 px-1 scrollbar-none", className)}>
      <AnimatePresence initial={false}>
        {steps.map((step, index) => {
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isClickable = !!step.onClick && !isLast;

          return (
            <motion.span
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
              className="flex items-center gap-1.5"
            >
              {isFirst ? (
                <Home
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isClickable ? "text-muted-foreground hover:text-primary cursor-pointer" : "text-primary/60"
                  )}
                  onClick={step.onClick}
                />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              )}
              <span
                onClick={step.onClick}
                className={cn(
                  "text-xs font-medium transition-colors select-none",
                  isLast
                    ? "text-foreground"
                    : isClickable
                      ? "text-muted-foreground hover:text-primary cursor-pointer"
                      : "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </nav>
  );
}