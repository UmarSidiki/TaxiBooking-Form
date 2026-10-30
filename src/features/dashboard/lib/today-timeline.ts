export type TimelineRide = {
  _id: string;
  tripId: string;
  time: string;
  pickup: string;
  dropoff?: string;
  status: string;
  driverName?: string;
  partnerName?: string;
};

export type TimelineHour = { hour: number; rides: TimelineRide[] };

/** YYYY-MM-DD and hour of `now` in the operator's time zone. */
export function zonedToday(now: Date, timeZone: string): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

function hourOf(time: string): number | null {
  const match = /^(\d{1,2}):\d{2}/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  return hour >= 0 && hour < 24 ? hour : null;
}

/**
 * Hour rows from the working day (06–22 by default), stretched to cover any ride
 * outside it. Rides inside an hour are sorted by time.
 */
export function buildTimeline(rides: TimelineRide[], dayStart = 6, dayEnd = 22): TimelineHour[] {
  const byHour = new Map<number, TimelineRide[]>();
  for (const ride of rides) {
    const hour = hourOf(ride.time);
    if (hour === null) continue;
    byHour.set(hour, [...(byHour.get(hour) ?? []), ride]);
  }
  const hours = [...byHour.keys()];
  const from = Math.min(dayStart, ...hours);
  const to = Math.max(dayEnd, ...hours);
  const rows: TimelineHour[] = [];
  for (let hour = from; hour <= to; hour += 1) {
    const list = (byHour.get(hour) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));
    rows.push({ hour, rides: list });
  }
  return rows;
}
