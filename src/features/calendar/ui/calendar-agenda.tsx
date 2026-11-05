"use client";

import type { CalendarRide, CalendarTimeOff } from "@/features/calendar/ui/calendar-types";

export function CalendarAgenda({
  rides,
  timeOff,
  emptyLabel,
  timeOffLabel,
  unassignedLabel,
  onSelectRide,
}: {
  rides: CalendarRide[];
  timeOff: CalendarTimeOff[];
  emptyLabel: string;
  timeOffLabel: string;
  unassignedLabel: string;
  onSelectRide: (ride: CalendarRide) => void;
}) {
  if (rides.length === 0 && timeOff.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul aria-label="Agenda" className="flex flex-col gap-3">
      {timeOff.map((off) => (
        <li key={off._id} className="rounded-md border border-border bg-muted p-4">
          <p className="font-medium">{timeOffLabel}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(off.startsAt).toLocaleString()} – {new Date(off.endsAt).toLocaleString()}
          </p>
        </li>
      ))}
      {rides.map((ride) => (
        <li key={ride._id}>
          <button
            type="button"
            onClick={() => onSelectRide(ride)}
            className="w-full rounded-md border border-border bg-card p-4 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${ride.date} ${ride.time} ${ride.pickup}${ride.dropoff ? ` → ${ride.dropoff}` : ""}`}
          >
            <p className="font-medium">
              {ride.date} {ride.time}
            </p>
            <p className="text-sm">
              {ride.pickup}
              {ride.dropoff ? ` → ${ride.dropoff}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {ride.assignedDriver?.name || ride.assignedPartner?.name || unassignedLabel}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
