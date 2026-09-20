"use client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { PartnerRideStatusBadge } from "@/features/partners/ui/partner-ride-badges";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import type { usePartnerRides } from "@/features/rides/hooks/usePartnerRides";
import { useLocale } from "next-intl";

type PartnerRidesState = ReturnType<typeof usePartnerRides>;

export function PartnerRideCard({
  booking,
  t,
  currencySymbol,
  isBookingPassed,
  setDetailBooking,
}: {
  booking: PartnerRideBooking;
  t: PartnerRidesState["t"];
  currencySymbol: string;
  isBookingPassed: PartnerRidesState["isBookingPassed"];
  setDetailBooking: PartnerRidesState["setDetailBooking"];
}) {
  const locale = useLocale();
  const dateLabel = new Date(booking.date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="desk-card overflow-hidden border-border">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              {t("trip")}
              {booking.tripId.slice(0, 8)}
            </h3>
            <p className="truncate text-sm text-muted-foreground">{booking.vehicleDetails.name}</p>
          </div>
          <div className="text-end">
            <PartnerRideStatusBadge
              booking={booking}
              t={t}
              isPassed={isBookingPassed(booking.date, booking.time)}
            />
            <p className="mt-1 text-sm font-semibold">
              {currencySymbol}
              {(booking.partnerPayoutAmount ?? booking.totalAmount ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{t("your-payout")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p>
            <span className="text-muted-foreground">{t("date")}</span>
            <span className="ms-2 font-medium">{dateLabel}</span>
          </p>
          <p>
            <span className="text-muted-foreground">{t("time")}</span>
            <span className="ms-2 font-medium">{booking.time}</span>
          </p>
        </div>
        <RideMapLine start={booking.pickup} end={booking.dropoff || "—"} />
        <Button className="h-11 w-full" onClick={() => setDetailBooking(booking)}>
          {t("view-details")}
        </Button>
      </CardContent>
    </Card>
  );
}
