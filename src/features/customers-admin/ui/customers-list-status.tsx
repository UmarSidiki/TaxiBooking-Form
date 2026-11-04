"use client";

import { SearchX, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";

export function CustomersSkeleton() {
  const t = useTranslations("Dashboard.Customers");
  return (
    <div
      className="flex flex-col gap-2 rounded border border-border/60 bg-card p-4"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t("loading")}</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CustomersEmpty({
  hasQuery,
  onReset,
}: {
  hasQuery: boolean;
  onReset: () => void;
}) {
  const t = useTranslations("Dashboard.Customers");
  const Icon = hasQuery ? SearchX : Users;
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded border border-border/60 bg-card p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-md bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="font-medium">
          {hasQuery ? t("no-results") : t("empty")}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasQuery ? t("no-results-description") : t("empty-description")}
        </p>
      </div>
      {hasQuery ? (
        <Button type="button" variant="outline" onClick={onReset}>
          {t("reset-filters")}
        </Button>
      ) : null}
    </div>
  );
}

export function CustomersError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Dashboard.Customers");
  return (
    <DeskNotice
      variant="error"
      onRetry={onRetry}
      retryLabel={t("retry")}
    >
      {t("error")}
    </DeskNotice>
  );
}
