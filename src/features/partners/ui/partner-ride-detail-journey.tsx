"use client";

import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import { RideLocationList } from "@/features/rides/ui/ride-location-list";
import { RideMapLine } from "@/features/rides/ui/ride-map-line";
import type { useTranslations } from "next-intl";

type TRides = ReturnType<typeof useTranslations<"Dashboard.Rides">>;

export function PartnerRideDetailJourney({
  tRides,
  booking,
}: {
  tRides: TRides;
  booking: PartnerRideBooking;
}) {
  return (
    <DeskOverlaySection title={tRides("JourneyDetails")}>
      <RideMapLine start={booking.pickup} end={booking.dropoff || tRides("NotSpecified")} />
      <RideLocationList ride={booking} />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{tRides("Time")}</dt>
          <dd>{booking.time}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{tRides("Passengers")}</dt>
          <dd>{booking.passengers}</dd>
        </div>
      </dl>
    </DeskOverlaySection>
  );
}
