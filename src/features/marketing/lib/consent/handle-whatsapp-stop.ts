import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";

const STOP_ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Latest WhatsApp campaign this person was sent in the last 30 days, if any. */
export async function latestWhatsAppCampaignFor(
  emailLower: string,
  now = new Date(),
): Promise<string | undefined> {
  const recent = await CampaignRecipient.find({
    emailLower,
    status: "sent",
    sentAt: { $gte: new Date(now.getTime() - STOP_ATTRIBUTION_WINDOW_MS) },
  })
    .sort({ sentAt: -1 })
    .limit(10)
    .select("campaignId")
    .lean<Array<{ campaignId: unknown }>>();
  if (recent.length === 0) return undefined;
  const hit = await Campaign.findOne({
    _id: { $in: recent.map((r) => r.campaignId) },
    channel: "whatsapp",
  })
    .sort({ scheduledAt: -1 })
    .select("_id")
    .lean<{ _id: unknown } | null>();
  return hit ? String(hit._id) : undefined;
}

function digitsOf(value: string | null | undefined): string {
  let digits = "";
  for (const char of value ?? "") {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

/** Best-effort: record a WhatsApp STOP reply as consent withdrawal + suppression. */
export async function handleWhatsAppStop(jid: string): Promise<void> {
  const digits = digitsOf(jid);
  if (!digits) return;
  await connectDB();
  const profiles = await CustomerProfile.find({ verifiedPhone: { $ne: "" } })
    .select("email verifiedPhone")
    .lean<Array<{ email: string; verifiedPhone?: string }>>();
  const match = profiles.find(
    (profile) => digitsOf(profile.verifiedPhone) === digits,
  );
  if (!match?.email) return;
  const campaignId = await latestWhatsAppCampaignFor(match.email.trim().toLowerCase()).catch(
    () => undefined,
  );
  await applyMarketingConsent({
    campaignId,
    email: match.email,
    channel: "whatsapp",
    status: "withdrawn",
    source: "whatsapp_stop",
    phoneDigits: digits,
  });
}