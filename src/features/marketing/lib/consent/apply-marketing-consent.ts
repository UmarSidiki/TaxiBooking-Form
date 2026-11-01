import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import { connectDB } from "@/shared/db";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
import Suppression from "@/features/marketing/model/Suppression";
import {
  MARKETING_CONSENT_TEXT_VERSION,
  type MarketingChannel,
  type MarketingEventStatus,
  type MarketingSource,
} from "@/features/marketing/lib/marketing.constants";

export type ApplyMarketingConsentInput = {
  email: string;
  channel: MarketingChannel;
  status: MarketingEventStatus;
  source: MarketingSource;
  textVersion?: string;
  ipPrefix?: string;
  reason?: string;
  actorId?: string;
  /** Verified WhatsApp number when the caller already has it. */
  phoneDigits?: string;
  at?: Date;
};

function digitsOf(value: string | null | undefined): string {
  let digits = "";
  for (const char of value ?? "") {
    if (char >= "0" && char <= "9") digits += char;
  }
  return digits;
}

function suppressionKey(
  emailLower: string,
  channel: MarketingChannel,
  phoneDigits: string | undefined,
) {
  if (channel === "email") return emailLower;
  return digitsOf(phoneDigits);
}

/**
 * Record a consent event, refresh the CustomerProfile cache and the
 * CustomerStats consent columns, and maintain the suppression list.
 *
 * Withdrawing suppresses the channel. Re-granting only clears a suppression
 * caused by an unsubscribe/STOP, never a bounce or complaint.
 */
export async function applyMarketingConsent(
  input: ApplyMarketingConsentInput,
): Promise<void> {
  const emailLower = input.email.trim().toLowerCase();
  if (!emailLower) return;
  await connectDB();

  const channel = input.channel;
  const textVersion = input.textVersion ?? MARKETING_CONSENT_TEXT_VERSION;
  const at = input.at ?? new Date();
  const reason = (input.reason ?? "").trim();

  // CustomerProfile.email is normally lowercased, but legacy rows may not be.
  const existing = await CustomerProfile.findOne({ email: emailLower })
    .collation({ locale: "en", strength: 2 })
    .select("_id verifiedPhone")
    .lean<{ _id: unknown; verifiedPhone?: string | null } | null>();

  const phoneDigits = input.phoneDigits ?? existing?.verifiedPhone ?? "";
  const key = suppressionKey(emailLower, channel, phoneDigits);
  const profileFilter = existing ? { _id: existing._id } : { email: emailLower };

  await Promise.all([
    MarketingConsent.create({
      emailLower,
      channel,
      status: input.status,
      source: input.source,
      textVersion,
      ipPrefix: input.ipPrefix ?? "",
      reason,
      actorId: input.actorId ?? "",
      at,
    }),
    CustomerProfile.findOneAndUpdate(
      profileFilter,
      {
        $set: {
          email: emailLower,
          [`marketing.${channel}.status`]: input.status,
          [`marketing.${channel}.at`]: at,
          [`marketing.${channel}.source`]: input.source,
          [`marketing.${channel}.textVersion`]: textVersion,
        },
      },
      { upsert: true },
    ),
    CustomerStats.updateOne(
      { emailLower },
      {
        $set: {
          [channel === "email" ? "emailConsent" : "whatsappConsent"]:
            input.status,
        },
      },
    ),
  ]);

  if (!key) return;

  if (input.status === "withdrawn") {
    await Suppression.updateOne(
      { channel, key },
      {
        $setOnInsert: {
          channel,
          key,
          reason: input.source === "whatsapp_stop" ? "stop" : "unsubscribed",
          at,
        },
      },
      { upsert: true },
    );
    return;
  }

  await Suppression.deleteOne({
    channel,
    key,
    reason: { $in: ["unsubscribed", "stop"] },
  });
}
