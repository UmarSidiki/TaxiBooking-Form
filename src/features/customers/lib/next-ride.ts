type ScheduledRide = { date: string; time?: string };

function stamp(ride: ScheduledRide) {
  return `${ride.date} ${ride.time ?? "00:00"}`;
}

/** Soonest upcoming ride first; the API returns them newest-first. */
export function nextUpcomingRide<T extends ScheduledRide>(rides: T[]): T | null {
  if (rides.length === 0) return null;
  return [...rides].sort((a, b) => stamp(a).localeCompare(stamp(b)))[0] ?? null;
}

/** Past and cancelled rides share one list, newest first. */
export function mergePastRides<T extends ScheduledRide & { tripId: string }>(
  past: T[],
  canceled: T[],
): T[] {
  const seen = new Set<string>();
  return [...past, ...canceled]
    .filter((ride) => {
      if (seen.has(ride.tripId)) return false;
      seen.add(ride.tripId);
      return true;
    })
    .sort((a, b) => stamp(b).localeCompare(stamp(a)));
}
