import { connectDB } from "@/shared/db/mongoose";
import { migratePartnerBalances } from "@/features/partners/lib/migrate-partner-balance";

const dryRun = process.argv.includes("--dry-run");

await connectDB();
const rows = await migratePartnerBalances(dryRun);
console.log(JSON.stringify({ dryRun, count: rows.length, rows }, null, 2));
process.exit(0);
