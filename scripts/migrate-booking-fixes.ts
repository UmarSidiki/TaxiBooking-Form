import { connectDB } from "@/shared/db/mongoose";
import { migrateBookingFixes } from "@/features/pricing/lib/migrate-booking-fixes";

const dryRun = process.argv.includes("--dry-run");

await connectDB();
const report = await migrateBookingFixes({ dryRun });
console.log(JSON.stringify(report, null, 2));
process.exit(0);
