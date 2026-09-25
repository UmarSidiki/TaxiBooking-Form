"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

import { cn } from "@/shared/lib/utils";

type DeskNoticeProps = {
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "success" | "error";
  className?: string;
};

export function DeskNotice({
  children,
  onDismiss,
  dismissLabel,
  onRetry,
  retryLabel,
  variant = "success",
  className,
}: DeskNoticeProps) {
  const isError = variant === "error";
  const Icon = isError ? AlertCircle : CheckCircle;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-card text-foreground",
        className
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry && retryLabel ? (
        <button
          type="button"
          className="flex min-h-11 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onRetry}
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          {retryLabel}
        </button>
      ) : null}
      {onDismiss && dismissLabel ? (
        <button
          type="button"
          className="min-h-11 rounded-md px-2 py-0.5 text-xs font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onDismiss}
        >
          {dismissLabel}
        </button>
      ) : null}
    </div>
  );
}
