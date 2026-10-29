import type { EmailEventKey } from "@/features/emails/types";

type CopyKeys = { subject: string; intro: string };

export const emailCopyKeys: Record<EmailEventKey, CopyKeys> = {
  booking_confirmed: { subject: "subject_booking_confirmed", intro: "intro_booking_confirmed" },
  driver_assigned: { subject: "subject_driver_assigned", intro: "intro_driver_assigned" },
  on_the_way: { subject: "subject_on_the_way", intro: "intro_on_the_way" },
  arrived: { subject: "subject_arrived", intro: "intro_arrived" },
  completed: { subject: "subject_completed", intro: "intro_completed" },
  booking_cancelled: { subject: "subject_booking_cancelled", intro: "intro_booking_cancelled" },
  booking_changed: { subject: "subject_booking_changed", intro: "intro_booking_changed" },
  request_received: { subject: "subject_request_received", intro: "intro_request_received" },
  request_declined: { subject: "subject_request_declined", intro: "intro_request_declined" },
  quote_pay_link: { subject: "subject_quote_pay_link", intro: "intro_quote_pay_link" },
  thank_you: { subject: "subject_thank_you", intro: "intro_thank_you" },
  customer_pickup_reminder: {
    subject: "subject_customer_pickup_reminder",
    intro: "intro_customer_pickup_reminder",
  },
  invoice_notice: { subject: "subject_invoice_notice", intro: "intro_invoice_notice" },
  sign_in_otp: { subject: "subject_sign_in_otp", intro: "intro_sign_in_otp" },
  ride_assigned: { subject: "subject_ride_assigned", intro: "intro_ride_assigned" },
  ride_available: { subject: "subject_ride_available", intro: "intro_ride_available" },
  ride_changed: { subject: "subject_ride_changed", intro: "intro_ride_changed" },
  ride_cancelled: { subject: "subject_ride_cancelled", intro: "intro_ride_cancelled" },
  pickup_reminder: { subject: "subject_pickup_reminder", intro: "intro_pickup_reminder" },
  partner_settlement: {
    subject: "subject_partner_settlement",
    intro: "intro_partner_settlement",
  },
  document_expiry: { subject: "subject_document_expiry", intro: "intro_document_expiry" },
  new_booking_alert: {
    subject: "subject_new_booking_alert",
    intro: "intro_new_booking_alert",
  },
  new_request_alert: {
    subject: "subject_new_request_alert",
    intro: "intro_new_request_alert",
  },
  trip_change_admin: {
    subject: "subject_trip_change_admin",
    intro: "intro_trip_change_admin",
  },
  quote_follow_up: { subject: "subject_quote_follow_up", intro: "intro_quote_follow_up" },
  partner_registered: {
    subject: "subject_partner_registered",
    intro: "intro_partner_registered",
  },
  partner_approved: { subject: "subject_partner_approved", intro: "intro_partner_approved" },
  partner_rejected: { subject: "subject_partner_rejected", intro: "intro_partner_rejected" },
  partner_suspended: {
    subject: "subject_partner_suspended",
    intro: "intro_partner_suspended",
  },
  fleet_requested: { subject: "subject_fleet_requested", intro: "intro_fleet_requested" },
  fleet_approved: { subject: "subject_fleet_approved", intro: "intro_fleet_approved" },
  fleet_rejected: { subject: "subject_fleet_rejected", intro: "intro_fleet_rejected" },
  corporate_statement: {
    subject: "subject_corporate_statement",
    intro: "intro_corporate_statement",
  },
  password_reset_otp: {
    subject: "subject_password_reset_otp",
    intro: "intro_password_reset_otp",
  },
  smtp_test: { subject: "subject_smtp_test", intro: "intro_smtp_test" },
};
