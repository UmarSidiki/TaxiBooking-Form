import mongoose, { Schema } from "mongoose";

export interface IPricingRule {
  nightStart: string;
  nightEnd: string;
  nightPercent: number;
  holidays: { date: string; percent: number }[];
  meetGreetPrice: number;
  operatorMinimumFare: number;
}

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    nightStart: { type: String, default: "22:00" },
    nightEnd: { type: String, default: "06:00" },
    nightPercent: { type: Number, default: 0 },
    holidays: { type: [{ date: String, percent: Number }], default: [] },
    meetGreetPrice: { type: Number, default: 0 },
    operatorMinimumFare: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PricingRule =
  mongoose.models.PricingRule || mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);

export default PricingRule;
