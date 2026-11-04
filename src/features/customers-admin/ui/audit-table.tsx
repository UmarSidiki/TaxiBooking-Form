"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { AuditActionBadge } from "@/features/customers-admin/ui/audit-action-badge";
import { AuditTarget } from "@/features/customers-admin/ui/audit-target";
import {
  auditTargetKey,
  formatAuditDateTime,
  formatAuditMetadata,
} from "@/features/customers-admin/ui/audit-format";
import type { AdminAuditRow } from "@/features/customers-admin/lib/audit/audit.types";

export function AuditTable({ rows }: { rows: AdminAuditRow[] }) {
  const t = useTranslations("Dashboard.AdminAudit");
  const locale = useLocale();

  return (
    <div className="hidden overflow-hidden rounded border border-border/60 bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>{t("column-at")}</TableHead>
            <TableHead>{t("column-actor")}</TableHead>
            <TableHead>{t("column-action")}</TableHead>
            <TableHead>{t("column-target")}</TableHead>
            <TableHead>{t("column-details")}</TableHead>
            <TableHead>{t("column-ip")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatAuditDateTime(row.at, locale) ?? "—"}
              </TableCell>
              <TableCell className="max-w-56">
                <ActorName row={row} />
              </TableCell>
              <TableCell>
                <AuditActionBadge action={row.action} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {t(auditTargetKey(row.targetType))}
                  </span>
                  <AuditTarget row={row} />
                </div>
              </TableCell>
              <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                {formatAuditMetadata(row.metadata) || t("no-details")}
              </TableCell>
              <TableCell className="tabular-nums text-xs text-muted-foreground" translate="no">
                {row.ipPrefix || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ActorName({ row }: { row: AdminAuditRow }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate font-medium">
        {row.actorName || row.actorEmail || "—"}
      </span>
      {row.actorEmail && row.actorName ? (
        <span className="truncate text-xs text-muted-foreground">{row.actorEmail}</span>
      ) : null}
    </div>
  );
}
