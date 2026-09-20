"use client";

import type { IBooking } from "@/features/booking/model";
import { formatStopWaitDuration } from "@/features/rides/lib/format-stop-wait-duration";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { Baby, Clock } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailJourney({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  const dateLabel =
    booking.tripType === "roundtrip"
      ? t("Dashboard.Rides.DepartureDate")
      : t("Dashboard.Rides.Date");
  const timeLabel =
    booking.tripType === "roundtrip"
      ? t("Dashboard.Rides.DepartureTime")
      : t("Dashboard.Rides.Time");

  return (
    <DeskOverlaySection title={t("Dashboard.Rides.JourneyDetails")}>
      <dl className="space-y-3 text-sm">
        <DetailRow label={t("Dashboard.Rides.PickupLocation")} value={booking.pickup} />
        {booking.stops && booking.stops.length > 0 ? (
          <div className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">
              {t("Dashboard.Rides.Stops")}
            </dt>
            <dd className="space-y-2">
              {booking.stops
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((stop, index) => (
                  <p
                    key={`${stop.order}-${stop.location}`}
                    className="flex items-center justify-between gap-2 text-foreground"
                  >
                    <span>
                      {index + 1}. {stop.location}
                    </span>
                    {stop.duration && stop.duration > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatStopWaitDuration(stop.duration)}
                      </span>
                    ) : null}
                  </p>
                ))}
            </dd>
          </div>
        ) : null}
        <DetailRow
          label={t("Dashboard.Rides.DropoffLocation")}
          value={booking.dropoff || t("Dashboard.Rides.NotSpecified")}
        />
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <DetailRow label={dateLabel} value={booking.date} />
          <DetailRow label={timeLabel} value={booking.time} />
          {booking.tripType === "roundtrip" && booking.returnDate ? (
            <>
              <DetailRow
                label={t("Dashboard.Rides.ReturnDate")}
                value={booking.returnDate}
              />
              <DetailRow
                label={t("Dashboard.Rides.ReturnTime")}
                value={booking.returnTime ?? t("Dashboard.Rides.NotSpecified")}
              />
            </>
          ) : null}
          <DetailRow
            label={t("Dashboard.Rides.Passengers")}
            value={String(booking.passengers)}
          />
        </div>
      </dl>
      {booking.childSeats > 0 || booking.babySeats > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Baby className="size-4" />
          {seatCopy(booking, t)}
        </p>
      ) : null}
    </DeskOverlaySection>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function seatCopy(booking: IBooking, t: TFn) {
  const parts: string[] = [];
  if (booking.childSeats > 0) {
    parts.push(
      t(
        "Dashboard.Rides.detailbooking-childseats-child-seat-detailbooking-childseats-greater-than-1-s",
        { 0: booking.childSeats, 1: booking.childSeats > 1 ? "s" : "" }
      )
    );
  }
  if (booking.babySeats > 0) {
    parts.push(
      t(
        "Dashboard.Rides.detailbooking-babyseats-baby-seat-detailbooking-babyseats-greater-than-1-s",
        { 0: booking.babySeats, 1: booking.babySeats > 1 ? "s" : "" }
      )
    );
  }
  return parts.join(" • ");
}
