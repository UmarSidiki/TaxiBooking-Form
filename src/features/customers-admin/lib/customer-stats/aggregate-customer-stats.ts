import type {
  CustomerStatsAggregate,
  CustomerStatsBooking,
  CustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.types";

const CONFIRMED_STATUSES = new Set(["upcoming", "completed"]);

export function statsEmailKey(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function digitsOnly(value: string | null | undefined): string {
  let digits = "";
  for (const char of value ?? "") {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

/**
 * Ride date + time are stored as operator-local wall clock. Treat them as UTC
 * so aggregation stays deterministic and independent of the host timezone.
 */
function rideInstant(booking: CustomerStatsBooking): Date | null {
  if (!booking.date) return null;
  const time = booking.time && booking.time.length >= 5 ? booking.time.slice(0, 5) : "00:00";
  const instant = new Date(`${booking.date}T${time}:00Z`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

function createdAtMs(booking: CustomerStatsBooking): number {
  if (!booking.createdAt) return 0;
  const value = new Date(booking.createdAt).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function spendMinor(booking: CustomerStatsBooking, status: string): number {
  if (!CONFIRMED_STATUSES.has(status)) return 0;
  if (booking.paymentStatus === "refunded") return 0;

  if (typeof booking.amountPaidCents === "number" && Number.isFinite(booking.amountPaidCents)) {
    const refunded =
      typeof booking.amountRefundedCents === "number" ? booking.amountRefundedCents : 0;
    return Math.max(0, Math.round(booking.amountPaidCents - refunded));
  }

  // Unpaid upcoming rides are not spend; completed rides (incl. cash) are.
  if (booking.paymentStatus !== "completed" && status !== "completed") return 0;
  if (typeof booking.totalAmount === "number" && Number.isFinite(booking.totalAmount)) {
    return Math.max(0, Math.round(booking.totalAmount * 100));
  }
  if (typeof booking.cashCollected === "number" && Number.isFinite(booking.cashCollected)) {
    return Math.max(0, Math.round(booking.cashCollected * 100));
  }
  return 0;
}

function emptyRow(emailLower: string, currency: string): CustomerStatsAggregate {
  return {
    emailLower,
    name: "",
    phoneDigits: "",
    verifiedPhone: "",
    rideCount: 0,
    completedCount: 0,
    totalSpendMinor: 0,
    currency,
    firstRideAt: null,
    lastRideAt: null,
    hasUpcoming: false,
    locale: "",
    latestBookingAt: 0,
  };
}

/** Pure reducer: bookings in, one stats row per lowercased email (no DB access). */
export function aggregateCustomerStats(
  bookings: CustomerStatsBooking[],
  currency: string,
): CustomerStatsAggregate[] {
  const rows = new Map<string, CustomerStatsAggregate>();

  for (const booking of bookings) {
    const emailLower = statsEmailKey(booking.email);
    if (!emailLower) continue;

    const row = rows.get(emailLower) ?? emptyRow(emailLower, currency);
    const status = booking.status ?? "upcoming";

    if (CONFIRMED_STATUSES.has(status)) row.rideCount += 1;
    if (status === "completed") {
      row.completedCount += 1;
      const instant = rideInstant(booking);
      if (instant) {
        if (!row.firstRideAt || instant < row.firstRideAt) row.firstRideAt = instant;
        if (!row.lastRideAt || instant > row.lastRideAt) row.lastRideAt = instant;
      }
    }
    if (status === "upcoming") row.hasUpcoming = true;
    row.totalSpendMinor += spendMinor(booking, status);

    const created = createdAtMs(booking);
    if (created >= row.latestBookingAt) {
      row.latestBookingAt = created;
      row.name =
        `${booking.firstName ?? ""} ${booking.lastName ?? ""}`.trim() || row.name;
      row.phoneDigits = digitsOnly(booking.phone) || row.phoneDigits;
      row.locale = booking.locale || row.locale;
    }

    rows.set(emailLower, row);
  }

  return [...rows.values()].sort((a, b) => a.emailLower.localeCompare(b.emailLower));
}

/** Merge independently aggregated chunks without losing counters or the latest identity. */
export function mergeCustomerStats(
  target: Map<string, CustomerStatsAggregate>,
  rows: CustomerStatsAggregate[],
): void {
  for (const row of rows) {
    const existing = target.get(row.emailLower);
    if (!existing) {
      target.set(row.emailLower, { ...row });
      continue;
    }
    existing.rideCount += row.rideCount;
    existing.completedCount += row.completedCount;
    existing.totalSpendMinor += row.totalSpendMinor;
    existing.hasUpcoming = existing.hasUpcoming || row.hasUpcoming;
    if (row.firstRideAt && (!existing.firstRideAt || row.firstRideAt < existing.firstRideAt)) {
      existing.firstRideAt = row.firstRideAt;
    }
    if (row.lastRideAt && (!existing.lastRideAt || row.lastRideAt > existing.lastRideAt)) {
      existing.lastRideAt = row.lastRideAt;
    }
    if (row.latestBookingAt >= existing.latestBookingAt) {
      existing.latestBookingAt = row.latestBookingAt;
      existing.name = row.name || existing.name;
      existing.phoneDigits = row.phoneDigits || existing.phoneDigits;
      existing.locale = row.locale || existing.locale;
    }
  }
}

export function toCustomerStatsRow(row: CustomerStatsAggregate): CustomerStatsRow {
  return {
    emailLower: row.emailLower,
    name: row.name,
    phoneDigits: row.phoneDigits,
    verifiedPhone: row.verifiedPhone,
    rideCount: row.rideCount,
    completedCount: row.completedCount,
    totalSpendMinor: row.totalSpendMinor,
    currency: row.currency,
    firstRideAt: row.firstRideAt,
    lastRideAt: row.lastRideAt,
    hasUpcoming: row.hasUpcoming,
    locale: row.locale,
  };
}
