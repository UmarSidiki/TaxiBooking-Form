"use client";

import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import { Baby } from "lucide-react";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;
type TFn = DriverDashboardState["t"];
type Booking = NonNullable<DriverDashboardState["detailBooking"]>;

export function DriverRideDetailJourney({
  t,
  detailBooking,
}: {
  t: TFn;
  detailBooking: Booking;
}) {
  return (
    <DeskOverlaySection title={t("Dashboard.Rides.JourneyDetails")}>
      <RideMapLine
        start={detailBooking.pickup}
        end={detailBooking.dropoff || t("Dashboard.Rides.NotSpecified")}
      />
      {detailBooking.stops && detailBooking.stops.length > 0 ? (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {detailBooking.stops
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((stop) => (
              <li key={`${stop.order}-${stop.location}`}>{stop.location}</li>
            ))}
        </ul>
      ) : null}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.Time")}
          </dt>
          <dd>{detailBooking.time}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.Passengers")}
          </dt>
          <dd>{detailBooking.passengers}</dd>
        </div>
      </dl>
      {detailBooking.childSeats > 0 || detailBooking.babySeats > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Baby className="size-4" />
          {seatCopy(detailBooking, t)}
        </p>
      ) : null}
    </DeskOverlaySection>
  );
}

function seatCopy(booking: Booking, t: TFn) {
  const parts: string[] = [];
  if (booking.childSeats > 0) {
    parts.push(
      t("Drivers.detailbooking-childseats-child-seat-detailbooking-childseats-greater-than-1-s", {
        0: booking.childSeats,
        1: booking.childSeats > 1 ? "s" : "",
      })
    );
  }
  if (booking.babySeats > 0) {
    parts.push(
      t("Drivers.detailbooking-babyseats-baby-seat-detailbooking-babyseats-greater-than-1-s", {
        0: booking.babySeats,
        1: booking.babySeats > 1 ? "s" : "",
      })
    );
  }
  return parts.join(" • ");
}
