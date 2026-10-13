/**
 * One-shot: set returnPricePercentage from 0 → 100 on vehicles where empty
 * fleet-form input previously saved 0 (free return was unintentional).
 *
 * Usage: node --env-file=.env.local scripts/migrate-return-price-percentage.mjs
 * Dry run: DRY_RUN=1 node --env-file=.env.local scripts/migrate-return-price-percentage.mjs
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

await mongoose.connect(uri);
const col = mongoose.connection.collection("vehicles");
const filter = { returnPricePercentage: 0 };
const count = await col.countDocuments(filter);

console.log(`Vehicles with returnPricePercentage: 0 → ${count}`);

if (!dryRun && count > 0) {
  const result = await col.updateMany(filter, {
    $set: { returnPricePercentage: 100 },
  });
  console.log(`Updated ${result.modifiedCount} vehicle(s) to 100`);
} else if (dryRun) {
  console.log("Dry run — no writes");
}

await mongoose.disconnect();
