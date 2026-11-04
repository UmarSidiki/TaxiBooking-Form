import mongoose, { Schema } from "mongoose";

const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "sending",
  "paused",
  "done",
  "cancelled",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

const CampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    channel: { type: String, enum: ["email", "whatsapp"], required: true },
    segmentId: { type: Schema.Types.Mixed, default: null },
    templateId: { type: Schema.Types.Mixed, default: null },
    templateVersion: { type: Number, default: 1 },
    scheduledAt: { type: Date, default: null },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "draft" },
    throttle: {
      perRun: { type: Number, default: 50 },
      dailyCap: { type: Number, default: 0 },
    },
    quietHours: {
      startHour: { type: Number, default: 20 },
      endHour: { type: Number, default: 9 },
      timeZone: { type: String, default: "UTC" },
    },
    stats: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: String, default: "" },
    lockExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CampaignSchema.index({ status: 1, scheduledAt: 1 });

const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);

export default Campaign;