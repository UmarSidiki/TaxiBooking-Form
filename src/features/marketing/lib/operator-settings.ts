import { connectDB } from "@/shared/db";
import Setting from "@/features/settings/model/Setting";
import { WHATSAPP_MARKETING_DAILY_CAP } from "@/features/marketing/lib/marketing.constants";
import { isValidTimeZone } from "@/features/marketing/lib/zoned-time";

export type MarketingOperatorSettings = {
  timeZone: string;
  whatsappDailyCap: number;
};

/** Operator time zone and WhatsApp marketing cap, as the campaign engine reads them. */
export async function getMarketingOperatorSettings(): Promise<MarketingOperatorSettings> {
  await connectDB();
  const settings = await Setting.findOne()
    .select({ timezone: 1, marketingWhatsappDailyCap: 1 })
    .lean<{ timezone?: string; marketingWhatsappDailyCap?: number } | null>();
  const tz = settings?.timezone && isValidTimeZone(settings.timezone) ? settings.timezone : "UTC";
  const cap = settings?.marketingWhatsappDailyCap;
  return {
    timeZone: tz,
    whatsappDailyCap: typeof cap === "number" && cap > 0 ? cap : WHATSAPP_MARKETING_DAILY_CAP,
  };
}
