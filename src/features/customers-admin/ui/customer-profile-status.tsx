"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";

export function CustomerProfileLoading() {
  const t = useTranslations("Dashboard.CustomerProfile");
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded bg-muted/70" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}

export function CustomerProfileBlocked({
  kind,
  onRetry,
}: {
  kind: "not_found" | "forbidden" | "error";
  onRetry?: () => void;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const locale = useLocale();
  const title = kind === "error" ? t("error") : t(kind);

  return (
    <div className="flex flex-col items-start gap-3 rounded border border-border/60 bg-card p-5">
      <p className="font-medium" role={kind === "error" ? "alert" : undefined}>
        {title}
      </p>
      {kind === "not_found" ? (
        <p className="text-sm text-muted-foreground">{t("not-found-description")}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {kind === "error" && onRetry ? (
          <Button type="button" variant="outline" className="min-h-11" onClick={onRetry}>
            {t("retry")}
          </Button>
        ) : null}
        <Button asChild variant="ghost" className="min-h-11">
          <Link href={`/${locale}/dashboard/customers`}>{t("back")}</Link>
        </Button>
      </div>
    </div>
  );
}
