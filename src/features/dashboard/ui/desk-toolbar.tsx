"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

/** One-row page chrome: filters grow, primary action stays end-aligned. */
export function DeskToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Compact search/filter strip — matches fleet density. */
export function DeskFilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "desk-card w-full rounded-2xl border border-border/60 bg-card px-4 py-3.5 xl:flex-1",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {children}
      </div>
    </div>
  );
}

export const deskControlClassName =
  "h-10 rounded-xl border-border/50 bg-muted/40 text-sm transition-colors focus-visible:bg-background";

export const deskSearchInputClassName =
  "h-10 w-full rounded-xl border-border/50 bg-muted/40 ps-10 placeholder:text-muted-foreground/60 transition-colors focus-visible:bg-background";
