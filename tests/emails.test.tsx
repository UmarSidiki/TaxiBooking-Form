import { describe, expect, it } from "vitest";

import { emailCopyKeys } from "@/features/emails/defaults/event-copy";
import { emailDefaultCopy, emailDefaults } from "@/features/emails/defaults";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import { renderEmail } from "@/features/emails/lib/render-email";
import { sampleBrand } from "@/features/emails/lib/sample-brand";
import { BookingConfirmedEmail } from "@/features/emails/templates/booking-confirmed-email";
import { buildNotificationEmail } from "@/features/emails/templates/build-notification-email";
import { CancellationEmail } from "@/features/emails/templates/cancellation-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import { OtpEmail } from "@/features/emails/templates/otp-email";
import { RequestEmail } from "@/features/emails/templates/request-email";
import { ThankYouEmail } from "@/features/emails/templates/thank-you-email";
import { emailEventKeys, emailLocales } from "@/features/emails/types";
import type { EmailTrip } from "@/features/emails/types";

const manageUrl = "https://example.com/en/account?token=magic-token";
const sampleValues: Record<string, string> = {
  tripId: "T-10482",
  pickup: "Geneva Airport",
  dropoff: "Beau-Rivage Hotel",
  date: "2026-11-04",
  time: "14:30",
  vehicle: "Mercedes E-Class",
  passengers: "2",
  total: "162.15",
  amount: "CHF 162.15",
  currency: "CHF",
  invoiceNumber: "INV-1",
  code: "482913",
  name: "Ada",
  driver: "Marco",
  reason: "No availability",
  documents: "Licence expires",
  month: "2026-10",
  payUrl: "https://example.com/pay/token",
  reviewUrl: "https://example.com/review",
  statusUrl: "https://example.com/status",
};
const trip: EmailTrip = {
  tripId: "T-10482",
  pickup: "Geneva Airport",
  dropoff: "Beau-Rivage Hotel",
  date: "2026-11-04",
  time: "14:30",
  vehicle: "Mercedes E-Class",
  passengers: 2,
};

function booking(locale: string) {
  const t = emailTranslator(locale);
  const copy = emailDefaultCopy("booking_confirmed", locale, {
    tripId: trip.tripId,
    name: "Ada",
  });
  return (
    <BookingConfirmedEmail
      t={t}
      brand={sampleBrand}
      locale={locale}
      subject={copy.subject}
      intro={copy.intro}
      trip={trip}
      priceRows={[{ label: t("total"), value: "CHF 162.15" }]}
      manageUrl={manageUrl}
      invoiceUrl="https://example.com/api/invoice/T-10482"
    />
  );
}

function expectClean(html: string, text: string) {
  expect(html).not.toContain("undefined");
  expect(text).not.toContain("undefined");
  expect(html).not.toContain("localhost");
  expect(text).not.toContain("localhost");
  expect(html).toContain("color-scheme");
  expect(html).toContain("max-width:600px");
}

describe("email design system", () => {
  it("renders every locale without missing copy", async () => {
    for (const locale of emailLocales) {
      const { html, text } = await renderEmail(booking(locale));
      expectClean(html, text);
      expect(html).toContain(manageUrl.replaceAll("&", "&amp;"));
      expect(text).toContain("T-10482");
    }
  });

  it("puts the manage-booking link in every customer email", async () => {
    const t = emailTranslator("en");
    const received = emailDefaultCopy("request_received", "en", { tripId: trip.tripId });
    const declined = emailDefaultCopy("request_declined", "en", { tripId: trip.tripId });
    const quote = emailDefaultCopy("quote_pay_link", "en", { tripId: trip.tripId });
    const thanks = emailDefaultCopy("thank_you", "en", { tripId: trip.tripId });
    const cancelled = emailDefaultCopy("booking_cancelled", "en", { tripId: trip.tripId });

    const elements = [
      booking("en"),
      <ThankYouEmail
        key="thank-you"
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={thanks.subject}
        intro={thanks.intro}
        trip={trip}
        reviewUrl="https://example.com/review"
        manageUrl={manageUrl}
      />,
      <CancellationEmail
        key="cancellation"
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={cancelled.subject}
        intro={cancelled.intro}
        trip={trip}
        priceRows={[{ label: t("total"), value: "CHF 1" }]}
        manageUrl={manageUrl}
      />,
      <RequestEmail
        key="received"
        variant="received"
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={received.subject}
        intro={received.intro}
        trip={trip}
        manageUrl={manageUrl}
      />,
      <RequestEmail
        key="declined"
        variant="declined"
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={declined.subject}
        intro={declined.intro}
        trip={trip}
        manageUrl={manageUrl}
      />,
      <RequestEmail
        key="quote"
        variant="quote"
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={quote.subject}
        intro={quote.intro}
        trip={trip}
        payUrl="https://example.com/pay/token"
        manageUrl={manageUrl}
      />,
    ];

    for (const element of elements) {
      const { html, text } = await renderEmail(element);
      expectClean(html, text);
      expect(html).toContain("Manage your booking");
      expect(html).toContain(manageUrl.replaceAll("&", "&amp;"));
    }
  });

  it("renders every registry email event", async () => {
    const variables = sampleValues;

    for (const event of emailEventKeys) {
      const copy = emailDefaultCopy(event, "en", variables);
      const { html, text } = await renderEmail(
        buildNotificationEmail({
          event,
          copy,
          brand: sampleBrand,
          locale: "en",
          variables,
          manageUrl: event.includes("booking") || event.includes("thank") ? manageUrl : null,
        }),
      );
      expectClean(html, text);
    }
  });

  it("has a translated subject and intro for every event and locale", () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const event of emailEventKeys) {
      expect(emailCopyKeys[event]).toBeTruthy();
      for (const locale of emailLocales) {
        const copy = emailDefaultCopy(event, locale, sampleValues);
        expect(copy.subject.trim().length, `${event}/${locale} subject`).toBeGreaterThan(0);
        expect(copy.intro.trim().length, `${event}/${locale} intro`).toBeGreaterThan(0);
        expect(emoji.test(copy.subject), `${event}/${locale} subject emoji`).toBe(false);
        expect(copy.subject, `${event}/${locale} unresolved`).not.toContain("{");
        expect(copy.intro, `${event}/${locale} unresolved`).not.toContain("{");
      }
      const defaults = emailDefaults(event);
      expect(Object.keys(defaults)).toHaveLength(emailLocales.length);
    }
  });

  it("renders the OTP code prominently in HTML and text", async () => {
    const t = emailTranslator("en");
    const copy = emailDefaultCopy("sign_in_otp", "en");
    const { html, text } = await renderEmail(
      <OtpEmail
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={copy.subject}
        intro={copy.intro}
        code="482913"
      />,
    );
    expectClean(html, text);
    expect(html).toContain("482913");
    expect(text).toContain("482913");
  });

  it("keeps a stable booking confirmation snapshot", async () => {
    const { html } = await renderEmail(booking("en"));
    expect(html).toMatchSnapshot();
  });

  it("renders a plain notice without an empty shell", async () => {
    const t = emailTranslator("en");
    const copy = emailDefaultCopy("document_expiry", "en", { documents: "Licence expires" });
    const { html, text } = await renderEmail(
      <NoticeEmail
        t={t}
        brand={sampleBrand}
        locale="en"
        subject={copy.subject}
        intro={copy.intro}
        message="Licence expires"
      />,
    );
    expectClean(html, text);
    expect(text).toContain("Licence expires");
  });
});
