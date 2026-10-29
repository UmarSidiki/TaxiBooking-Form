import {
  notificationLocales,
  type LocalizedTemplates,
  type NotificationEventDefinition,
} from "@/features/notifications/notification-types";
import {
  bookingCancelledTemplates,
  bookingChangedTemplates,
  bookingConfirmedTemplates,
  customerPickupReminderTemplates,
  quotePayLinkTemplates,
  requestDeclinedTemplates,
  requestReceivedTemplates,
  thankYouTemplates,
} from "@/features/notifications/defaults/customer-booking-events";
import {
  arrivedTemplates,
  completedTemplates,
  driverAssignedTemplates,
  invoiceNoticeTemplates,
  onTheWayTemplates,
  signInOtpTemplates,
} from "@/features/notifications/defaults/customer-ride-events";
import {
  documentExpiryTemplates,
  partnerSettlementTemplates,
  pickupReminderTemplates,
  rideAssignedTemplates,
  rideAvailableTemplates,
  rideCancelledTemplates,
  rideChangedTemplates,
} from "@/features/notifications/defaults/assignee-events";
import { emailDefaults } from "@/features/emails/defaults";
import type { EmailEventKey } from "@/features/emails/types";

export const notificationEventKeys = [
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

export type NotificationEventKey = (typeof notificationEventKeys)[number];

const customer = ["customer"] as const;
const assignees = ["driver", "partner"] as const;
const desk = ["desk"] as const;
const partner = ["partner"] as const;
const whatsapp = ["whatsapp"] as const;
const emailOnly = ["email"] as const;
const whatsappAndEmail = ["whatsapp", "email"] as const;

function emailTemplatesFor(key: EmailEventKey): LocalizedTemplates {
  const defaults = emailDefaults(key);
  return Object.fromEntries(
    Object.entries(defaults).map(([locale, copy]) => [
      locale,
      { subject: copy.subject, body: copy.intro },
    ]),
  ) as LocalizedTemplates;
}

function event(
  key: NotificationEventKey,
  audiences: NotificationEventDefinition["audiences"],
  channels: NotificationEventDefinition["channels"],
  variables: string[],
  templates: NotificationEventDefinition["templates"],
  extra: Partial<NotificationEventDefinition> = {}
): NotificationEventDefinition {
  return {
    key,
    audiences,
    channels,
    variables,
    templates,
    emailTemplates: emailTemplatesFor(key as EmailEventKey),
    ...extra,
  };
}

const noWhatsAppTemplates = Object.fromEntries(
  notificationLocales.map((locale) => [locale, { body: "" }]),
) as LocalizedTemplates;

export const NOTIFICATION_EVENTS: Record<NotificationEventKey, NotificationEventDefinition> = {
  booking_confirmed: event(
    "booking_confirmed", ["customer", "desk"], whatsappAndEmail,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "vehicle", "total", "passengers", "companyPhone", "portal", "portalUrl"],
    bookingConfirmedTemplates,
  ),
  driver_assigned: event(
    "driver_assigned", customer, whatsappAndEmail,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "vehicle", "plate", "driver", "statusUrl"],
    driverAssignedTemplates,
  ),
  on_the_way: event("on_the_way", customer, whatsappAndEmail, ["name", "tripId", "driver", "statusUrl"], onTheWayTemplates),
  arrived: event("arrived", customer, whatsappAndEmail, ["name", "tripId"], arrivedTemplates),
  completed: event("completed", customer, whatsappAndEmail, ["name", "tripId"], completedTemplates),
  booking_cancelled: event("booking_cancelled", customer, whatsappAndEmail, ["name", "tripId"], bookingCancelledTemplates),
  booking_changed: event("booking_changed", customer, whatsappAndEmail, ["name", "tripId", "pickup", "date", "time"], bookingChangedTemplates),
  request_received: event("request_received", customer, whatsappAndEmail, ["name", "tripId"], requestReceivedTemplates),
  request_declined: event("request_declined", customer, whatsappAndEmail, ["name", "tripId", "reason"], requestDeclinedTemplates),
  quote_pay_link: event("quote_pay_link", customer, whatsappAndEmail, ["name", "tripId", "payUrl"], quotePayLinkTemplates),
  thank_you: event("thank_you", customer, whatsappAndEmail, ["name", "tripId", "reviewUrl"], thankYouTemplates),
  customer_pickup_reminder: event(
    "customer_pickup_reminder", customer, whatsappAndEmail, ["name", "tripId", "pickup", "date", "time"],
    customerPickupReminderTemplates,
  ),
  invoice_notice: event(
    "invoice_notice", customer, whatsappAndEmail, ["name", "tripId", "total", "invoiceNumber"],
    invoiceNoticeTemplates, { defaultEnabled: { whatsapp: false, email: true } },
  ),
  sign_in_otp: event(
    "sign_in_otp", customer, whatsappAndEmail, ["code"],
    signInOtpTemplates, { defaultEnabled: { whatsapp: false, email: true } },
  ),
  ride_assigned: event(
    "ride_assigned", assignees, whatsappAndEmail, ["tripId", "pickup", "date", "time"], rideAssignedTemplates,
  ),
  ride_available: event(
    "ride_available", assignees, whatsappAndEmail, ["tripId", "pickup", "date", "time"], rideAvailableTemplates,
  ),
  ride_changed: event(
    "ride_changed", assignees, whatsappAndEmail, ["tripId", "pickup", "date", "time"], rideChangedTemplates,
  ),
  ride_cancelled: event(
    "ride_cancelled", assignees, whatsappAndEmail, ["tripId", "pickup", "date", "time"], rideCancelledTemplates,
  ),
  pickup_reminder: event(
    "pickup_reminder", assignees, whatsappAndEmail, ["tripId", "pickup", "date", "time"], pickupReminderTemplates,
    { timing: { hoursBefore: 24 } },
  ),
  partner_settlement: event(
    "partner_settlement", partner, whatsappAndEmail, ["total", "currency"], partnerSettlementTemplates,
  ),
  document_expiry: event(
    "document_expiry", desk, whatsappAndEmail, ["documents"], documentExpiryTemplates,
    { defaultEnabled: { whatsapp: true, email: true } },
  ),
  new_booking_alert: event(
    "new_booking_alert", desk, emailOnly,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "vehicle", "total", "passengers"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  new_request_alert: event(
    "new_request_alert", desk, emailOnly,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "vehicle", "total", "duration"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  trip_change_admin: event(
    "trip_change_admin", desk, emailOnly,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "total"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  quote_follow_up: event(
    "quote_follow_up", customer, emailOnly,
    ["name", "tripId", "pickup", "date", "time"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  partner_registered: event(
    "partner_registered", desk, emailOnly,
    ["name", "email", "phone", "city", "country"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  partner_approved: event(
    "partner_approved", partner, emailOnly, ["name"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  partner_rejected: event(
    "partner_rejected", partner, emailOnly, ["name", "reason"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  partner_suspended: event(
    "partner_suspended", partner, emailOnly, ["name", "reason"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  fleet_requested: event(
    "fleet_requested", desk, emailOnly,
    ["partnerName", "partnerEmail", "vehicleName", "vehicleCategory"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  fleet_approved: event(
    "fleet_approved", partner, emailOnly,
    ["partnerName", "vehicleName", "vehicleCategory"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  fleet_rejected: event(
    "fleet_rejected", partner, emailOnly,
    ["partnerName", "vehicleName", "vehicleCategory", "reason"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  corporate_statement: event(
    "corporate_statement", customer, emailOnly, ["name", "month", "total"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  password_reset_otp: event(
    "password_reset_otp", customer, emailOnly, ["code", "name"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
  smtp_test: event(
    "smtp_test", desk, emailOnly, ["time"],
    noWhatsAppTemplates, { defaultEnabled: { email: true } },
  ),
};

export function notificationEvent(key: string): NotificationEventDefinition | null {
  return (NOTIFICATION_EVENTS as Record<string, NotificationEventDefinition>)[key] ?? null;
}

export function isNotificationEventKey(key: string): key is NotificationEventKey {
  return key in NOTIFICATION_EVENTS;
}
