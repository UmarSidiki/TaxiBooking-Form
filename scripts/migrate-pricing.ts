import { connectDB } from "@/shared/db/mongoose";
import PricingRule from "@/features/pricing/model/PricingRule";
import PromoCode from "@/features/pricing/model/PromoCode";
import PromoRedemption from "@/features/pricing/model/PromoRedemption";
import FixedRoute from "@/features/pricing/model/FixedRoute";

const dryRun = process.argv.includes("--dry-run");

await connectDB();
const existing = await PricingRule.findOne().lean();
if (!dryRun && !existing) {
  await PricingRule.create({});
}
await Promise.all([
  PricingRule.syncIndexes(),
  FixedRoute.syncIndexes(),
  PromoCode.syncIndexes(),
  PromoRedemption.syncIndexes(),
]);
console.log(JSON.stringify({ dryRun, createdRule: !existing && !dryRun, rerun: true }, null, 2));
process.exit(0);
