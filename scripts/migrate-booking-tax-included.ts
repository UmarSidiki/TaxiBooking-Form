/**
 * Backfills `taxIncluded` on bookings created before the flag was persisted.
 *
 * The stored amounts alone cannot say which mode priced a booking, but the
 * fare lines can: for inclusive tax the line amounts already contain the tax,
 * so they sum to the total; for exclusive tax they sum to the total minus tax.
 *
 * Dry run by default. Pass --apply to write.
 */
import { MongoClient, type ObjectId } from "mongodb";

const APPLY = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

type FareLine = { code?: string; amount?: number };
type BookingRow = {
  _id: ObjectId;
  tripId?: string;
  totalAmount?: number;
  taxAmount?: number;
  taxIncluded?: boolean;
  fareLines?: FareLine[];
};

const cents = (value: number) => Math.round(value * 100) / 100;

function inferTaxIncluded(booking: BookingRow): boolean | null {
  const total = booking.totalAmount ?? 0;
  const tax = booking.taxAmount ?? 0;
  if (tax <= 0) return false;

  const lines = (booking.fareLines ?? []).filter((line) => line.code !== "tax");
  const lineSum = cents(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0));
  if (lines.length === 0) return null;

  if (Math.abs(lineSum - total) <= 0.02) return true;
  if (Math.abs(lineSum + tax - total) <= 0.02) return false;
  return null;
}

async function main() {
  const client = new MongoClient(uri as string, { serverSelectionTimeoutMS: 20000 });
  await client.connect();

  // Matches the driver default the app's mongoose connection uses (no db in the URI).
  const bookings = client.db().collection<BookingRow>("bookings");
  const rows = await bookings
    .find({ taxAmount: { $gt: 0 } }, { projection: { tripId: 1, totalAmount: 1, taxAmount: 1, taxIncluded: 1, fareLines: 1 } })
    .toArray();

  const inclusive: ObjectId[] = [];
  const exclusive: ObjectId[] = [];
  const unknown: string[] = [];

  for (const row of rows) {
    const inferred = inferTaxIncluded(row);
    if (inferred === true) inclusive.push(row._id);
    else if (inferred === false) exclusive.push(row._id);
    else unknown.push(row.tripId ?? String(row._id));
  }

  console.log(`${rows.length} bookings with tax`);
  console.log(`  inclusive (line amounts already include tax): ${inclusive.length}`);
  console.log(`  exclusive: ${exclusive.length}`);
  console.log(`  undecidable: ${unknown.length}${unknown.length ? " -> " + unknown.slice(0, 10).join(", ") : ""}`);

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write taxIncluded.");
  } else {
    if (inclusive.length) {
      await bookings.updateMany({ _id: { $in: inclusive } }, { $set: { taxIncluded: true } });
    }
    if (exclusive.length) {
      await bookings.updateMany({ _id: { $in: exclusive } }, { $set: { taxIncluded: false } });
    }
    console.log(`\nUpdated ${inclusive.length + exclusive.length} bookings.`);
  }

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
