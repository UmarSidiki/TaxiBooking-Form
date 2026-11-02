import mongoose, { Schema } from "mongoose";

const CAMPAIGN_RECIPIENT_STATUSES = [
  "pending",
  "sending",
  "sent",
  "failed",
  "skipped_consent",
  "skipped_cap",
  "skipped_suppressed",
] as const;
export type CampaignRecipientStatus =
  (typeof CAMPAIGN_RECIPIENT_STATUSES)[number];

const CampaignRecipientSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, required: true, index: true },
    emailLower: { type: String, required: true, trim: true, lowercase: true },
    locale: { type: String, default: "en" },
    status: {
      type: String,
      enum: CAMPAIGN_RECIPIENT_STATUSES,
      default: "pending",
    },
    idempotencyKey: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
    error: { type: String, default: "" },
    leaseExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CampaignRecipientSchema.index({ campaignId: 1, emailLower: 1 }, { unique: true });
CampaignRecipientSchema.index({ campaignId: 1, status: 1 });

const CampaignRecipient =
  mongoose.models.CampaignRecipient ||
  mongoose.model("CampaignRecipient", CampaignRecipientSchema);

export default CampaignRecipient;