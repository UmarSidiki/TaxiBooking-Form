"use client";

import { Button } from "@/shared/ui/button";
import { Link } from "@/shared/i18n/navigation";

export function AppErrorScreen({
  title,
  description,
  retryLabel,
  homeLabel,
  onRetry,
  homeHref = "/",
}: {
  title: string;
  description: string;
  retryLabel: string;
  homeLabel: string;
  onRetry?: () => void;
  homeHref?: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onRetry ? (
            <Button type="button" className="h-11" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : null}
          <Button asChild variant="outline" className="h-11">
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
