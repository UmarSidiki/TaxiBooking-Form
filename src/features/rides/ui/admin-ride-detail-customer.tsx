"use client";

import type { IBooking } from "@/features/booking/model";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailCustomer({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  return (
    <DeskOverlaySection title={t("Dashboard.Rides.CustomerInformation")}>
      <div className="space-y-3 text-sm">
        <p className="font-semibold text-foreground">
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
        <div className="space-y-1 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.Vehicle")}
          </p>
          <p>{booking.vehicleDetails?.name || booking.selectedVehicle}</p>
        </div>
        {booking.flightNumber ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("Dashboard.Rides.flight-number2")}
            </p>
            <p>{booking.flightNumber}</p>
          </div>
        ) : null}
      </div>
    </DeskOverlaySection>
  );
}
