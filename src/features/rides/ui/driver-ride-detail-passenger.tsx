"use client";

import type { useDriverDashboard } from "@/features/drivers/hooks/useDriverDashboard";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";

type DriverDashboardState = ReturnType<typeof useDriverDashboard>;
type TFn = DriverDashboardState["t"];
type Booking = NonNullable<DriverDashboardState["detailBooking"]>;

export function DriverRideDetailPassenger({
  t,
  detailBooking,
}: {
  t: TFn;
  detailBooking: Booking;
}) {
  return (
    <DeskOverlaySection title={t("Dashboard.Rides.CustomerInformation")}>
      <div className="space-y-3 text-sm">
        <p className="font-semibold">
          {detailBooking.firstName} {detailBooking.lastName}
        </p>
        <a
          className="block text-primary underline-offset-4 hover:underline"
          href={`mailto:${detailBooking.email}`}
        >
          {detailBooking.email}
        </a>
        <a
          className="block text-primary underline-offset-4 hover:underline"
          href={`tel:${detailBooking.phone}`}
        >
          {detailBooking.phone}
        </a>
        <div className="space-y-1 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t("Dashboard.Rides.Vehicle")}
          </p>
          <p>
            {detailBooking.vehicleDetails?.name || detailBooking.selectedVehicle}
          </p>
        </div>
        {detailBooking.flightNumber ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("Drivers.flight-number")}
            </p>
            <p>{detailBooking.flightNumber}</p>
          </div>
        ) : null}
      </div>
    </DeskOverlaySection>
  );
}
