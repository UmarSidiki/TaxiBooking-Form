import mongoose from "mongoose";

type LegacySetting = { _id: unknown; promoCodesEnabled?: boolean };

const DRAFT_INDEXES = [
  {
    collection: "bookings",
    keys: { draftId: 1 },
    options: { unique: true, sparse: true, name: "draftId_1" },
  },
  {
    collection: "pendingbookings",
    keys: { draftId: 1 },
    options: { unique: true, sparse: true, name: "draftId_1" },
  },
  {
    collection: "pendingbookings",
    keys: { status: 1, createdAt: 1 },
    options: { name: "status_createdAt" },
  },
] as const;

async function ensureDraftIndexes(
  db: NonNullable<typeof mongoose.connection.db>,
  dryRun: boolean
) {
  let missing = 0;
  for (const spec of DRAFT_INDEXES) {
    const indexes = await db.collection(spec.collection).indexes().catch(() => []);
    if (indexes.some((index) => index.name === spec.options.name)) continue;
    missing += 1;
    if (!dryRun) {
      await db
        .collection(spec.collection)
        .createIndex(spec.keys as Record<string, 1>, spec.options);
    }
  }
  return missing;
}

/**
 * Booking-fixes migration: turns promo codes on in settings when any active code
 * exists, and backfills `active: true` on promo codes created before the field
 * existed. Idempotent; `dryRun` writes nothing.
 */
export async function migrateBookingFixes({ dryRun }: { dryRun: boolean }) {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  const settings = db.collection<LegacySetting>("settings");
  const promos = db.collection("promocodes");

  const promoCodesEnabled = (await promos.countDocuments({ active: { $ne: false } })) > 0;
  const setting = await settings.findOne({});
  const settingsUpdated = setting && setting.promoCodesEnabled !== promoCodesEnabled ? 1 : 0;
  const promosMissingActive = await promos.countDocuments({ active: { $exists: false } });
  const indexesCreated = await ensureDraftIndexes(db, dryRun);

  if (!dryRun) {
    if (setting) {
      await settings.updateOne({ _id: setting._id }, { $set: { promoCodesEnabled } });
    }
    if (promosMissingActive > 0) {
      await promos.updateMany({ active: { $exists: false } }, { $set: { active: true } });
    }
  }

  return {
    dryRun,
    promoCodesEnabled,
    settingsUpdated,
    promosActivated: promosMissingActive,
    indexesCreated,
  };
}
