"use client";

import type { PartnerHistoryReview } from "@/features/partners/hooks/usePartnerHistory";
import { PartnerRideStatusBadge } from "@/features/partners/ui/partner-ride-badges";
import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import { Card, CardContent } from "@/shared/ui/card";
import { Star } from "lucide-react";
import { useLocale, type useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Rides">>;

export function PartnerHistoryCard({
  booking,
  t,
  review,
  isPassed,
}: {
  booking: PartnerRideBooking;
  t: TFn;
  review: PartnerHistoryReview | null;
  isPassed: boolean;
}) {
  const locale = useLocale();
  const dateLabel = new Date(booking.date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="desk-card border-border">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">
              {t("trip")}
              {booking.tripId.slice(0, 8)}
            </h3>
            <p className="truncate text-sm text-muted-foreground">{booking.vehicleDetails.name}</p>
          </div>
          <PartnerRideStatusBadge booking={booking} t={t} isPassed={isPassed} />
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">{t("date")}</span>
          <span className="ms-2 font-medium">
            {dateLabel} {booking.time}
          </span>
        </p>
        <RideMapLine start={booking.pickup} end={booking.dropoff || "—"} />
        {review ? (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("customer-review")}
            </p>
            <div className="mb-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-4 ${star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              ))}
              <span className="ms-1 text-sm font-semibold">{review.rating}/5</span>
            </div>
            <p className="text-sm text-muted-foreground">&ldquo;{review.comment}&rdquo;</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
