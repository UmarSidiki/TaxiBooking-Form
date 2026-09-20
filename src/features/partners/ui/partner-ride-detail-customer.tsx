"use client";

import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import type { useTranslations } from "next-intl";

type TRides = ReturnType<typeof useTranslations<"Dashboard.Rides">>;

export function PartnerRideDetailCustomer({
  tRides,
  booking,
}: {
  tRides: TRides;
  booking: PartnerRideBooking;
}) {
  return (
    <DeskOverlaySection title={tRides("CustomerInformation")}>
      <div className="space-y-3 text-sm">
        <p className="font-semibold">
          {booking.firstName} {booking.lastName}
        </p>
        <a
          className="block text-primary underline-offset-4 hover:underline"
          href={`mailto:${booking.email}`}
        >
          {booking.email}
        </a>
        <a
          className="block text-primary underline-offset-4 hover:underline"
          href={`tel:${booking.phone}`}
        >
          {booking.phone}
        </a>
        {booking.vehicleDetails?.name ? (
          <p className="border-t border-border pt-3">{booking.vehicleDetails.name}</p>
        ) : null}
        {booking.flightNumber ? <p>{booking.flightNumber}</p> : null}
      </div>
    </DeskOverlaySection>
  );
}
