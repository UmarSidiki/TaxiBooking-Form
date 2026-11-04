import mongoose, { Schema } from "mongoose";
import {
  MARKETING_CHANNELS,
  MARKETING_EVENT_STATUSES,
  MARKETING_SOURCES,
} from "@/features/marketing/lib/marketing.constants";

/**
 * Append-only consent ledger. The latest event per channel drives the cache on
 * CustomerProfile.marketing; events are kept as proof and never rewritten.
 */
const MarketingConsentSchema = new Schema(
  {
    emailLower: { type: String, required: true, index: true },
    channel: { type: String, enum: MARKETING_CHANNELS, required: true },
    status: { type: String, enum: MARKETING_EVENT_STATUSES, required: true },
    source: { type: String, enum: MARKETING_SOURCES, required: true },
    textVersion: { type: String, default: "" },
    /** Coarse network signal only; never the full address. */
    ipPrefix: { type: String, default: "" },
    /** Documented reason for admin offline consent or withdrawal. */
    reason: { type: String, default: "" },
    actorId: { type: String, default: "" },
    /** Campaign behind an unsubscribe link or STOP reply; "" when unknown. */
    campaignId: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

MarketingConsentSchema.index({ emailLower: 1, at: -1 });
MarketingConsentSchema.index({ emailLower: 1, channel: 1, at: -1 });
MarketingConsentSchema.index(
  { campaignId: 1, status: 1 },
  { partialFilterExpression: { campaignId: { $gt: "" } } },
);

const MarketingConsent =
  mongoose.models.MarketingConsent ||
  mongoose.model("MarketingConsent", MarketingConsentSchema);

export default MarketingConsent;
