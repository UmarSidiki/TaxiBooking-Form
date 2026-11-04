"use client";

import { useLocale, useTranslations } from "next-intl";

import { AuditActionBadge } from "@/features/customers-admin/ui/audit-action-badge";
import { AuditTarget } from "@/features/customers-admin/ui/audit-target";
import {
  auditTargetKey,
  formatAuditDateTime,
  formatAuditMetadata,
} from "@/features/customers-admin/ui/audit-format";
import type { AdminAuditRow } from "@/features/customers-admin/lib/audit/audit.types";

export function AuditCardList({ rows }: { rows: AdminAuditRow[] }) {
  const t = useTranslations("Dashboard.AdminAudit");
  const locale = useLocale();

  return (
    <ul className="flex flex-col gap-2 md:hidden">
      {rows.map((row) => (
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
          <p className="text-xs text-muted-foreground">
            {t(auditTargetKey(row.targetType))}
          </p>
          <AuditTarget row={row} />
          <p className="break-words text-xs text-muted-foreground">
            {formatAuditMetadata(row.metadata) || t("no-details")}
          </p>
        </li>
      ))}
    </ul>
  );
}
