import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { connectDB } from "@/shared/db";
import { migratePricingV2 } from "@/features/pricing/lib/migrate-pricing-v2";

const vehicle = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  price: 10,
  pricePerKm: 2,
  pricePerHour: 30,
  minimumFare: 20,
  minimumHours: 2,
  returnPricePercentage: 100,
  discount: 0,
  stopPrice: 0,
  stopPricePerHour: 0,
  priceTiers: [],
  isActive: true,
  childSeatPrice: 10,
  babySeatPrice: 10,
  ...extra,
});

async function seed(rule: Record<string, unknown>, vehicles: Record<string, unknown>[]) {
  await connectDB();
  const db = mongoose.connection.db!;
  await Promise.all(["pricingrules", "vehicles", "zoneprices", "fixedroutes"].map((name) => db.collection(name).deleteMany({})));
  await db.collection("pricingrules").insertOne(rule);
  await db.collection("vehicles").insertMany(vehicles);
  await db.collection("zoneprices").insertMany([
    { fromLabel: "Geneva Airport", toLabel: "Lausanne", price: 40 },
    { fromLabel: "Nowhere-xyz", toLabel: "Lausanne", price: 55 },
  ]);
  return db;
}

describe("pricing v2 migration", () => {
  it("dry-run writes nothing and shows unchanged quotes for uniform seat prices", async () => {
    const db = await seed(
      { meetGreetPrice: 15, operatorMinimumFare: 0, holidays: [{ date: "2026-12-25", percent: 10 }] },
      [vehicle("Sedan"), vehicle("Van", { price: 20 })],
    );
    const report = await migratePricingV2({ dryRun: true });
    expect(report.quoteDiffs).toEqual([]);
    expect(report.quotesChecked).toBe(8);
    expect(report.extras).toEqual({
      meetGreet: { enabled: true, price: 15 },
      childSeat: { enabled: true, price: 10 },
      babySeat: { enabled: true, price: 10 },
    });
    expect(await db.collection("fixedroutes").countDocuments()).toBe(0);
    expect((await db.collection("vehicles").findOne({ name: "Sedan" }))?.childSeatPrice).toBe(10);
  });

  it("applies once, idempotently, and reports seat price and minimum changes", async () => {
    const db = await seed(
      { meetGreetPrice: 0, operatorMinimumFare: 30, holidays: [{ date: "2026-12-25", percent: 10 }] },
      [vehicle("Sedan", { childSeatPrice: 5 }), vehicle("Van")],
    );
    const report = await migratePricingV2({ dryRun: false });
    expect(report.seatPriceDiffers).toEqual(["Sedan"]);
    expect(report.quoteDiffs.some((diff) => diff.vehicle === "Sedan" && diff.sample === 3)).toBe(true);
    const rule = await db.collection("pricingrules").findOne({});
    expect(rule?.operatorMinimumFare).toBeUndefined();
    expect(rule?.meetGreetPrice).toBeUndefined();
    expect(rule?.extras.meetGreet).toEqual({ enabled: false, price: 0 });
    expect(rule?.holidays).toEqual([{ start: "2026-12-25", end: "2026-12-25", percent: 10 }]);
    const sedan = await db.collection("vehicles").findOne({ name: "Sedan" });
    expect(sedan?.minimumFare).toBe(30);
    expect(sedan?.childSeatPrice).toBeUndefined();
    expect(await db.collection("fixedroutes").countDocuments()).toBe(0);
    expect(await db.collection("zoneprices").countDocuments()).toBe(2);

    const again = await migratePricingV2({ dryRun: false });
    expect(again.vehiclesUpdated).toBe(2);
  });
});
