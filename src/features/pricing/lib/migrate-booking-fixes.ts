import mongoose from "mongoose";

type LegacySetting = { _id: unknown; promoCodesEnabled?: boolean };

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
  };
}
