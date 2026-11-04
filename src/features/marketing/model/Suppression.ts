import mongoose, { Schema } from "mongoose";
import { MARKETING_CHANNELS } from "@/features/marketing/lib/marketing.constants";

const SUPPRESSION_REASONS = [
  "unsubscribed",
  "bounced",
  "complaint",
  "stop",
] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

/**
 * Do-not-contact list keyed by emailLower (email) or phone digits (WhatsApp).
 * A suppression always wins over a granted consent event.
 */
const SuppressionSchema = new Schema(
  {
    channel: { type: String, enum: MARKETING_CHANNELS, required: true },
    key: { type: String, required: true },
    reason: { type: String, enum: SUPPRESSION_REASONS, required: true },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

SuppressionSchema.index({ channel: 1, key: 1 }, { unique: true });
SuppressionSchema.index({ key: 1 });

const Suppression =
  mongoose.models.Suppression || mongoose.model("Suppression", SuppressionSchema);

export default Suppression;
