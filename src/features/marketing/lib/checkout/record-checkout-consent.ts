import CustomerProfile from "@/features/customers/model/CustomerProfile";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
import Suppression from "@/features/marketing/model/Suppression";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import { isMarketingEnabled } from "@/features/marketing/lib/marketing-module";
import {
  MARKETING_CONSENT_TEXT_VERSION,
  type MarketingChannel,
} from "@/features/marketing/lib/marketing.constants";

export type CheckoutConsentInput = {
  email: string;
  phone?: string;
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
 * A channel is only auto-granted to a customer who never had a say on it:
 * no cached status, no withdrawn event, no suppression. Anyone who opted
 * out, unsubscribed, bounced or sent STOP is never re-subscribed.
 */
async function isUntouched(
  emailLower: string,
  channel: MarketingChannel,
  status: string | undefined,
  phoneKeys: string[],
): Promise<boolean> {
  if (status && status !== "none") return false;
  const keys = channel === "email" ? [emailLower] : phoneKeys.filter(Boolean);
  const [withdrawn, suppressed] = await Promise.all([
    MarketingConsent.exists({ emailLower, channel, status: "withdrawn" }),
    keys.length ? Suppression.exists({ channel, key: { $in: keys } }) : null,
  ]);
  return !withdrawn && !suppressed;
}

/**
 * Every booking opts the customer in to email and WhatsApp marketing
 * (operator's decision), while the Marketing module is on. Sequential on
 * purpose: the first grant may create the profile row.
 */
export async function recordCheckoutMarketingConsent(
  input: CheckoutConsentInput,
): Promise<void> {
  const emailLower = input.email.trim().toLowerCase();
  if (!emailLower) return;
  if (!(await isMarketingEnabled())) return;

  const profile = await CustomerProfile.findOne({ email: emailLower })
    .collation({ locale: "en", strength: 2 })
    .select("marketing verifiedPhone")
    .lean<{
      verifiedPhone?: string | null;
      marketing?: Partial<Record<MarketingChannel, { status?: string } | null>> | null;
    } | null>();
  const phoneDigits = digitsOf(input.phone);
  const phoneKeys = [phoneDigits, digitsOf(profile?.verifiedPhone)];

  for (const channel of ["email", "whatsapp"] as const) {
    const status = profile?.marketing?.[channel]?.status;
    if (!(await isUntouched(emailLower, channel, status, phoneKeys))) continue;
    await applyMarketingConsent({
      email: emailLower,
      channel,
      status: "granted",
      source: "checkout_auto",
      textVersion: MARKETING_CONSENT_TEXT_VERSION,
      ipPrefix: input.ipPrefix,
      ...(channel === "whatsapp" ? { phoneDigits } : {}),
    });
  }
}
