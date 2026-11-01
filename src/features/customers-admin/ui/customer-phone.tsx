"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/shared/ui/badge";
import { formatCustomerPhone } from "@/features/customers-admin/ui/customer-format";
import type { CustomerListRow } from "@/features/customers-admin/lib/customer-list/customer-list.types";

export function CustomerPhone({ row }: { row: CustomerListRow }) {
  const t = useTranslations("Dashboard.Customers");
  const phone = formatCustomerPhone(row);
  if (!phone) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="tabular-nums">{phone}</span>
      {row.verifiedPhone ? (
        <Badge
          variant="secondary"
          className="rounded-chip"
          title={t("verified-phone")}
          aria-label={t("verified-phone")}
        >
          <Check className="size-3" aria-hidden="true" />
          {t("verified")}
        </Badge>
      ) : null}
    </span>
  );
}
