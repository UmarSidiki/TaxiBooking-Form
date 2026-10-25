import { connectDB } from "@/shared/db/mongoose";
import { migratePartnerAccess } from "@/features/partners/lib/migrate-partner-access";

const dryRun = process.argv.includes("--dry-run");
await connectDB();
const rows = await migratePartnerAccess(dryRun);
console.log(JSON.stringify({ dryRun, count: rows.length, rows }, null, 2));
process.exit(0);
