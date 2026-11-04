import mongoose, { Schema } from "mongoose";

/**
 * Saved audience definition. `filter` is the validated C2 customer-list
 * filter object (no cursor/sort). Consent for the campaign channel is never
 * stored here: it is applied at count/preview/send time.
 */
const SegmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    filter: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

SegmentSchema.index({ updatedAt: -1 });

const Segment =
  mongoose.models.Segment || mongoose.model("Segment", SegmentSchema);

export default Segment;
