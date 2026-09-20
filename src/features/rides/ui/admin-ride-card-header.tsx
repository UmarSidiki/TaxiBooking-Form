"use client";

import { RidePaymentStatusBadge } from "@/features/rides/ui/ride-payment-status-badge";
import { RideStatusBadge } from "@/features/rides/ui/ride-status-badge";
import type { IBooking } from "@/features/booking/model";
import { Car } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;
type StatusColor = "destructive" | "muted" | "primary";

export function AdminRideCardHeader({
  booking,
  t,
  statusColor,
}: {
  booking: IBooking;
  t: TFn;
  statusColor: StatusColor;
}) {
  return (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    statusColor === "destructive"
                      ? "bg-destructive/10"
                      : statusColor === "muted"
                      ? "bg-muted/10"
                      : "bg-primary/10"
                  }`}
                >
                  <Car
                    className={`w-5 h-5 ${
                      statusColor === "destructive"
                        ? "text-destructive"
                        : statusColor === "muted"
                        ? "text-muted-foreground"
                        : "text-primary"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {t("Dashboard.Rides.Trip")} #{booking.tripId.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicleDetails?.name || booking.selectedVehicle}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <RideStatusBadge booking={booking} />
                <RidePaymentStatusBadge status={booking.paymentStatus} />
              </div>
            </div>
  );
}
