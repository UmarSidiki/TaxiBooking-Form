import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { emailDefaultCopy } from "@/features/emails/defaults";
import { brandFromSettings } from "@/features/emails/lib/brand";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import { renderEmail } from "@/features/emails/lib/render-email";
import { BookingConfirmedEmail } from "@/features/emails/templates/booking-confirmed-email";
import { OtpEmail } from "@/features/emails/templates/otp-email";

const LEGACY = "#00FF00";
const OUT = process.env.EMAIL_PREVIEW_DIR;

describe("emails follow the active palette", () => {
  const brand = brandFromSettings({ colorPalette: "heritage", primaryColor: LEGACY, companyName: "Riviera Cars" } as never);

  it("booking confirmation uses the palette accent, never the legacy primary colour", async () => {
    const t = emailTranslator("en");
    const copy = emailDefaultCopy("booking_confirmed", "en", { tripId: "T-1", name: "Ada" });
    const { html } = await renderEmail(
      <BookingConfirmedEmail t={t} brand={brand} locale="en" subject={copy.subject} intro={copy.intro}
        trip={{ tripId: "T-1", pickup: "Geneva Airport", dropoff: "Hotel", date: "2026-11-04", time: "14:30", vehicle: "Sedan", passengers: 2 }}
        priceRows={[{ label: t("total"), value: "CHF 162.15" }]} manageUrl="https://example.com/en/account" invoiceUrl="https://example.com/api/invoice/T-1" />,
    );
    expect(html).toContain("background-color:#8E1B2B");
    expect(html.toUpperCase()).not.toContain(LEGACY);
    if (OUT) { mkdirSync(OUT, { recursive: true }); writeFileSync(`${OUT}/booking-confirmed.html`, html); }
  });

  it("sign-in code email uses the palette accent", async () => {
    const t = emailTranslator("en");
    const copy = emailDefaultCopy("sign_in_otp", "en");
    const { html } = await renderEmail(<OtpEmail t={t} brand={brand} locale="en" subject={copy.subject} intro={copy.intro} code="482913" />);
    expect(html).toContain("#8E1B2B");
    expect(html.toUpperCase()).not.toContain(LEGACY);
    if (OUT) writeFileSync(`${OUT}/otp.html`, html);
  });
});
