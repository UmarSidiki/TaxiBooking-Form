import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import { MARKETING_CONSENT_TEXT_VERSION } from "@/features/marketing/lib/marketing.constants";

export type CheckoutConsentInput = {
  email: string;
  phone?: string;
  marketingEmailOptIn?: boolean;
  marketingWhatsappOptIn?: boolean;
  ipPrefix?: string;
};

function digitsOf(value: string | null | undefined): string {
  let digits = "";
  for (const char of value ?? "") {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

/**
 * Checkout boxes are unticked by default, so a missing/true flag only ever
 * creates a grant. Sending nothing is the safe path for past customers.
 * Sequential on purpose: the first call may create the profile row.
 */
export async function recordCheckoutMarketingConsent(
  input: CheckoutConsentInput,
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) return;

  if (input.marketingEmailOptIn === true) {
    await applyMarketingConsent({
      email,
      channel: "email",
      status: "granted",
      source: "booking_checkbox",
      textVersion: MARKETING_CONSENT_TEXT_VERSION,
      ipPrefix: input.ipPrefix,
    });
  }

  if (input.marketingWhatsappOptIn === true) {
    await applyMarketingConsent({
      email,
      channel: "whatsapp",
      status: "granted",
      source: "booking_checkbox",
      textVersion: MARKETING_CONSENT_TEXT_VERSION,
      ipPrefix: input.ipPrefix,
      phoneDigits: digitsOf(input.phone),
    });
  }
}
