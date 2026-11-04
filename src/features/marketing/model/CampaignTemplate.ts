import mongoose, { Schema } from "mongoose";

export type CampaignTemplateLocaleContent = {
  subject: string;
  preheader: string;
  body: string;
};

/**
 * Per-channel, per-locale message template. `variables` is derived from the
 * bodies on save (never trusted from the client) so previews and missing
 * variable warnings stay in sync with the actual copy.
 */
const CampaignTemplateSchema = new Schema(
  {
    channel: {
      type: String,
      enum: ["email", "whatsapp"],
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    locales: { type: Schema.Types.Mixed, required: true },
    variables: { type: [String], default: [] },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

CampaignTemplateSchema.index({ channel: 1, updatedAt: -1 });

const CampaignTemplate =
  mongoose.models.CampaignTemplate ||
  mongoose.model("CampaignTemplate", CampaignTemplateSchema);

export default CampaignTemplate;
