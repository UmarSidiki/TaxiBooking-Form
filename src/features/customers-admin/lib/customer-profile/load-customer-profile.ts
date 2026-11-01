import { toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import {
  findCustomerBookings,
  findCustomerProfile,
  findCustomerStats,
  PROFILE_BOOKINGS_LIMIT,
} from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import {
  findCustomerSessions,
  findLastWhatsAppSend,
  findRideCharges,
} from "@/features/customers-admin/lib/customer-profile/customer-profile-signals.repo";
import {
  digitsOf,
  headerFor,
  toBookingRow,
  toSessionRows,
} from "@/features/customers-admin/lib/customer-profile/customer-profile-mappers";
import {
  bookingPayments,
  chargePayments,
} from "@/features/customers-admin/lib/customer-profile/customer-profile-payments";
import { iso } from "@/features/customers-admin/lib/customer-profile/customer-profile-time";
import type {
  CustomerProfilePayload,
  CustomerWhatsAppInfo,
} from "@/features/customers-admin/lib/customer-profile/customer-profile.types";
import type { ProfileCustomerDoc } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";

async function whatsappFor(
  profile: ProfileCustomerDoc | null,
  consent: CustomerWhatsAppInfo["consent"],
): Promise<CustomerWhatsAppInfo> {
  const verifiedPhone = digitsOf(profile?.verifiedPhone);
  const lastSend =
    verifiedPhone.length >= 8
      ? await findLastWhatsAppSend(toWhatsAppJid(verifiedPhone))
      : null;
  return {
    verifiedPhone,
    verifiedAt: iso(profile?.verifiedPhoneAt),
    consent,
    lastSend: lastSend
      ? {
          at: iso(lastSend.createdAt) ?? "",
          status: lastSend.status,
          kind: lastSend.kind,
        }
      : null,
  };
}

/**
 * Loads the admin customer profile. Returns null when no customer record exists.
 * Single-tenant deployment: the email is the only scoping key.
 */
export async function loadCustomerProfile(
  emailRaw: string,
): Promise<CustomerProfilePayload | null> {
  const emailLower = emailRaw.trim().toLowerCase();
  const [stats, profile, bookingDocs] = await Promise.all([
    findCustomerStats(emailLower),
    findCustomerProfile(emailLower),
    findCustomerBookings(emailLower),
  ]);
  if (!stats && !profile && bookingDocs.length === 0) return null;

  const bookingsCapped = bookingDocs.length > PROFILE_BOOKINGS_LIMIT;
  const bookings = bookingsCapped
    ? bookingDocs.slice(0, PROFILE_BOOKINGS_LIMIT)
    : bookingDocs;
  const tripIds = bookings.map((booking) => booking.tripId).filter(Boolean);
  const header = headerFor(emailLower, stats, profile, bookings);

  const [sessions, charges, whatsapp] = await Promise.all([
    findCustomerSessions(emailLower),
    findRideCharges(tripIds),
    whatsappFor(profile, header.whatsappConsent),
  ]);

  const payments = [...bookingPayments(bookings), ...chargePayments(charges)];
  payments.sort((left, right) => (right.at ?? "").localeCompare(left.at ?? ""));

  return {
    header,
    bookings: bookings.map(toBookingRow),
    bookingsCapped,
    payments,
    sessions: toSessionRows(sessions),
    whatsapp,
  };
}
