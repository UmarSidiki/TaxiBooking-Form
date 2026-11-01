"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { auditActionKey } from "@/features/customers-admin/ui/audit-format";

export function AuditActionBadge({ action }: { action: string }) {
  const t = useTranslations("Dashboard.AdminAudit");
  return (
    <Badge variant="outline" className="rounded-chip">
      {t(auditActionKey(action))}
    </Badge>
  );
}
