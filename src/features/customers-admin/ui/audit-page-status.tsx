"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function AuditLoading() {
  const t = useTranslations("Dashboard.AdminAudit");
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-16 animate-pulse rounded bg-muted/70" />
      ))}
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}

export function AuditBlocked({
  kind,
  onRetry,
}: {
  kind: "forbidden" | "error";
  onRetry: () => void;
}) {
  const t = useTranslations("Dashboard.AdminAudit");
  return (
    <div className="flex flex-col items-start gap-3 rounded border border-border/60 bg-card p-5">
      <p role="alert" className="font-medium">
        {kind === "forbidden" ? t("forbidden") : t("error")}
      </p>
      <Button type="button" variant="outline" className="min-h-11" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

export function AuditEmpty() {
  const t = useTranslations("Dashboard.AdminAudit");
  return (
    <div className="rounded border border-dashed border-border/70 p-5">
      <p className="font-medium">{t("empty")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("empty-description")}</p>
    </div>
  );
}
