import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";

import { emailDefaultCopy } from "@/features/emails/defaults";
import { sampleBrand } from "@/features/emails/lib/sample-brand";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import { renderEmail } from "@/features/emails/lib/render-email";
import { AssigneeEmail } from "@/features/emails/templates/assignee-email";
import { BookingConfirmedEmail } from "@/features/emails/templates/booking-confirmed-email";
import { buildNotificationEmail } from "@/features/emails/templates/build-notification-email";
import { CancellationEmail } from "@/features/emails/templates/cancellation-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import { OtpEmail } from "@/features/emails/templates/otp-email";
import { RequestEmail } from "@/features/emails/templates/request-email";
import { ThankYouEmail } from "@/features/emails/templates/thank-you-email";
import type { EmailDetail, EmailEventKey, EmailPriceRow, EmailTrip } from "@/features/emails/types";

const OUT_DIR = "/workspace/shots/emails";
const t = emailTranslator("en");

const trip: EmailTrip = {
  tripId: "T-10482",
  pickup: "Geneva Airport, Terminal 1",
  dropoff: "Hôtel Beau-Rivage, Quai du Mont-Blanc 13, Genève",
  stops: [{ location: "Gare Cornavin, Place de Montbrillant" }],
  date: "2026-11-04",
  time: "14:30",
  vehicle: "Mercedes E-Class",
  passengers: 2,
  childSeats: 1,
  flightNumber: "LX 2814",
};

const priceRows: EmailPriceRow[] = [
  { label: t("total"), value: "CHF 150.00" },
  { label: t("tax_included", { percent: 8.1 }), value: "CHF 11.24" },
  { label: t("payment_method"), value: "Stripe card" },
  { label: t("payment_status"), value: "Paid" },
];

const manageUrl = "https://example.com/en/account?token=sample-token";
const reviewUrl = "https://example.com/en/review?bookingId=abc123";
const payUrl = "https://example.com/en/pay/sample-token";
const deskUrl = "https://example.com/en/dashboard/rides?bookingId=abc123";

function copy(event: EmailEventKey, values: Record<string, string> = {}) {
  return emailDefaultCopy(event, "en", { tripId: trip.tripId, ...values });
}

