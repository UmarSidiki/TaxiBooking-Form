import type {
  ProfileBookingDoc,
  ProfileCustomerDoc,
  ProfileStatsDoc,
} from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import type { ProfileSessionDoc } from "@/features/customers-admin/lib/customer-profile/customer-profile-signals.repo";
import {
  paidMinor,
  refundedMinor,
  toMinor,
} from "@/features/customers-admin/lib/customer-profile/customer-profile-payments";
import { iso } from "@/features/customers-admin/lib/customer-profile/customer-profile-time";
import { marketingStatusFromProfile } from "@/features/marketing/lib/consent/marketing-consent.types";
import type {
  CustomerBookingRow,
  CustomerProfileHeader,
  CustomerSessionRow,
} from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

export function digitsOf(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function toBookingRow(booking: ProfileBookingDoc): CustomerBookingRow {
  return {
    id: String(booking._id),
    tripId: booking.tripId,
    date: booking.date,
    time: booking.time,
    pickup: booking.pickup ?? "",
    dropoff: booking.dropoff ?? "",
    status: booking.status || "upcoming",
    paymentStatus: booking.paymentStatus || "pending",
    paymentMethod: booking.paymentMethod || "",
    totalMinor: toMinor(booking.totalAmount),
    paidMinor: paidMinor(booking),
    refundedMinor: refundedMinor(booking),
    createdAt: iso(booking.createdAt),
  };
}

export function toSessionRows(sessions: ProfileSessionDoc[]): CustomerSessionRow[] {
  const now = Date.now();
  return sessions.map((session) => {
    const expired = session.expiresAt.getTime() <= now;
    return {
      id: String(session._id),
      deviceFamily:
        session.uaFamily === "mobile"
          ? "mobile"
          : session.uaFamily === "desktop"
            ? "desktop"
            : "unknown",
      ipPrefix: session.ipPrefix ?? "",
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: iso(session.revokedAt),
      status: session.revokedAt ? "revoked" : expired ? "expired" : "active",
    };
  });
}

export function headerFor(
  emailLower: string,
  stats: ProfileStatsDoc | null,
  profile: ProfileCustomerDoc | null,
  bookings: ProfileBookingDoc[],
): CustomerProfileHeader {
  const verifiedPhone = (profile?.verifiedPhone || stats?.verifiedPhone || "").trim();
  const completed = bookings.filter((row) => row.status === "completed");
  return {
    email: stats?.emailLower || profile?.email || emailLower,
    name: (profile?.name || stats?.name || "").trim(),
    phoneDigits: stats?.phoneDigits || digitsOf(verifiedPhone || profile?.phone),
    verifiedPhone: digitsOf(verifiedPhone),
    locale: stats?.locale || profile?.language || "en",
    rides:
      stats?.rideCount ??
      bookings.filter((row) => row.status !== "canceled").length,
    completedRides: stats?.completedCount ?? completed.length,
    spendMinor:
      stats?.totalSpendMinor ??
      bookings.reduce((sum, row) => sum + paidMinor(row) - refundedMinor(row), 0),
    currency: stats?.currency || "EUR",
    firstRideAt: iso(stats?.firstRideAt),
    lastRideAt: iso(stats?.lastRideAt),
    hasUpcoming: stats?.hasUpcoming ?? false,
    emailConsent: stats?.emailConsent ?? marketingStatusFromProfile(profile, "email"),
    whatsappConsent:
      stats?.whatsappConsent ?? marketingStatusFromProfile(profile, "whatsapp"),
  };
}
