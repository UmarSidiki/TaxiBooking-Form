import mongoose from "mongoose";
import type { IVehicle } from "@/features/fleet/model";
import { normalizeHolidays } from "@/features/pricing/lib/holidays";
import { quoteFare, type PricingExtras, type QuoteInput } from "@/features/pricing/lib/quote-fare";

export type Geocode = (label: string) => Promise<{ lat: number; lng: number; label: string; placeId?: string } | null>;

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

/** Google Geocoding, server key from env. Returns null when unavailable. */
export const googleGeocode: Geocode = async (label) => {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(label)}&key=${key}`);
  const data = await response.json().catch(() => null);
  const hit = data?.status === "OK" ? data.results?.[0] : null;
  return hit ? { lat: hit.geometry.location.lat, lng: hit.geometry.location.lng, label: hit.formatted_address || label, placeId: hit.place_id } : null;
};

/**
 * Moves seat prices and meet & greet into PricingRule.extras (highest seat price
 * across active vehicles), folds the operator minimum into each vehicle minimum,
 * turns single-date holidays into ranges, and converts label zones into
 * geocoded fixed routes. Idempotent; `dryRun` writes nothing.
 */
export async function migratePricingV2({ dryRun, geocode = googleGeocode }: { dryRun: boolean; geocode?: Geocode }) {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");
  const rules = db.collection<LegacyRule>("pricingrules");
  const vehicles = db.collection<LegacyVehicle>("vehicles");
  const zones = db.collection<{ _id: unknown; fromLabel: string; toLabel: string; price: number }>("zoneprices");
  const routes = db.collection("fixedroutes");

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

  const legacyZones = await zones.find({}).toArray();
  const done = new Set((await routes.find({ migratedFromZone: { $exists: true } }, { projection: { migratedFromZone: 1 } }).toArray()).map((row) => String(row.migratedFromZone)));
  const pendingZones = legacyZones.filter((zone) => !done.has(String(zone._id)));
  const converted = [];
  for (const zone of pendingZones) {
    const [from, to] = await Promise.all([geocode(zone.fromLabel), geocode(zone.toLabel)]);
    converted.push({
      migratedFromZone: zone._id,
      from: [{ label: from?.label ?? zone.fromLabel, lat: from?.lat ?? 0, lng: from?.lng ?? 0, placeId: from?.placeId, radiusKm: 2 }],
      to: [{ label: to?.label ?? zone.toLabel, lat: to?.lat ?? 0, lng: to?.lng ?? 0, placeId: to?.placeId, radiusKm: 2 }],
      price: zone.price,
      bothWays: false,
      needsReview: !from || !to,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    if (converted.length) await routes.insertMany(converted);
  }

  return {
    dryRun,
    extras,
    operatorMinimumFoldedIntoVehicles: operatorMinimum,
    vehiclesUpdated: fleet.length,
    seatPriceDiffers,
    holidays: holidays.length,
    zonesConverted: converted.length,
    zonesNeedingReview: converted.filter((route) => route.needsReview).length,
    quotesChecked: active.length * SAMPLES.length,
    quoteDiffs,
  };
}
