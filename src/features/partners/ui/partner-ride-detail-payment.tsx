"use client";

import {
  PartnerRidePaymentBadge,
  PartnerRideStatusBadge,
} from "@/features/partners/ui/partner-ride-badges";
import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { Ban, RefreshCw } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Rides">>;
type TRides = ReturnType<typeof useTranslations<"Dashboard.Rides">>;

export function PartnerRideDetailPayment({
  t,
  tRides,
  currencySymbol,
  booking,
  isPassed,
}: {
  t: TFn;
  tRides: TRides;
  currencySymbol: string;
  booking: PartnerRideBooking;
  isPassed: boolean;
}) {
  const locale = useLocale();

  return (
    <DeskOverlaySection title={tRides("BillingAndPayment")}>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{t("your-payout")}</dt>
          <dd className="text-2xl font-semibold">
            {currencySymbol}
            {(booking.partnerPayoutAmount ?? booking.totalAmount ?? 0).toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{tRides("TotalAmount")}</dt>
          <dd className="text-lg font-semibold">
            {currencySymbol}
            {booking.totalAmount?.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            {tRides("PaymentStatus")}
          </dt>
          <dd>
            <PartnerRidePaymentBadge status={booking.paymentStatus} tRides={tRides} />
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-xs font-medium text-muted-foreground">
            {tRides("TripStatus")}
          </dt>
          <dd>
            <PartnerRideStatusBadge booking={booking} t={t} isPassed={isPassed} />
          </dd>
        </div>
      </dl>
      {booking.status === "canceled" && booking.canceledAt ? (
        <p className="flex items-center gap-2 text-sm">
          <Ban className="size-4" />
          {tRides("CanceledOn")} {new Date(booking.canceledAt).toLocaleString(locale)}
        </p>
      ) : null}
      {booking.refundAmount && booking.refundAmount > 0 ? (
        <p className="flex items-center gap-2 text-sm">
          <RefreshCw className="size-4" />
          {tRides("RefundProcessed")} {currencySymbol}
          {booking.refundAmount.toFixed(2)}
        </p>
      ) : null}
    </DeskOverlaySection>
  );
}
