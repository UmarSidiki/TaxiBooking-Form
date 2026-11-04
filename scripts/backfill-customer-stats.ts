import { connectDB } from "@/shared/db/mongoose";
import { isLocalMongoUri } from "@/features/customers-admin/lib/customer-stats/is-local-mongo-uri";

const apply = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;

if (!isLocalMongoUri(uri)) {
  console.error(
    [
      "Refusing to run: MONGODB_URI must be a plain mongodb:// URI on localhost/127.0.0.1.",
      "This backfill never touches a remote or production database.",
    ].join("\n"),
  );
  process.exit(1);
}

await connectDB();

const { rebuildCustomerStats } = await import(
  "@/features/customers-admin/lib/customer-stats/rebuild-customer-stats"
);
const result = await rebuildCustomerStats({ dryRun: !apply });

console.log(
  JSON.stringify(
    { mode: apply ? "apply" : "dry-run", ...result },
    null,
    2,
  ),
);
process.exit(0);
