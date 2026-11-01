import { connectDB } from "@/shared/db";
import Suppression from "@/features/marketing/model/Suppression";
import {
  marketingStatusFromProfile,
  type MarketingProfileDoc,
} from "@/features/marketing/lib/consent/marketing-consent.types";
import { loadMarketingProfile } from "@/features/marketing/lib/consent/marketing-consent.repo";
import type {
  MarketingChannel,
  MarketingStatus,
} from "@/features/marketing/lib/marketing.constants";

export type MarketingEligibilityReason =
  | "eligible"
  | "no_consent"
  | "suppressed"
  | "unverified_phone";

export type MarketingEligibility = {
  eligible: boolean;
  reason: MarketingEligibilityReason;
  status: MarketingStatus;
  key: string;
};

function digitsOf(value: string | null | undefined): string {
  let digits = "";
  for (const char of value ?? "") {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

export function marketingSuppressionKey(
  emailLower: string,
  channel: MarketingChannel,
  profile: MarketingProfileDoc | null,
): string {
  if (channel === "email") return emailLower;
  return digitsOf(profile?.verifiedPhone);
}

/**
 * Single gate every marketing send must pass. Consent and the suppression
 * list are checked per channel; WhatsApp additionally needs a verified number.
 */
export async function checkMarketingEligibility(
  input: { email: string; channel: MarketingChannel },
  profile?: MarketingProfileDoc | null,
): Promise<MarketingEligibility> {
  const emailLower = input.email.trim().toLowerCase();
  const channel = input.channel;

  const marketingProfile =
    profile === undefined ? await loadMarketingProfile(emailLower) : profile;
  const status = marketingStatusFromProfile(marketingProfile, channel);
  const key = marketingSuppressionKey(emailLower, channel, marketingProfile);

  if (status !== "granted") {
    return { eligible: false, reason: "no_consent", status, key };
  }
  if (channel === "whatsapp" && !key) {
    return { eligible: false, reason: "unverified_phone", status, key };
  }

  await connectDB();
  const suppressed = await Suppression.exists({ channel, key });
  if (suppressed) {
    return { eligible: false, reason: "suppressed", status, key };
  }

  return { eligible: true, reason: "eligible", status, key };
}