function notice(
  event: EmailEventKey,
  extra: {
    status?: { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" };
    details?: EmailDetail[];
    message?: string;
    cta?: { url?: string | null; label: string } | null;
    prices?: EmailPriceRow[];
    withTrip?: boolean;
  } = {},
  values: Record<string, string> = {},
) {
  const subject = copy(event, values);
  return (
    <NoticeEmail
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={subject.subject}
      intro={subject.intro}
      manageUrl={manageUrl}
      status={extra.status}
      trip={extra.withTrip ? trip : null}
      priceRows={extra.prices}
      details={extra.details}
      message={extra.message}
      cta={extra.cta}
    />
  );
}

const bookingCopy = copy("booking_confirmed", { name: "Ada Lovelace" });
const thankYouCopy = copy("thank_you", { name: "Ada Lovelace" });
const cancelCopy = copy("booking_cancelled", { name: "Ada Lovelace" });
const receivedCopy = copy("request_received", { name: "Ada Lovelace" });
const declinedCopy = copy("request_declined", { name: "Ada Lovelace", reason: "No vehicle available." });
const quoteCopy = copy("quote_pay_link", { name: "Ada Lovelace", amount: "CHF 162.15" });
const assignedCopy = copy("ride_assigned");
const availableCopy = copy("ride_available");
const cancelledCopy = copy("ride_cancelled");

const emails: Array<[string, ReactElement]> = [
  [
    "booking-confirmed",
    <BookingConfirmedEmail
    key="booking-confirmed"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={bookingCopy.subject}
      intro={bookingCopy.intro}
      trip={trip}
      priceRows={priceRows}
      manageUrl={manageUrl}
      invoiceUrl="https://example.com/api/invoice/T-10482"
      invoiceAttached
      notes="Please meet the driver at arrivals gate 3."
    />,
  ],
  [
    "thank-you",
    <ThankYouEmail
    key="thank-you"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={thankYouCopy.subject}
      intro={thankYouCopy.intro}
      trip={trip}
      reviewUrl={reviewUrl}
      manageUrl={manageUrl}
    />,
  ],
  [
    "cancellation",
    <CancellationEmail
    key="cancellation"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={cancelCopy.subject}
      intro={cancelCopy.intro}
      trip={trip}
      priceRows={[
        { label: t("total"), value: "CHF 162.15" },
        { label: t("refund_amount"), value: "CHF 162.15" },
        { label: t("refund_percentage"), value: "100%" },
      ]}
      details={[{ label: t("cancelled_at"), value: "2026-11-01 09:12" }]}
      manageUrl={manageUrl}
    />,
  ],
  [
    "request-received",
    <RequestEmail
    key="request-received"
      variant="received"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={receivedCopy.subject}
      intro={receivedCopy.intro}
      trip={trip}
      priceRows={priceRows}
      manageUrl={manageUrl}
    />,
  ],
  [
    "request-declined",
    <RequestEmail
    key="request-declined"
      variant="declined"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={declinedCopy.subject}
      intro={declinedCopy.intro}
      trip={trip}
      note="No vehicle available."
      manageUrl={manageUrl}
    />,
  ],
  [
    "quote-pay-link",
    <RequestEmail
    key="quote-pay-link"
      variant="quote"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={quoteCopy.subject}
      intro={quoteCopy.intro}
      trip={trip}
      priceRows={priceRows}
      payUrl={payUrl}
      payLabel={t("pay_cta", { amount: "CHF 162.15" })}
      manageUrl={manageUrl}
    />,
  ],
  [
    "new-booking-alert",
    notice("new_booking_alert", {
      status: { label: t("status_confirmed"), tone: "info" },
      withTrip: true,
      details: [
        { label: t("customer"), value: "Ada Lovelace" },
        { label: t("email"), value: "ada@example.com" },
        { label: t("phone"), value: "+41 79 000 00 00" },
      ],
      prices: priceRows,
      cta: { url: deskUrl, label: t("open_desk") },
    }),
  ],
  [
    "new-request-alert",
    notice("new_request_alert", {
      status: { label: t("status_pending"), tone: "warning" },
      withTrip: true,
      details: [
        { label: t("customer"), value: "Ada Lovelace" },
        { label: t("email"), value: "ada@example.com" },
        { label: t("phone"), value: "+41 79 000 00 00" },
      ],
      prices: priceRows,
      cta: { url: deskUrl, label: t("open_desk") },
    }),
  ],
  [
    "trip-change-admin",
    notice("trip_change_admin", {
      status: { label: t("status_pending"), tone: "warning" },
      withTrip: true,
      details: [
        { label: t("customer"), value: "Ada Lovelace" },
        { label: t("email"), value: "ada@example.com" },
      ],
      cta: { url: deskUrl, label: t("open_desk") },
    }),
  ],
  [
    "ride-assigned",
    <AssigneeEmail
    key="ride-assigned"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={assignedCopy.subject}
      intro={assignedCopy.intro}
      trip={trip}
      status={{ label: t("status_assigned"), tone: "info" }}
      details={[
        { label: t("passenger"), value: "Ada Lovelace" },
        { label: t("contact"), value: "+41 79 000 00 00" },
      ]}
      priceRows={[{ label: t("total"), value: "CHF 162.15" }]}
      cta={{ url: deskUrl, label: t("view_ride") }}
    />,
  ],
  [
    "ride-available",
    <AssigneeEmail
    key="ride-available"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={availableCopy.subject}
      intro={availableCopy.intro}
      trip={trip}
      status={{ label: t("status_available"), tone: "info" }}
      priceRows={[{ label: t("your_earnings"), value: "CHF 120.00" }]}
      cta={{ url: deskUrl, label: t("view_ride") }}
    />,
  ],
  [
    "ride-cancelled",
    <AssigneeEmail
    key="ride-cancelled"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={cancelledCopy.subject}
      intro={cancelledCopy.intro}
      trip={trip}
      status={{ label: t("status_cancelled"), tone: "danger" }}
      details={[{ label: t("customer"), value: "Ada Lovelace" }]}
    />,
  ],
  [
    "partner-approved",
    notice("partner_approved", {
      status: { label: t("status_approved"), tone: "success" },
      details: [{ label: t("name"), value: "Alpine Chauffeurs" }],
      cta: { url: "https://example.com/en/partners/dashboard", label: t("partner_dashboard") },
    }),
  ],
  [
    "partner-rejected",
    notice("partner_rejected", {
      status: { label: t("status_rejected"), tone: "danger" },
      details: [{ label: t("name"), value: "Alpine Chauffeurs" }],
      message: "Documents were incomplete.",
    }),
  ],
  [
    "partner-suspended",
    notice("partner_suspended", {
      status: { label: t("status_suspended"), tone: "warning" },
      details: [{ label: t("name"), value: "Alpine Chauffeurs" }],
      message: "Contact support to appeal.",
    }),
  ],
  [
    "partner-registered",
    notice("partner_registered", {
      status: { label: t("status_pending"), tone: "warning" },
      details: [
        { label: t("name"), value: "Alpine Chauffeurs" },
        { label: t("email"), value: "ops@alpine.example" },
        { label: t("phone"), value: "+41 22 000 00 00" },
      ],
      cta: { url: "https://example.com/en/dashboard/partners", label: t("open_desk") },
    }),
  ],
  [
    "fleet-requested",
    notice("fleet_requested", {
      status: { label: t("status_pending"), tone: "warning" },
      details: [
        { label: t("name"), value: "Alpine Chauffeurs" },
        { label: t("vehicle"), value: "Mercedes V-Class" },
      ],
      cta: { url: "https://example.com/en/dashboard/partners", label: t("open_desk") },
    }),
  ],
  [
    "fleet-approved",
    notice("fleet_approved", {
      status: { label: t("status_approved"), tone: "success" },
      details: [{ label: t("vehicle"), value: "Mercedes V-Class" }],
      cta: { url: "https://example.com/en/partners/dashboard", label: t("partner_dashboard") },
    }),
  ],
  [
    "fleet-rejected",
    notice("fleet_rejected", {
      status: { label: t("status_rejected"), tone: "danger" },
      details: [{ label: t("vehicle"), value: "Mercedes V-Class" }],
      message: "Insurance document expired.",
      cta: { url: "https://example.com/en/partners/fleet", label: t("submit_request") },
    }),
  ],
  [
    "otp-sign-in",
    <OtpEmail
    key="otp-sign-in"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={copy("sign_in_otp").subject}
      intro={copy("sign_in_otp").intro}
      code="482913"
    />,
  ],
  [
    "otp-password-reset",
    <OtpEmail
    key="otp-password-reset"
      t={t}
      brand={sampleBrand}
      locale="en"
      subject={copy("password_reset_otp").subject}
      intro={copy("password_reset_otp").intro}
      code="731044"
    />,
  ],
  [
    "invoice-notice",
    notice(
      "invoice_notice",
      {
        status: { label: t("status_confirmed"), tone: "info" },
        details: [
          { label: t("invoice_number"), value: "INV-2026-0042" },
          { label: t("amount"), value: "CHF 162.15" },
        ],
        cta: { url: manageUrl, label: t("manage_booking") },
      },
      { invoiceNumber: "INV-2026-0042" },
    ),
  ],
  [
    "statement",
    notice(
      "corporate_statement",
      {
        status: { label: t("status_confirmed"), tone: "info" },
        details: [
          { label: t("name"), value: "Acme Europe SA" },
          { label: t("month"), value: "2026-10" },
          { label: t("total"), value: "CHF 4,210.00" },
        ],
        message: "The statement PDF is attached.",
      },
      { month: "2026-10" },
    ),
  ],
  [
    "quote-follow-up",
    notice("quote_follow_up", {
      status: { label: t("status_pending"), tone: "warning" },
      withTrip: true,
    }),
  ],
  [
    "document-expiry",
    notice("document_expiry", {
      status: { label: t("status_pending"), tone: "warning" },
      message: "Driver Marco Rossi\nVehicle Mercedes V-Class",
    }),
  ],
  [
    "smtp-test",
    notice("smtp_test", {
      status: { label: t("status_confirmed"), tone: "info" },
      message: t("smtp_test_time", { time: "2026-10-29T12:00:00.000Z" }),
    }),
  ],
  [
    "driver-assigned",
    buildNotificationEmail({
      event: "driver_assigned",
      copy: copy("driver_assigned", { name: "Ada Lovelace", driver: "Marco Rossi", vehicle: "Mercedes E-Class" }),
      brand: sampleBrand,
      locale: "en",
      variables: {
        tripId: trip.tripId,
        pickup: trip.pickup,
        dropoff: trip.dropoff,
        date: trip.date,
        time: trip.time,
        vehicle: trip.vehicle,
        driver: "Marco Rossi",
        statusUrl: "https://example.com/en/ride-status?tripId=T-10482",
        portal: manageUrl,
      },
      manageUrl,
    }),
  ],
  [
    "on-the-way",
    buildNotificationEmail({
      event: "on_the_way",
      copy: copy("on_the_way", { name: "Ada Lovelace" }),
      brand: sampleBrand,
      locale: "en",
      variables: {
        tripId: trip.tripId,
        pickup: trip.pickup,
        date: trip.date,
        time: trip.time,
        statusUrl: "https://example.com/en/ride-status?tripId=T-10482",
        portal: manageUrl,
      },
      manageUrl,
    }),
  ],
  [
    "arrived",
    buildNotificationEmail({
      event: "arrived",
      copy: copy("arrived", { name: "Ada Lovelace" }),
      brand: sampleBrand,
      locale: "en",
      variables: {
        tripId: trip.tripId,
        pickup: trip.pickup,
        date: trip.date,
        time: trip.time,
        portal: manageUrl,
      },
      manageUrl,
    }),
  ],
  [
    "completed",
    buildNotificationEmail({
      event: "completed",
      copy: copy("completed", { name: "Ada Lovelace" }),
      brand: sampleBrand,
      locale: "en",
      variables: {
        tripId: trip.tripId,
        pickup: trip.pickup,
        date: trip.date,
        time: trip.time,
        reviewUrl,
        portal: manageUrl,
      },
      manageUrl,
    }),
  ],
  [
    "customer-pickup-reminder",
    buildNotificationEmail({
      event: "customer_pickup_reminder",
      copy: copy("customer_pickup_reminder", { name: "Ada Lovelace" }),
      brand: sampleBrand,
      locale: "en",
      variables: {
        tripId: trip.tripId,
        pickup: trip.pickup,
        date: trip.date,
        time: trip.time,
        portal: manageUrl,
      },
      manageUrl,
    }),
  ],
  [
    "partner-settlement",
    buildNotificationEmail({
      event: "partner_settlement",
      copy: copy("partner_settlement"),
      brand: sampleBrand,
      locale: "en",
      variables: { total: "120.00", currency: "CHF" },
    }),
  ],
];

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, element] of emails) {
  const rendered = await renderEmail(element);
  writeFileSync(join(OUT_DIR, `${name}.html`), rendered.html);
  writeFileSync(join(OUT_DIR, `${name}.txt`), rendered.text);
  console.log(`rendered ${name}`);
}
console.log(`${emails.length} emails written to ${OUT_DIR}`);
