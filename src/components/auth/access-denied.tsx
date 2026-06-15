"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type AccessDeniedProps = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
};

export function AccessDenied({
  title,
  description,
  href = "/dashboard",
  actionLabel = "Back to Dashboard",
}: AccessDeniedProps) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-2xl border border-border/70 bg-card/80 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Link href={href} className="mt-6 inline-flex">
          <Button variant="outline">{actionLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
