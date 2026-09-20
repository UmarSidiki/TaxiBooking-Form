"use client";

import type { IBooking } from "@/features/booking/model";
import { DeskOverlaySection } from "@/features/rides/ui/desk-overlay-section";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideDetailAssignment({
  booking,
  t,
  isBookingPassed,
}: {
  booking: IBooking;
  t: TFn;
  isBookingPassed: (dateStr: string, timeStr: string) => boolean;
}) {
  const show =
    (isBookingPassed(booking.date, booking.time) || booking.status === "canceled") &&
    (booking.assignedDriver || booking.assignedPartner);
  if (!show) return null;

  return (
    <DeskOverlaySection title={t("Dashboard.Rides.assignment-information")}>
      <dl className="grid gap-4 sm:grid-cols-2">
        {booking.assignedDriver ? (
          <div className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">
              {t("Dashboard.Rides.assigned-driver")}
            </dt>
            <dd className="font-semibold text-foreground">
              {booking.assignedDriver.name}
            </dd>
            <dd className="text-sm text-muted-foreground">
              {booking.assignedDriver.email}
            </dd>
          </div>
        ) : null}
        {booking.assignedPartner ? (
          <div className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">
              {t("Dashboard.Rides.assigned-partner")}
            </dt>
            <dd className="font-semibold text-foreground">
              {booking.assignedPartner.name}
            </dd>
            <dd className="text-sm text-muted-foreground">
              {booking.assignedPartner.email}
            </dd>
          </div>
        ) : null}
      </dl>
    </DeskOverlaySection>
  );
}
