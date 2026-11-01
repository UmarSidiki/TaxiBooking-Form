"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { AuditActionBadge } from "@/features/customers-admin/ui/audit-action-badge";
import {
  formatAuditDateTime,
  formatAuditMetadata,
} from "@/features/customers-admin/ui/audit-format";
import { useCustomerActivity } from "@/features/customers-admin/hooks/use-customer-activity";

export function CustomerActivityTab({ email }: { email: string }) {
  const t = useTranslations("Dashboard.AdminAudit");
  const locale = useLocale();
  const activity = useCustomerActivity(email);

  if (activity.state === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("activity-loading")}
      </p>
    );
  }

  if (activity.state !== "ready") {
    return (
      <div className="flex flex-col items-start gap-3 rounded border border-border/60 bg-card p-5">
        <p role="alert" className="font-medium">
          {activity.state === "forbidden" ? t("forbidden") : t("activity-error")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={activity.reload}
        >
          {t("activity-retry")}
        </Button>
      </div>
    );
  }

  if (activity.rows.length === 0) {
    return (
      <p className="rounded border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
        {t("activity-empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("activity-count", { count: activity.rows.length })}
      </p>
      <ol className="flex flex-col gap-2">
        {activity.rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-2 rounded border border-border/60 bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AuditActionBadge action={row.action} />
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatAuditDateTime(row.at, locale) ?? "—"}
              </span>
            </div>
            <p className="text-sm font-medium">
              {row.actorName || row.actorEmail || "—"}
            </p>
            <p className="break-words text-xs text-muted-foreground">
              {formatAuditMetadata(row.metadata) || t("no-details")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
