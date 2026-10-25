import { rideInterval } from "@/features/calendar/lib/ride-window";

export type IcsRide = {
  tripId: string;
  date: string;
  time: string;
  pickup: string;
  bookingType?: string;
  duration?: number;
  tripType?: string;
};

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Personal feed. Pickup only — no phone, email, or passenger name. */
export function buildIcs(rides: IcsRide[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Taxi Booking//Desk//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const ride of rides) {
    const interval = rideInterval(ride);
    if (!interval) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ride.tripId}@taxi-booking`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(interval.start)}`,
      `DTEND:${stamp(interval.end)}`,
      `SUMMARY:${ride.tripId} ${ride.pickup}`.replace(/[\n,;]/g, " "),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
