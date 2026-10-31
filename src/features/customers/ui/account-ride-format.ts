import { formatMoney } from "./portal-money";
import { dateLocale } from "./account-format";
import type { AccountT, Ride } from "./account-types";

type RideClock = Pick<Ride, "date" | "time">;

function rideInstant(ride: RideClock): Date | null {
  const instant = new Date(`${ride.date}T${ride.time || "00:00"}:00Z`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

function weekdayDayMonth(
  instant: Date,
  locale: string,
  month: "long" | "short",
): string {
  const loc = dateLocale(locale);
  const weekday = new Intl.DateTimeFormat(loc, {
    weekday: "short",
    timeZone: "UTC",
  }).format(instant);
  const dayMonth = new Intl.DateTimeFormat(loc, {
    day: "numeric",
    month,
    timeZone: "UTC",
  }).format(instant);
  // English copy reads "Sat, 7 November"; other locales use their native order.
  return loc === "en-GB" ? `${weekday}, ${dayMonth}` : `${weekday} ${dayMonth}`;
}

export function formatRideDay(
  ride: RideClock,
  locale: string,
  style: "long" | "short" = "long",
): string {
  const instant = rideInstant(ride);
  if (!instant) return ride.date;
  return weekdayDayMonth(instant, locale, style === "short" ? "short" : "long");
}

export function formatPastDay(ride: RideClock, locale: string): string {
  const instant = rideInstant(ride);
  if (!instant) return ride.date;
  return new Intl.DateTimeFormat(dateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(instant);
}

export function formatRideTime(ride: RideClock, locale: string): string {
  const instant = rideInstant(ride);
  if (!instant) return ride.time;
  return new Intl.DateTimeFormat(dateLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(instant);
}

export function formatDeadline(
  deadline: { date: string; time: string },
  locale: string,
): string {
  const instant = new Date(`${deadline.date}T${deadline.time}:00Z`);
  if (Number.isNaN(instant.getTime())) return `${deadline.date} · ${deadline.time}`;
  return `${weekdayDayMonth(instant, locale, "short")} · ${deadline.time}`;
}

export function statusTone(status?: string): "muted" | "warn" | "err" {
  if (status === "requested" || status === "awaiting_payment") return "warn";
  if (status === "canceled") return "err";
  return "muted";
}

export function statusLabel(t: AccountT, status?: string): string {
  return t(`status-${status || "upcoming"}`);
}

export function vehicleName(ride: Ride): string {
  return ride.vehicleDetails?.name?.trim() || "—";
}

export function vehicleDetail(t: AccountT, ride: Ride): string {
  const parts: string[] = [];
  const seats = ride.vehicleDetails?.seats;
  if (seats) parts.push(t("seats-line", { count: seats }));
  if (ride.passengers) parts.push(t("passengers-line", { count: ride.passengers }));
  return parts.join(" · ");
}

export function paymentLine(t: AccountT, ride: Ride): string {
  const method = ride.paymentMethod
    ? ride.paymentMethod === "cash"
      ? t("pay-cash")
      : t("pay-card")
    : null;
  const state = ride.paymentStatus
    ? ride.paymentStatus === "completed"
      ? t("fare-paid")
      : t("fare-awaiting")
    : null;
  return [state, method].filter(Boolean).join(" · ");
}

export function rideMoney(ride: Ride, locale: string, currency: string): string {
  return formatMoney(ride.totalAmount, locale, currency);
}

export function driverName(t: AccountT, ride: Ride): string {
  return ride.assignedDriver?.name || ride.assignedPartner?.name || t("to-be-assigned");
}

export function routeLabel(t: AccountT, pickup: string, dropoff?: string): string {
  if (!dropoff) return pickup;
  return t("route-join", { pickup, dropoff });
}
