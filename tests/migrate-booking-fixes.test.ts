import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { connectDB } from "@/shared/db";
import { migrateBookingFixes } from "@/features/pricing/lib/migrate-booking-fixes";

async function seed(settings: Record<string, unknown> | null, promos: Record<string, unknown>[]) {
  await connectDB();
  const db = mongoose.connection.db!;
  await db.collection("settings").deleteMany({});
  await db.collection("promocodes").deleteMany({});
  await db.collection("bookings").drop().catch(() => undefined);
  await db.collection("pendingbookings").drop().catch(() => undefined);
  if (settings) await db.collection("settings").insertOne(settings);
  if (promos.length) await db.collection("promocodes").insertMany(promos);
  return db;
}

describe("booking fixes migration", () => {
  it("dry-run reports changes without writing", async () => {
    const db = await seed({ primaryColor: "#B45309" }, [{ code: "SAVE10", kind: "percent", amount: 10 }]);
    const report = await migrateBookingFixes({ dryRun: true });
    expect(report).toEqual({ dryRun: true, promoCodesEnabled: true, settingsUpdated: 1, promosActivated: 1, indexesCreated: 3 });
    expect((await db.collection("settings").findOne({}))?.promoCodesEnabled).toBeUndefined();
    expect((await db.collection("promocodes").findOne({ code: "SAVE10" }))?.active).toBeUndefined();
  });

  it("applies once and stays idempotent", async () => {
    const db = await seed(
      { primaryColor: "#B45309", promoCodesEnabled: false },
      [{ code: "SAVE10", kind: "percent", amount: 10 }, { code: "OFF", kind: "fixed", amount: 5, active: false }],
    );
    const report = await migrateBookingFixes({ dryRun: false });
    expect(report).toEqual({ dryRun: false, promoCodesEnabled: true, settingsUpdated: 1, promosActivated: 1, indexesCreated: 3 });
    expect((await db.collection("settings").findOne({}))?.promoCodesEnabled).toBe(true);
    expect((await db.collection("promocodes").findOne({ code: "SAVE10" }))?.active).toBe(true);

    const again = await migrateBookingFixes({ dryRun: false });
    expect(again.settingsUpdated).toBe(0);
    expect(again.promosActivated).toBe(0);
    expect(again.indexesCreated).toBe(0);
  });

  it("disables promos when no active code remains", async () => {
    const db = await seed({ promoCodesEnabled: true }, [{ code: "OFF", kind: "fixed", amount: 5, active: false }]);
    const report = await migrateBookingFixes({ dryRun: false });
    expect(report.promoCodesEnabled).toBe(false);
    expect((await db.collection("settings").findOne({}))?.promoCodesEnabled).toBe(false);
  });
});
