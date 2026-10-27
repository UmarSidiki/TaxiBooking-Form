import mongoose from "mongoose";
import type { IVehicle } from "@/features/fleet/model";
import { normalizeHolidays } from "@/features/pricing/lib/holidays";
import { quoteFare, type PricingExtras, type QuoteInput } from "@/features/pricing/lib/quote-fare";

type LegacyRule = {
  _id: unknown;
  meetGreetPrice?: number;
  operatorMinimumFare?: number;
  holidays?: { date?: string; start?: string; end?: string; percent?: number }[];
  extras?: Partial<PricingExtras>;
};
type LegacyVehicle = IVehicle & { _id: unknown; childSeatPrice?: number; babySeatPrice?: number };

const SAMPLES: (QuoteInput & { km?: number })[] = [
  { bookingType: "destination", tripType: "oneway", km: 3 },
  { bookingType: "destination", tripType: "oneway", km: 40 },
  { bookingType: "destination", tripType: "roundtrip", km: 15 },
  { bookingType: "destination", tripType: "oneway", km: 20, childSeats: 1, babySeats: 1, meetAndGreet: true },
];

/**
 * Moves seat prices and meet & greet into PricingRule.extras (highest seat price
 * across active vehicles), folds the operator minimum into each vehicle minimum,
 * and turns single-date holidays into ranges. Legacy zone/fixed-route collections are left
 * untouched and ignored. Idempotent; `dryRun` writes nothing.
 */
export async function migratePricingV2({ dryRun }: { dryRun: boolean }) {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  const rules = db.collection<LegacyRule>("pricingrules");
  const vehicles = db.collection<LegacyVehicle>("vehicles");

  const rule = await rules.findOne({});
  const fleet = await vehicles.find({}).toArray();
  const active = fleet.filter((vehicle) => vehicle.isActive !== false);
  const highest = (key: "childSeatPrice" | "babySeatPrice") => Math.max(0, ...active.map((vehicle) => Number(vehicle[key]) || 0));
  const operatorMinimum = Number(rule?.operatorMinimumFare) || 0;
  const meetPrice = Number(rule?.meetGreetPrice) || 0;
  const extras: PricingExtras = rule?.extras?.meetGreet
    ? (rule.extras as PricingExtras)
    : {
        meetGreet: { enabled: meetPrice > 0, price: meetPrice },
        childSeat: { enabled: highest("childSeatPrice") > 0, price: highest("childSeatPrice") },
        babySeat: { enabled: highest("babySeatPrice") > 0, price: highest("babySeatPrice") },
      };
  const seatPriceDiffers = active
    .filter((vehicle) => (vehicle.childSeatPrice ?? extras.childSeat.price) !== extras.childSeat.price || (vehicle.babySeatPrice ?? extras.babySeat.price) !== extras.babySeat.price)
    .map((vehicle) => String(vehicle.name ?? vehicle._id));

  const quoteDiffs: { vehicle: string; sample: number; before: number; after: number }[] = [];
  for (const vehicle of active) {
    const migrated = { ...vehicle, minimumFare: Math.max(Number(vehicle.minimumFare) || 0, operatorMinimum) } as IVehicle;
    SAMPLES.forEach((sample, index) => {
      const legacyExtras: PricingExtras = {
        meetGreet: { enabled: true, price: meetPrice },
        childSeat: { enabled: true, price: Number(vehicle.childSeatPrice) || 0 },
        babySeat: { enabled: true, price: Number(vehicle.babySeatPrice) || 0 },
      };
      const beforeRaw = quoteFare(vehicle, sample, {}, sample.km, { extras: legacyExtras }).total;
      const before = Math.max(beforeRaw, operatorMinimum);
      const after = quoteFare(migrated, sample, {}, sample.km, { extras }).total;
      if (Math.abs(before - after) > 0.005) quoteDiffs.push({ vehicle: String(vehicle.name ?? vehicle._id), sample: index, before, after });
    });
  }

  const holidays = normalizeHolidays(rule?.holidays);
  if (!dryRun) {
    if (rule) {
      await rules.updateOne({ _id: rule._id }, { $set: { extras, holidays }, $unset: { meetGreetPrice: "", operatorMinimumFare: "" } });
    }
    for (const vehicle of fleet) {
      await vehicles.updateOne(
        { _id: vehicle._id },
        {
          $set: { minimumFare: Math.max(Number(vehicle.minimumFare) || 0, operatorMinimum) },
          $unset: { childSeatPrice: "", babySeatPrice: "" },
        },
      );
    }
  }

  return {
    dryRun,
    extras,
    operatorMinimumFoldedIntoVehicles: operatorMinimum,
    vehiclesUpdated: fleet.length,
    seatPriceDiffers,
    holidays: holidays.length,
    quotesChecked: active.length * SAMPLES.length,
    quoteDiffs,
  };
}
