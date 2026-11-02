import mongoose, { Schema } from "mongoose";

const CLICK_EVENT_TYPES = ["open", "click"] as const;
export type ClickEventType = (typeof CLICK_EVENT_TYPES)[number];

const ClickEventSchema = new Schema(
  {
    campaignId: { type: Schema.Types.Mixed, required: true, index: true },
    recipientId: { type: Schema.Types.Mixed, default: null, index: true },
    type: { type: String, enum: CLICK_EVENT_TYPES, required: true },
    url: { type: String, default: "" },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

ClickEventSchema.index({ campaignId: 1, type: 1 });

const ClickEvent =
  mongoose.models.ClickEvent || mongoose.model("ClickEvent", ClickEventSchema);
export default ClickEvent;