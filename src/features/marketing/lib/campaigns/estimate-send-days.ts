import {
  WHATSAPP_MARKETING_DAILY_CAP,
  type MarketingChannel,
} from "@/features/marketing/lib/marketing.constants";

/** Days a campaign needs under the operator's WhatsApp daily cap. Email goes out in one run. */
export function estimateSendDays(
  recipients: number,
  channel: MarketingChannel,
  dailyCap: number = WHATSAPP_MARKETING_DAILY_CAP,
) {
  if (channel !== "whatsapp" || recipients <= 0) return recipients > 0 ? 1 : 0;
  return Math.ceil(recipients / Math.max(1, dailyCap));
}
