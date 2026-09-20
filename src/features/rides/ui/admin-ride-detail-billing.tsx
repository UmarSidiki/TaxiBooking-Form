"use client";

import type { IBooking } from "@/features/booking/model";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import { Ban, RefreshCw } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailBilling({
  booking,
  t,
  currencySymbol,
}: {
  booking: IBooking;
  t: TFn;
  currencySymbol: string;
}) {
  const locale = useLocale();

  return (
    <DeskOverlaySection title={t("Dashboard.Rides.BillingAndPayment")}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.TotalAmount")}
          </dt>
          <dd className="text-lg font-semibold text-foreground">
            {currencySymbol}
            {booking.totalAmount?.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.PaymentMethod")}
          </dt>
          <dd className="capitalize text-foreground">
            {booking.paymentMethod?.replace("_", " ") ||
              t("Dashboard.Rides.NotSpecified")}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.PaymentStatus")}
          </dt>
          <dd>
            <RidePaymentStatusBadge status={booking.paymentStatus} />
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.TripStatus")}
          </dt>
          <dd>
            <RideStatusBadge booking={booking} />
          </dd>
        </div>
      </dl>
      {booking.status === "canceled" || booking.refundAmount ? (
        <div className="space-y-2 border-t border-border pt-3 text-sm">
          {booking.status === "canceled" && booking.canceledAt ? (
            <p className="flex items-center gap-2">
              <Ban className="size-4" />
              {t("Dashboard.Rides.CanceledOn")}{" "}
              {new Date(booking.canceledAt).toLocaleString(locale)}
            </p>
          ) : null}
          {booking.refundAmount && booking.refundAmount > 0 ? (
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="size-4" />
                {t("Dashboard.Rides.RefundProcessed")}
              </span>
              <span className="font-semibold">
                {currencySymbol}
                {booking.refundAmount.toFixed(2)}
                {booking.refundPercentage ? (
                  <span className="ms-1 font-normal text-muted-foreground">
                    ({booking.refundPercentage}%)
                  </span>
                ) : null}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </DeskOverlaySection>
  );
}
