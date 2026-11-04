import { connectDB } from "@/shared/db";
import Campaign from "@/features/marketing/model/Campaign";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type AttributionInput = {
  campaignId?: string | null;
  campaign?: string | null;
  utmCampaign?: string | null;
  utm_campaign?: string | null;
  promoCode?: string | null;
  promo?: string | null;
  promoCodeId?: string | null;
  email?: string | null;
  createdAt?: Date | string | number | null;
  booking?: Record<string, unknown> | null;
  bookingId?: string | null;
};

function pick(input: AttributionInput, ...keys: string[]): string | null {
  const source = (input.booking && typeof input.booking === "object"
    ? { ...input.booking, ...input }
    : input) as Record<string, unknown>;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

async function resolveCampaignId(input: AttributionInput): Promise<string | null> {
  const direct = pick(input, "campaignId", "campaign", "utmCampaign", "utm_campaign", "campaignName");
  if (direct) {
    // Try as id first
    const { isObjectIdString } = await import("@/features/customers-admin/lib/object-id");
    if (isObjectIdString(direct)) return direct;
    // Try by name
    await connectDB();
    const byName = await Campaign.findOne({ name: direct }).select("_id").lean<{ _id: unknown } | null>();
    if (byName) return String(byName._id);
  }
  const promo = pick(input, "promoCode", "promo", "promoCodeId");
  if (promo) {
    await connectDB();
    // Match a campaign whose name equals the promo code (best-effort link)
    const byPromo = await Campaign.findOne({ name: promo }).select("_id").lean<{ _id: unknown } | null>();
    if (byPromo) return String(byPromo._id);
  }
  return null;
}

export async function attributeBookingToCampaign(
  input: AttributionInput | string,
): Promise<{ attributed: boolean; campaignId?: string | null }> {
  await connectDB();
  const normalized: AttributionInput =
    typeof input === "string" ? { campaignId: input } : input ?? {};

  const campaignId = await resolveCampaignId(normalized);
  if (!campaignId) return { attributed: false };

  const campaign = await Campaign.findById(campaignId).lean<{
    _id: unknown;
    scheduledAt?: Date | null;
    createdAt?: Date | null;
    status?: string;
  } | null>();
  if (!campaign) return { attributed: false };

  const refDate = campaign.scheduledAt ?? campaign.createdAt ?? new Date();
  const bookingDateRaw = normalized.createdAt;
  const bookingDate = bookingDateRaw
    ? new Date(bookingDateRaw as string | number | Date)
    : new Date();
  if (Number.isNaN(bookingDate.getTime())) return { attributed: false };

  const diff = bookingDate.getTime() - new Date(refDate).getTime();
  if (diff < 0 || diff > SEVEN_DAYS_MS) return { attributed: false };

  await Campaign.updateOne(
    { _id: campaignId },
    {
      $inc: {
        "stats.attributed": 1,
        "stats.attributedCount": 1,
        "stats.bookingsAttributed": 1,
      },
    },
  );
  return { attributed: true, campaignId };
}

export const attributeBooking = attributeBookingToCampaign;