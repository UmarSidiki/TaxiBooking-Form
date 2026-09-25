"use client";

import type { IBooking } from "@/features/booking/model";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminRideCardRoute({
  booking,
  t,
}: {
  booking: IBooking;
  t: TFn;
}) {
  const stops = [...(booking.stops ?? [])].sort((a, b) => a.order - b.order);
  const dropoff = booking.dropoff || t("Dashboard.Rides.NotSpecified");

  return (
    <ol className="relative flex flex-col gap-0 ps-0">
      <RouteStop label={booking.pickup} kind="start" />
      {stops.map((stop) => (
        <RouteStop key={`${stop.order}-${stop.location}`} label={stop.location} />
      ))}
      <RouteStop label={dropoff} kind="end" />
    </ol>
  );
}

function RouteStop({
  label,
  kind = "mid",
}: {
  label: string;
  kind?: "start" | "mid" | "end";
}) {
  return (
    <li className="relative flex gap-3 pb-3 last:pb-0">
      {kind !== "end" ? (
        <span
          className="absolute start-[0.4375rem] top-3 bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      ) : null}
      <span
        className={
          kind === "start"
            ? "relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-primary ring-4 ring-primary/15"
            : kind === "end"
              ? "relative z-10 mt-1 size-2.5 shrink-0 rounded-full border-2 border-foreground bg-background"
              : "relative z-10 mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50 ring-[3px] ring-background"
        }
        aria-hidden="true"
      />
      <p
        className="min-w-0 flex-1 truncate text-sm text-foreground"
        title={label}
      >
        {label}
      </p>
    </li>
  );
}
