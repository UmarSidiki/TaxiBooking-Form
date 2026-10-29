export const emailLocales = [
  "en",
  "fr",
  "es",
  "de",
  "nl",
  "it",
  "ru",
  "ar",
] as const;

export type EmailLocale = (typeof emailLocales)[number];

export function emailLocale(value?: string | null): EmailLocale {
  return emailLocales.includes(value as EmailLocale)
    ? (value as EmailLocale)
    : "en";
}

export const emailEventKeys = [
  "booking_confirmed",
  "driver_assigned",
  "on_the_way",
  "arrived",
  "completed",
  "booking_cancelled",
  "booking_changed",
  "request_received",
  "request_declined",
  "quote_pay_link",
  "thank_you",
  "customer_pickup_reminder",
  "invoice_notice",
  "sign_in_otp",
  "ride_assigned",
  "ride_available",
  "ride_changed",
  "ride_cancelled",
  "pickup_reminder",
  "partner_settlement",
  "document_expiry",
  "new_booking_alert",
  "new_request_alert",
  "trip_change_admin",
  "quote_follow_up",
  "partner_registered",
  "partner_approved",
  "partner_rejected",
  "partner_suspended",
  "fleet_requested",
  "fleet_approved",
  "fleet_rejected",
  "corporate_statement",
  "password_reset_otp",
  "smtp_test",
] as const;

export type EmailEventKey = (typeof emailEventKeys)[number];

export type EmailTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type EmailBrand = {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  supportEmail: string;
  websiteUrl: string | null;
};

export type EmailTrip = {
  tripId: string;
  pickup: string;
  dropoff?: string | null;
  stops?: Array<{ location: string }>;
  date: string;
  time: string;
  returnDate?: string | null;
  returnTime?: string | null;
  vehicle?: string | null;
  passengers?: string | number | null;
  childSeats?: number;
  babySeats?: number;
  flightNumber?: string | null;
  duration?: number | null;
  bookingType?: string | null;
};

export type EmailPriceRow = { label: string; value: string };

export type EmailDetail = { label: string; value: string };

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type EmailCopy = { subject: string; intro: string };

export type LocalizedEmailCopy = Record<EmailLocale, EmailCopy>;
