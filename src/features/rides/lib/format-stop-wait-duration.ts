import { MINUTES_PER_HOUR } from "@/lib/time/minutes-per-hour";

export function formatStopWaitDuration(durationMinutes: number): string {
  if (durationMinutes >= MINUTES_PER_HOUR) {
    const hours = Math.floor(durationMinutes / MINUTES_PER_HOUR);
    const remainderMinutes = durationMinutes % MINUTES_PER_HOUR;
    return remainderMinutes > 0
      ? `${hours}h ${remainderMinutes}m`
      : `${hours}h`;
  }
  return `${durationMinutes}m`;
}
