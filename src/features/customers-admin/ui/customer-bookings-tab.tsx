"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { formatCustomerMoney } from "@/features/customers-admin/ui/customer-format";
import {
  formatProfileRide,
  profileStatusKey,
} from "@/features/customers-admin/ui/customer-profile-format";
import type { CustomerBookingRow } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";
import { NotifyBalanceButton } from "@/features/customers-admin/ui/notify-balance-button";

export function CustomerBookingsTab({
  bookings,
  capped,
  currency,
}: {
  bookings: CustomerBookingRow[];
  capped: boolean;
  currency: string;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const locale = useLocale();

  if (bookings.length === 0) {
    return <EmptyState message={t("bookings-empty")} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {capped ? (
        <p className="text-sm text-muted-foreground">
          {t("bookings-capped", { count: bookings.length })}
        </p>
      ) : null}
      <ul className="grid gap-3 lg:grid-cols-2">
        {bookings.map((booking) => {
          const statusKey = profileStatusKey(booking.status);
          const paymentKey = profileStatusKey(booking.paymentStatus);
          return (
            <li
              key={booking.id}
              className="flex flex-col gap-3 rounded border border-border/60 bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium tabular-nums">
                  {formatProfileRide(booking.date, booking.time, locale)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="rounded-chip">
                    {statusKey ? t(statusKey) : "—"}
                  </Badge>
                  <Badge variant="outline" className="rounded-chip">
                    {paymentKey ? t(paymentKey) : "—"}
                  </Badge>
                </div>
              </div>

              <p className="text-sm break-words">
                {booking.pickup}
                {booking.dropoff ? (
                  <>
                    {" "}
                    <span aria-hidden="true" className="inline-block rtl:rotate-180">
                      →
                    </span>{" "}
                    {booking.dropoff}
                  </>
                ) : null}
              </p>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <Field label={t("column-amount")}>
                  {formatCustomerMoney(booking.totalMinor, currency, locale)}
                </Field>
                <Field label={t("payment")}>
                  {formatCustomerMoney(booking.paidMinor, currency, locale)}
                </Field>
                {booking.refundedMinor > 0 ? (
                  <Field label={t("refund")}>
                    {formatCustomerMoney(booking.refundedMinor, currency, locale)}
                  </Field>
                ) : null}
                {booking.amountDueMinor > 0 ? (
                  <Field
                    label={
                      booking.paymentStatus === "completed"
                        ? t("balance-due")
                        : t("amount-due")
                    }
                  >
                    {formatCustomerMoney(booking.amountDueMinor, currency, locale)}
                  </Field>
                ) : null}
              </dl>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/dashboard/rides?bookingId=${encodeURIComponent(booking.id)}`}
                  className="inline-flex min-h-11 w-fit items-center rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {t("open-ride")}
                  <span className="sr-only"> — {booking.tripId}</span>
                </Link>
                {booking.amountDueMinor > 0 &&
                booking.paymentMethod !== "cash" &&
                booking.status !== "requested" &&
                booking.status !== "awaiting_payment" ? (
                  <NotifyBalanceButton tripId={booking.tripId} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium tabular-nums">{children}</dd>
    </div>
  );
}
