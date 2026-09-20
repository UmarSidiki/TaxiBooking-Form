"use client";

import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import { Ban, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;
type TFn = DriverDashboardState["t"];
type Booking = NonNullable<DriverDashboardState["detailBooking"]>;

export function DriverRideDetailPayment({
  t,
  currencySymbol,
  detailBooking,
  isBookingPassed,
}: {
  t: TFn;
  currencySymbol: string;
  detailBooking: Booking;
  isBookingPassed: DriverDashboardState["isBookingPassed"];
}) {
  const locale = useLocale();

  return (
    <DeskOverlaySection title={t("Dashboard.Rides.BillingAndPayment")}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.TotalAmount")}
          </dt>
          <dd className="text-lg font-semibold">
            {currencySymbol}
            {detailBooking.totalAmount?.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.PaymentMethod")}
          </dt>
          <dd className="capitalize">
            {detailBooking.paymentMethod?.replace("_", " ") ||
              t("Dashboard.Rides.NotSpecified")}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.PaymentStatus")}
          </dt>
          <dd>
            <RidePaymentStatusBadge status={detailBooking.paymentStatus} />
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.TripStatus")}
          </dt>
          <dd>
            <RideStatusBadge
              booking={detailBooking}
              isCompleted={isBookingPassed(detailBooking.date, detailBooking.time)}
            />
          </dd>
        </div>
      </dl>
      {detailBooking.status === "canceled" || detailBooking.refundAmount ? (
        <div className="space-y-2 border-t border-border pt-3 text-sm">
          {detailBooking.status === "canceled" && detailBooking.canceledAt ? (
            <p className="flex items-center gap-2">
              <Ban className="size-4" />
              {t("Dashboard.Rides.CanceledOn")}{" "}
              {new Date(detailBooking.canceledAt).toLocaleString(locale)}
            </p>
          ) : null}
          {detailBooking.refundAmount && detailBooking.refundAmount > 0 ? (
            <p className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="size-4" />
                {t("Dashboard.Rides.RefundProcessed")}
              </span>
              <span className="font-semibold">
                {currencySymbol}
                {detailBooking.refundAmount.toFixed(2)}
                {detailBooking.refundPercentage ? (
                  <span className="ms-1 font-normal text-muted-foreground">
                    ({detailBooking.refundPercentage}%)
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
