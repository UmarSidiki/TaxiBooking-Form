import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { connectDB } from "@/shared/db";
import { migrateBookingFixes } from "@/features/pricing/lib/migrate-booking-fixes";

async function seed(settings: Record<string, unknown> | null, promos: Record<string, unknown>[]) {
  await connectDB();
  const db = mongoose.connection.db!;
  await db.collection("settings").deleteMany({});
  await db.collection("promocodes").deleteMany({});
  await db.collection("notificationsettings").deleteMany({});
  await db.collection("whatsapptemplates").deleteMany({});
  await db.collection("bookings").drop().catch(() => undefined);
  await db.collection("pendingbookings").drop().catch(() => undefined);
  if (settings) await db.collection("settings").insertOne(settings);
  if (promos.length) await db.collection("promocodes").insertMany(promos);
  return db;
}

const baseReport = { notificationTemplates: 0, notificationToggles: 0 };

describe("booking fixes migration", () => {
  it("dry-run reports changes without writing", async () => {
    const db = await seed({ primaryColor: "#B45309" }, [{ code: "SAVE10", kind: "percent", amount: 10 }]);
    const report = await migrateBookingFixes({ dryRun: true });
    expect(report).toEqual({ dryRun: true, promoCodesEnabled: true, settingsUpdated: 1, promosActivated: 1, indexesCreated: 3, ...baseReport });
    expect((await db.collection("settings").findOne({}))?.promoCodesEnabled).toBeUndefined();
    expect((await db.collection("promocodes").findOne({ code: "SAVE10" }))?.active).toBeUndefined();
  });

  it("applies once and stays idempotent", async () => {
    const db = await seed(
      { primaryColor: "#B45309", promoCodesEnabled: false },
      [{ code: "SAVE10", kind: "percent", amount: 10 }, { code: "OFF", kind: "fixed", amount: 5, active: false }],
    );
    const report = await migrateBookingFixes({ dryRun: false });
    expect(report).toEqual({ dryRun: false, promoCodesEnabled: true, settingsUpdated: 1, promosActivated: 1, indexesCreated: 3, ...baseReport });
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

  it("copies legacy WhatsApp templates and enabled toggles into the registry", async () => {
    const db = await seed(
      { primaryColor: "#B45309", whatsappTplAssigned: true, whatsappTplReminder: true },
      [],
    );
    await db.collection("whatsapptemplates").insertMany([
      { event: "booking_confirmed", audience: "customer", locale: "en", body: "hi {{name}}", enabled: true },
      { event: "booking_confirmed", audience: "customer", locale: "fr", body: "salut {{name}}", enabled: false },
      { event: "driver_assigned", audience: "customer", locale: "en", body: "driver {{plate}}", enabled: true },
    ]);

    const dry = await migrateBookingFixes({ dryRun: true });
    expect(dry.notificationTemplates).toBe(2);
    expect(dry.notificationToggles).toBe(4);
    expect(await db.collection("notificationsettings").countDocuments()).toBe(0);

    const applied = await migrateBookingFixes({ dryRun: false });
    expect(applied.notificationTemplates).toBe(2);
    expect(applied.notificationToggles).toBe(4);
    const rows = await db.collection("notificationsettings").find({}).toArray();
    expect(rows).toHaveLength(6);

    const confirmed = rows.find((row) => row.event === "booking_confirmed" && row.audience === "customer");
    expect(confirmed?.enabled).toBe(true);
    expect(confirmed?.templates.en.body).toBe("hi {{name}}");
    expect(confirmed?.templates.fr.body).toBe("salut {{name}}");

    const assigned = rows.find((row) => row.event === "ride_assigned" && row.audience === "driver");
    expect(assigned?.enabled).toBe(true);

    const cancelled = rows.find((row) => row.event === "ride_cancelled" && row.audience === "partner");
    expect(cancelled).toBeUndefined();

    const again = await migrateBookingFixes({ dryRun: false });
    expect(again.notificationTemplates).toBe(0);
    expect(again.notificationToggles).toBe(0);
  });
});
