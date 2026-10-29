import type { NotificationEventDefinition } from "@/features/notifications/notification-types";
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
] as const;

export type NotificationEventKey = (typeof notificationEventKeys)[number];

const customer = ["customer"] as const;
const assignees = ["driver", "partner"] as const;
const desk = ["desk"] as const;
const whatsapp = ["whatsapp"] as const;
const whatsappAndEmail = ["whatsapp", "email"] as const;

function event(
  key: NotificationEventKey,
  audiences: NotificationEventDefinition["audiences"],
  channels: NotificationEventDefinition["channels"],
  variables: string[],
  templates: NotificationEventDefinition["templates"],
  extra: Partial<NotificationEventDefinition> = {}
): NotificationEventDefinition {
  return { key, audiences, channels, variables, templates, ...extra };
}

export const NOTIFICATION_EVENTS: Record<NotificationEventKey, NotificationEventDefinition> = {
  booking_confirmed: event(
    "booking_confirmed", ["customer", "desk"], whatsapp,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "vehicle", "total", "passengers", "companyPhone", "portal", "portalUrl"],
    bookingConfirmedTemplates,
  ),
  driver_assigned: event(
    "driver_assigned", customer, whatsapp,
    ["name", "tripId", "pickup", "dropoff", "date", "time", "vehicle", "plate", "driver", "statusUrl"],
    driverAssignedTemplates,
  ),
  on_the_way: event("on_the_way", customer, whatsapp, ["name", "tripId", "driver", "statusUrl"], onTheWayTemplates),
  arrived: event("arrived", customer, whatsapp, ["name", "tripId"], arrivedTemplates),
  completed: event("completed", customer, whatsapp, ["name", "tripId"], completedTemplates),
  booking_cancelled: event("booking_cancelled", customer, whatsapp, ["name", "tripId"], bookingCancelledTemplates),
  booking_changed: event("booking_changed", customer, whatsapp, ["name", "tripId", "pickup", "date", "time"], bookingChangedTemplates),
  request_received: event("request_received", customer, whatsapp, ["name", "tripId"], requestReceivedTemplates),
  request_declined: event("request_declined", customer, whatsapp, ["name", "tripId", "reason"], requestDeclinedTemplates),
  quote_pay_link: event("quote_pay_link", customer, whatsapp, ["name", "tripId", "payUrl"], quotePayLinkTemplates),
  thank_you: event("thank_you", customer, whatsapp, ["name", "tripId", "reviewUrl"], thankYouTemplates),
  customer_pickup_reminder: event(
    "customer_pickup_reminder", customer, whatsapp, ["name", "tripId", "pickup", "date", "time"],
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
    "ride_assigned", assignees, whatsapp, ["tripId", "pickup", "date", "time"], rideAssignedTemplates,
  ),
  ride_available: event(
    "ride_available", assignees, whatsapp, ["tripId", "pickup", "date", "time"], rideAvailableTemplates,
  ),
  ride_changed: event(
    "ride_changed", assignees, whatsapp, ["tripId", "pickup", "date", "time"], rideChangedTemplates,
  ),
  ride_cancelled: event(
    "ride_cancelled", assignees, whatsapp, ["tripId", "pickup", "date", "time"], rideCancelledTemplates,
  ),
  pickup_reminder: event(
    "pickup_reminder", assignees, whatsapp, ["tripId", "pickup", "date", "time"], pickupReminderTemplates,
    { timing: { hoursBefore: 24 } },
  ),
  partner_settlement: event(
    "partner_settlement", ["partner"], whatsapp, ["total", "currency"], partnerSettlementTemplates,
  ),
  document_expiry: event(
    "document_expiry", desk, whatsappAndEmail, ["documents"], documentExpiryTemplates,
    { defaultEnabled: { whatsapp: true, email: true } },
  ),
};

export function notificationEvent(key: string): NotificationEventDefinition | null {
  return (NOTIFICATION_EVENTS as Record<string, NotificationEventDefinition>)[key] ?? null;
}

export function isNotificationEventKey(key: string): key is NotificationEventKey {
  return key in NOTIFICATION_EVENTS;
}
