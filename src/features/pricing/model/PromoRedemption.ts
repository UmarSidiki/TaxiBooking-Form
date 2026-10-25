import mongoose, { Schema } from "mongoose";

const PromoRedemptionSchema = new Schema(
  {
    promoId: { type: Schema.Types.ObjectId, ref: "PromoCode", required: true },
    customerKey: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: false },
);

PromoRedemptionSchema.index({ promoId: 1, customerKey: 1 }, { unique: true });

const PromoRedemption =
  mongoose.models.PromoRedemption || mongoose.model("PromoRedemption", PromoRedemptionSchema);

export default PromoRedemption;
