"use client";

import type { IBooking } from "@/features/booking/model";
import { Baby, Plane } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardExtras({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  const chips: { key: string; icon: typeof Plane; label: string }[] = [];

  if (booking.flightNumber) {
    chips.push({
      key: "flight",
      icon: Plane,
      label: `${t("Dashboard.Rides.flight-number")} ${booking.flightNumber}`,
    });
  }
  if (booking.childSeats > 0) {
    chips.push({
      key: "child",
      icon: Baby,
      label: `${t("Dashboard.Rides.child-seats")} ${booking.childSeats}`,
    });
  }
  if (booking.babySeats > 0) {
    chips.push({
      key: "baby",
      icon: Baby,
      label: `${t("Dashboard.Rides.baby-seats")} ${booking.babySeats}`,
    });
  }

  if (chips.length === 0 && !booking.notes) return null;

  return (
    <div className="flex flex-col gap-2">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(({ key, icon: Icon, label }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              <Icon className="size-3" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {booking.notes ? (
        <p className="rounded-lg bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {t("Dashboard.Rides.special-requests")}{" "}
          </span>
          {booking.notes}
        </p>
      ) : null}
    </div>
  );
}
