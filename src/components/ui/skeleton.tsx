"use client";

import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/30">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4 rounded", i === 0 ? "w-8" : i === 1 ? "flex-1 max-w-[200px]" : "w-24")}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-5 space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-20 mt-2" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
