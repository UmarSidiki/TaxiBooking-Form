"use client";

type Ride = {
  _id: string;
  date: string;
  time: string;
  pickup: string;
  dropoff?: string;
  assignedDriver?: { name?: string };
  assignedPartner?: { name?: string };
};

type TimeOff = { _id: string; startsAt: string; endsAt: string; note?: string };

export function CalendarAgenda({
  rides,
  timeOff,
  emptyLabel,
  timeOffLabel,
  unassignedLabel,
}: {
  rides: Ride[];
  timeOff: TimeOff[];
  emptyLabel: string;
  timeOffLabel: string;
  unassignedLabel: string;
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
        <li key={ride._id} className="rounded-md border border-border bg-card p-4">
          <p className="font-medium">{ride.date} {ride.time}</p>
          <p className="text-sm">{ride.pickup}{ride.dropoff ? ` → ${ride.dropoff}` : ""}</p>
          <p className="text-sm text-muted-foreground">
            {ride.assignedDriver?.name || ride.assignedPartner?.name || unassignedLabel}
          </p>
        </li>
      ))}
    </ul>
  );
}
