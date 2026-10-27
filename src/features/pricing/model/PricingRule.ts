import mongoose, { Schema } from "mongoose";
import type { HolidayRange } from "@/features/pricing/lib/holidays";
import type { PricingExtras } from "@/features/pricing/lib/quote-fare";

export interface IPricingRule {
  nightStart: string;
  nightEnd: string;
  nightPercent: number;
  holidays: HolidayRange[];
  extras: PricingExtras;
  customerCutoffHours?: number;
  depositPercent?: number;
}

const extra = {
  enabled: { type: Boolean, default: false },
  price: { type: Number, default: 0, min: 0 },
};

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    nightStart: { type: String, default: "22:00" },
    nightEnd: { type: String, default: "06:00" },
    nightPercent: { type: Number, default: 0 },
    holidays: { type: [{ _id: false, start: String, end: String, percent: Number }], default: [] },
    extras: {
      meetGreet: extra,
      childSeat: extra,
      babySeat: extra,
    },
    customerCutoffHours: { type: Number, default: 2 },
    depositPercent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PricingRule =
  mongoose.models.PricingRule || mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);

export default PricingRule;
