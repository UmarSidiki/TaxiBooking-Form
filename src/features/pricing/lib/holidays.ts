/** A surcharge for every pickup date from `start` to `end` (inclusive, YYYY-MM-DD, operator-local). */
export type HolidayRange = { start: string; end: string; percent: number };

/** Accepts legacy `{ date, percent }` rows as single-day ranges. */
export function normalizeHolidays(
  rows: ReadonlyArray<{ start?: string; end?: string; date?: string; percent?: number }> | undefined,
): HolidayRange[] {
  return (rows ?? [])
    .map((row) => {
      const start = row.start ?? row.date ?? "";
      return { start, end: row.end ?? start, percent: Number(row.percent) || 0 };
    })
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.start) && /^\d{4}-\d{2}-\d{2}$/.test(row.end) && row.start <= row.end);
}

/** Highest percent among ranges covering `date`; overlapping ranges never stack. */
export function holidayPercentFor(date: string | undefined, ranges: HolidayRange[]) {
  if (!date) return 0;
  return ranges.reduce((best, range) => (date >= range.start && date <= range.end ? Math.max(best, range.percent) : best), 0);
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Wall-clock `YYYY-MM-DDTHH:mm` for `now` in `timeZone` (UTC when missing or invalid). */
export function localStamp(now: Date, timeZone?: string) {
  let zone = timeZone || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
  } catch {
    zone = "UTC";
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Ranges whose end date is earlier than this are expired (12h after the end day finishes). */
export function holidayCutoff(now: Date, timeZone?: string) {
  const stamp = localStamp(now, timeZone);
  const today = stamp.slice(0, 10);
  return stamp.slice(11) >= "12:00" ? today : addDays(today, -1);
}

export function activeHolidays(ranges: HolidayRange[], now: Date, timeZone?: string) {
  const cutoff = holidayCutoff(now, timeZone);
  return ranges.filter((range) => range.end >= cutoff);
}

export function rangesOverlap(a: HolidayRange, b: HolidayRange) {
  return a.start <= b.end && b.start <= a.end;
}
