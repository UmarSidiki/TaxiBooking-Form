"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

import type { AdminAuditRow } from "@/features/customers-admin/lib/audit/audit.types";

export function AuditTarget({ row }: { row: AdminAuditRow }) {
  const locale = useLocale();
  if (row.targetType === "customer") {
    return (
      <Link
        href={`/${locale}/dashboard/customers/${encodeURIComponent(row.targetId)}`}
        className="inline-flex min-h-11 items-center rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="max-w-56 truncate" translate="no">
          {row.targetId}
        </span>
      </Link>
    );
  }
  return (
    <span className="max-w-56 truncate" translate="no">
      {row.targetId}
    </span>
  );
}
