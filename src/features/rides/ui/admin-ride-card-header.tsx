"use client";

import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import type { IBooking } from "@/features/booking/model";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardHeader({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
  statusColor?: "destructive" | "muted" | "primary";
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
          </h3>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {booking.vehicleDetails?.name || booking.selectedVehicle}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <RideStatusBadge booking={booking} />
        <RidePaymentStatusBadge status={booking.paymentStatus} />
      </div>
    </div>
  );
}
