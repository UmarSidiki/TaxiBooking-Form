import { connectDB } from "@/shared/db/mongoose";
import { migratePricingV2 } from "@/features/pricing/lib/migrate-pricing-v2";

const dryRun = process.argv.includes("--dry-run");

await connectDB();
const report = await migratePricingV2({ dryRun });
console.log(JSON.stringify(report, null, 2));
process.exit(0);
