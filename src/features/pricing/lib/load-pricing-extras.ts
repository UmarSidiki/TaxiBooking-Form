import { connectDB } from "@/shared/db";
import PricingRule from "@/features/pricing/model/PricingRule";
import type { PricingExtras } from "@/features/pricing/lib/quote-fare";
import { readExtras } from "@/features/pricing/lib/read-extras";

export { readExtras };

export async function loadPricingExtras() {
  await connectDB();
  const rule = await PricingRule.findOne({}, { extras: 1 }).lean<{ extras?: PricingExtras }>();
  return readExtras(rule?.extras);
}
