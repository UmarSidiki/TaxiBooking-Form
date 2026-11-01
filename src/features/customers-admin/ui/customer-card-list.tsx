"use client";

import { useLocale, useTranslations } from "next-intl";
import { CustomerConsentChips } from "@/features/customers-admin/ui/customer-consent-chips";
import { CustomerPhone } from "@/features/customers-admin/ui/customer-phone";
import {
  customerDisplayName,
  formatCustomerCreatedAt,
  formatCustomerMoney,
  formatCustomerRideDate,
} from "@/features/customers-admin/ui/customer-format";
import type { CustomerListRow } from "@/features/customers-admin/lib/customer-list/customer-list.types";

export function CustomerCardList({ rows }: { rows: CustomerListRow[] }) {
  const t = useTranslations("Dashboard.Customers");
  const locale = useLocale();

  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded border border-border/60 bg-card p-4"
          aria-label={t("customer-aria", {
            name: customerDisplayName(row),
            email: row.email,
            rides: row.rides,
          })}
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{customerDisplayName(row)}</p>
            <p className="truncate text-sm text-muted-foreground">{row.email}</p>
            <p className="mt-1 text-sm">
              <CustomerPhone row={row} />
            </p>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Stat label={t("column-rides")} value={String(row.rides)} />
            <Stat
              label={t("column-spend")}
              value={formatCustomerMoney(row.spendMinor, row.currency, locale)}
            />
            <Stat
              label={t("column-last-ride")}
              value={formatCustomerRideDate(row.lastRideAt, locale) ?? t("never")}
            />
            <Stat
              label={t("column-created")}
              value={formatCustomerCreatedAt(row.createdAt, locale) ?? "—"}
            />
          </dl>

          <div className="mt-3 border-t border-border/60 pt-3">
            <CustomerConsentChips
              emailConsent={row.emailConsent}
              whatsappConsent={row.whatsappConsent}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium tabular-nums">{value}</dd>
    </div>
  );
}
