import mongoose, { Schema } from "mongoose";

export interface IPromoCode {
  code: string;
  kind: "percent" | "fixed";
  amount: number;
  expiresAt?: Date | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  usedCount: number;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    kind: { type: String, enum: ["percent", "fixed"], required: true },
    amount: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, default: null },
    maxUses: { type: Number, default: null },
    maxUsesPerCustomer: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PromoCode = mongoose.models.PromoCode || mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema);

export default PromoCode;
