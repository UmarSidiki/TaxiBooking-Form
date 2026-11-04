/** Wall-clock helpers for the operator time zone. Pure; safe on client and server. */

function offsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** "2026-11-02T09:30" read as wall time in `timeZone` -> UTC Date. Null when unparseable. */
export function zonedWallTimeToUtc(local: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const tz = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = wall - offsetMs(new Date(wall), tz);
  // Second pass settles DST boundaries.
  guess = wall - offsetMs(new Date(guess), tz);
  const out = new Date(guess);
  return Number.isNaN(out.getTime()) ? null : out;
}

/** Current wall time in `timeZone` as "YYYY-MM-DDTHH:mm" (for datetime-local min/default). */
export function utcToZonedWallTime(date: Date, timeZone: string): string {
  const tz = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const shifted = new Date(date.getTime() + offsetMs(date, tz));
  return shifted.toISOString().slice(0, 16);
}
