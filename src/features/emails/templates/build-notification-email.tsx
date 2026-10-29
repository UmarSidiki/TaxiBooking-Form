import type { ReactElement } from "react";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import { OtpEmail } from "@/features/emails/templates/otp-email";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import type {
  EmailBrand,
  EmailCopy,
  EmailDetail,
  EmailEventKey,
  EmailPriceRow,
  EmailTrip,
  StatusTone,
} from "@/features/emails/types";

type Vars = Record<string, string | number | null | undefined>;

const STATUS: Partial<Record<EmailEventKey, { key: string; tone: StatusTone }>> = {
  booking_confirmed: { key: "status_confirmed", tone: "success" },
  driver_assigned: { key: "status_assigned", tone: "info" },
  on_the_way: { key: "status_assigned", tone: "info" },
  arrived: { key: "status_assigned", tone: "info" },
  completed: { key: "status_completed", tone: "success" },
  booking_cancelled: { key: "status_cancelled", tone: "danger" },
  request_received: { key: "status_pending", tone: "warning" },
  request_declined: { key: "status_declined", tone: "danger" },
  quote_pay_link: { key: "status_pending", tone: "info" },
  thank_you: { key: "status_completed", tone: "success" },
  customer_pickup_reminder: { key: "status_confirmed", tone: "info" },
  invoice_notice: { key: "status_confirmed", tone: "info" },
  ride_assigned: { key: "status_assigned", tone: "info" },
  ride_available: { key: "status_available", tone: "info" },
  ride_changed: { key: "status_confirmed", tone: "warning" },
  ride_cancelled: { key: "status_cancelled", tone: "danger" },
  pickup_reminder: { key: "status_assigned", tone: "info" },
  partner_settlement: { key: "status_confirmed", tone: "success" },
  document_expiry: { key: "status_pending", tone: "warning" },
  new_booking_alert: { key: "status_confirmed", tone: "info" },
  new_request_alert: { key: "status_pending", tone: "warning" },
  trip_change_admin: { key: "status_pending", tone: "warning" },
  quote_follow_up: { key: "status_pending", tone: "warning" },
  partner_registered: { key: "status_pending", tone: "warning" },
  partner_approved: { key: "status_approved", tone: "success" },
  partner_rejected: { key: "status_rejected", tone: "danger" },
  partner_suspended: { key: "status_suspended", tone: "warning" },
  fleet_requested: { key: "status_pending", tone: "warning" },
  fleet_approved: { key: "status_approved", tone: "success" },
  fleet_rejected: { key: "status_rejected", tone: "danger" },
  corporate_statement: { key: "status_confirmed", tone: "info" },
  smtp_test: { key: "status_confirmed", tone: "info" },
};

function text(value: Vars[string]) {
  return value === null || value === undefined ? "" : String(value);
}

function tripFromVars(vars: Vars): EmailTrip | null {
  const tripId = text(vars.tripId);
  const pickup = text(vars.pickup);
  if (!tripId || !pickup) return null;
  return {
    tripId,
    pickup,
    dropoff: text(vars.dropoff) || null,
    date: text(vars.date),
    time: text(vars.time),
    vehicle: text(vars.vehicle) || null,
    passengers: text(vars.passengers) || null,
    flightNumber: text(vars.flightNumber) || null,
  };
}

function priceRows(vars: Vars, t: ReturnType<typeof emailTranslator>): EmailPriceRow[] {
  const total = text(vars.total);
  if (!total) return [];
  const currency = text(vars.currency);
  return [
    {
      label: t("total"),
      value: currency ? `${currency} ${total}` : total,
    },
  ];
}

function detailsFromVars(event: EmailEventKey, vars: Vars, t: ReturnType<typeof emailTranslator>): EmailDetail[] {
  const rows: EmailDetail[] = [];
  if (event === "invoice_notice") {
    rows.push({ label: t("invoice_number"), value: text(vars.invoiceNumber) });
    const total = text(vars.total);
    if (total) rows.push({ label: t("amount"), value: total });
  }
  if (event === "partner_settlement") {
    const total = text(vars.total);
    const currency = text(vars.currency);
    if (total) rows.push({ label: t("amount"), value: currency ? `${currency} ${total}` : total });
  }
  if (event === "driver_assigned") {
    rows.push({ label: t("vehicle"), value: text(vars.vehicle) });
    rows.push({ label: t("contact"), value: text(vars.driver) });
  }
  if (event === "new_booking_alert" || event === "new_request_alert") {
    rows.push({ label: t("name"), value: text(vars.name) });
  }
  return rows;
}

export function buildNotificationEmail(input: {
  event: EmailEventKey;
  copy: EmailCopy;
  brand: EmailBrand;
  locale: string;
  variables: Vars;
  manageUrl?: string | null;
}): ReactElement {
  const { event, copy, brand, locale, variables, manageUrl } = input;
  const t = emailTranslator(locale);

  if ((event === "sign_in_otp" || event === "password_reset_otp") && variables.code) {
    return (
      <OtpEmail
        t={t}
        brand={brand}
        locale={locale}
        subject={copy.subject}
        intro={copy.intro}
        code={String(variables.code)}
      />
    );
  }

  const status = STATUS[event];
  const trip = tripFromVars(variables);
  const payUrl = text(variables.payUrl);
  const reviewUrl = text(variables.reviewUrl);
  const statusUrl = text(variables.statusUrl);
  const cta = payUrl
    ? { url: payUrl, label: t("pay_cta", { amount: text(variables.total) }) }
    : reviewUrl
      ? { url: reviewUrl, label: t("review_cta") }
      : statusUrl
        ? { url: statusUrl, label: t("view_ride") }
        : null;

  const message =
    event === "document_expiry"
      ? text(variables.documents)
      : event === "request_declined"
        ? text(variables.reason)
        : null;

  return (
    <NoticeEmail
      t={t}
      brand={brand}
      locale={locale}
      subject={copy.subject}
      intro={copy.intro}
      manageUrl={manageUrl ?? text(variables.portal)}
      status={status ? { label: t(status.key), tone: status.tone } : null}
      trip={trip}
      priceRows={priceRows(variables, t)}
      details={detailsFromVars(event, variables, t)}
      message={message}
      cta={cta}
    />
  );
}
