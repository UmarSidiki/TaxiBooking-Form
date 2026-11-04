import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
import {
  marketingCacheFor,
  marketingStateFromCache,
  type MarketingConsentEventRow,
  type MarketingProfileDoc,
  type MarketingSnapshot,
} from "@/features/marketing/lib/consent/marketing-consent.types";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

const MARKETING_HISTORY_LIMIT = 100;

type MarketingEventDoc = {
  _id: unknown;
  channel: MarketingChannel;
  status: "granted" | "withdrawn";
  source: string;
  textVersion?: string | null;
  at: Date;
  reason?: string | null;
};

function eventRow(doc: MarketingEventDoc): MarketingConsentEventRow {
  return {
    id: String(doc._id),
    channel: doc.channel,
    status: doc.status,
    source: doc.source,
    textVersion: doc.textVersion ?? "",
    at: doc.at.toISOString(),
    reason: doc.reason ?? "",
  };
}

export async function loadMarketingProfile(
  emailLower: string,
): Promise<MarketingProfileDoc | null> {
  await connectDB();
  return CustomerProfile.findOne({ email: emailLower })
    .collation({ locale: "en", strength: 2 })
    .select("email verifiedPhone marketing")
    .lean<MarketingProfileDoc | null>();
}

async function listMarketingConsentEvents(
  emailLower: string,
): Promise<MarketingConsentEventRow[]> {
  await connectDB();
  const docs = await MarketingConsent.find({ emailLower })
    .sort({ at: -1, _id: -1 })
    .limit(MARKETING_HISTORY_LIMIT)
    .lean<MarketingEventDoc[]>();
  return docs.map(eventRow);
}

/**
 * Current consent cache plus the audit history the admin Marketing tab shows.
 * Pass the profile when the caller already loaded it to avoid a second query.
 */
export async function loadMarketingSnapshot(
  emailLower: string,
  profile?: MarketingProfileDoc | null,
): Promise<MarketingSnapshot> {
  const [marketingProfile, history] = await Promise.all([
    profile === undefined ? loadMarketingProfile(emailLower) : Promise.resolve(profile),
    listMarketingConsentEvents(emailLower),
  ]);

  return {
    email: marketingStateFromCache(marketingCacheFor(marketingProfile, "email")),
    whatsapp: marketingStateFromCache(marketingCacheFor(marketingProfile, "whatsapp")),
    whatsappVerified: Boolean((marketingProfile?.verifiedPhone ?? "").trim()),
    history,
  };
}
