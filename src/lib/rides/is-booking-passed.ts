const DEFAULT_TIMEZONE = 'Europe/Zurich';

export function isBookingPassed(
  dateStr: string,
  timeStr: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  try {
    const nowInTzStr = new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
    });
    const nowInTz = new Date(nowInTzStr);
    const bookingDate = new Date(`${dateStr}T${timeStr}:00`);
    return bookingDate < nowInTz;
  } catch {
    return new Date(`${dateStr}T${timeStr}:00`) < new Date();
  }
}
