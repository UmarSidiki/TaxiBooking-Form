"use client";

import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { formatCustomerMoney } from "@/features/customers-admin/ui/customer-format";
import {
  formatProfileDateTime,
  profileStatusKey,
} from "@/features/customers-admin/ui/customer-profile-format";
import { EmptyState } from "@/features/customers-admin/ui/customer-bookings-tab";
import type {
  CustomerPaymentKind,
  CustomerPaymentRow,
} from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

const KIND_KEYS: Record<CustomerPaymentKind, string> = {
  payment: "payment",
  refund: "refund",
  ride_charge: "ride-charge",
};

export function CustomerPaymentsTab({
  payments,
  currency,
}: {
  payments: CustomerPaymentRow[];
  currency: string;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const locale = useLocale();

  if (payments.length === 0) {
    return <EmptyState message={t("payments-empty")} />;
  }

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {payments.map((payment) => {
        const statusKey = profileStatusKey(payment.status);
        const at = formatProfileDateTime(payment.at, locale);
        return (
          <li
            key={payment.id}
            className="flex flex-col gap-2 rounded border border-border/60 bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{t(KIND_KEYS[payment.kind])}</span>
              <span className="font-medium tabular-nums">
                {formatCustomerMoney(payment.amountMinor, currency, locale)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="rounded-chip">
                {statusKey ? t(statusKey) : "—"}
              </Badge>
              {payment.method ? (
                <span className="text-muted-foreground">{payment.method}</span>
              ) : null}
              {at ? <span className="text-muted-foreground">{at}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("trip")}: <span className="tabular-nums">{payment.tripId}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
