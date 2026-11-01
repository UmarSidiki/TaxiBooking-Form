import { MARKETING_QUIET_HOURS } from "@/features/marketing/lib/marketing.constants";

function hourInTimeZone(date: Date, timeZone: string): number {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return Number(formatted);
}

/** True inside 20:00–09:00 operator-local, the window marketing WhatsApp avoids. */
export function isMarketingQuietHours(
  date: Date,
  timeZone: string,
  window: { startHour: number; endHour: number } = MARKETING_QUIET_HOURS,
): boolean {
  const hour = hourInTimeZone(date, timeZone);
  if (window.startHour > window.endHour) {
    return hour >= window.startHour || hour < window.endHour;
  }
  return hour >= window.startHour && hour < window.endHour;
}
