import { afterAll, describe, expect, it, vi } from "vitest";
import type { IVehicle } from "@/features/fleet/model";
import { haversineKm, matchFixedRoute } from "@/features/pricing/lib/fixed-routes";
import {
  activeHolidays,
  holidayCutoff,
  holidayPercentFor,
  normalizeHolidays,
  rangesOverlap,
} from "@/features/pricing/lib/holidays";
import { disabledExtrasRequested, defaultExtras, quoteFare } from "@/features/pricing/lib/quote-fare";
import { pricingRuleWriteSchema } from "@/features/pricing/schema/pricing-write.schema";

const vehicle = {
  price: 100,
  pricePerKm: 0,
  minimumFare: 0,
  returnPricePercentage: 100,
  discount: 0,
  stopPrice: 0,
  stopPricePerHour: 0,
  priceTiers: [],
} as unknown as IVehicle;

const airport = { label: "Geneva Airport", lat: 46.2381, lng: 6.109, radiusKm: 2 };
const lausanne = { label: "Lausanne", lat: 46.5197, lng: 6.6323, radiusKm: 3 };
const route = { from: [airport], to: [lausanne], price: 40 };

describe("holiday ranges", () => {
  const ranges = normalizeHolidays([
    { start: "2026-12-24", end: "2026-12-26", percent: 10 },
    { start: "2026-12-25", end: "2026-12-25", percent: 25 },
  ]);

  it("covers the whole range inclusively and uses only the highest overlapping percent", () => {
    expect(holidayPercentFor("2026-12-23", ranges)).toBe(0);
    expect(holidayPercentFor("2026-12-24", ranges)).toBe(10);
    expect(holidayPercentFor("2026-12-25", ranges)).toBe(25);
    expect(holidayPercentFor("2026-12-26", ranges)).toBe(10);
    expect(holidayPercentFor("2026-12-27", ranges)).toBe(0);
    expect(rangesOverlap(ranges[0], ranges[1])).toBe(true);
    expect(rangesOverlap(ranges[0], { start: "2026-12-27", end: "2026-12-27", percent: 5 })).toBe(false);
  });

  it("applies at midnight on the start day and not at 23:59 the day before", () => {
    const rules = { holidays: ranges };
    const before = quoteFare(vehicle, { bookingType: "destination", date: "2026-12-23", time: "23:59" }, {}, undefined, rules);
    const start = quoteFare(vehicle, { bookingType: "destination", date: "2026-12-24", time: "00:00" }, {}, undefined, rules);
    expect(before.total).toBe(100);
    expect(start.total).toBe(110);
  });

  it("migrates legacy single dates to one-day ranges", () => {
    expect(normalizeHolidays([{ date: "2026-12-25", percent: 10 }])).toEqual([
      { start: "2026-12-25", end: "2026-12-25", percent: 10 },
    ]);
    const parsed = pricingRuleWriteSchema.parse({
      nightStart: "22:00",
      nightEnd: "06:00",
      nightPercent: 0,
      holidays: [{ date: "2026-12-25", percent: 10 }],
      extras: defaultExtras(),
    });
    expect(parsed.holidays[0]).toEqual({ start: "2026-12-25", end: "2026-12-25", percent: 10 });
    expect(
      pricingRuleWriteSchema.safeParse({ ...parsed, holidays: [{ start: "2026-12-26", end: "2026-12-25", percent: 5 }] }).success,
    ).toBe(false);
  });

  it("expires 12 hours after the end date in the operator timezone", () => {
    const range = [{ start: "2026-12-24", end: "2026-12-26", percent: 10 }];
    // 2026-12-27 11:59 Zurich (10:59 UTC): still kept.
    expect(activeHolidays(range, new Date("2026-12-27T10:59:00Z"), "Europe/Zurich")).toHaveLength(1);
    // 2026-12-27 12:00 Zurich (11:00 UTC): gone.
    expect(activeHolidays(range, new Date("2026-12-27T11:00:00Z"), "Europe/Zurich")).toHaveLength(0);
    // Same instant in UTC is still before noon, so a UTC operator keeps it.
    expect(activeHolidays(range, new Date("2026-12-27T11:00:00Z"), "UTC")).toHaveLength(1);
    expect(holidayCutoff(new Date("2026-12-27T11:00:00Z"), "Not/AZone")).toBe("2026-12-26");
  });

  it("surcharges only the return leg when only the return date is a holiday", () => {
    const rules = { holidays: [{ start: "2026-12-25", end: "2026-12-25", percent: 10 }] };
    const quote = quoteFare(
      vehicle,
      { bookingType: "destination", tripType: "roundtrip", date: "2026-12-24", time: "10:00", returnDate: "2026-12-25", returnTime: "10:00" },
      {},
      undefined,
      rules,
    );
    expect(quote.lines.find((line) => line.code === "vehicle")?.amount).toBe(200);
    expect(quote.lines.find((line) => line.code === "holiday")?.amount).toBe(10);
    expect(quote.total).toBe(210);
  });

  it("evaluates the night surcharge per leg", () => {
    const quote = quoteFare(
      vehicle,
      { bookingType: "destination", tripType: "roundtrip", date: "2026-12-10", time: "12:00", returnDate: "2026-12-10", returnTime: "23:00" },
      {},
      undefined,
      { night: { start: "22:00", end: "06:00", percent: 20 } },
    );
    expect(quote.lines.find((line) => line.code === "night")?.amount).toBe(20);
  });
});

describe("fixed routes", () => {
  it("matches inside both radii and falls back outside", () => {
    // ~1.5 km north of the airport point.
    const near = { lat: airport.lat + 0.0135, lng: airport.lng };
    const far = { lat: airport.lat + 0.0225, lng: airport.lng };
    expect(haversineKm(airport, near)).toBeCloseTo(1.5, 1);
    expect(matchFixedRoute(near, lausanne, [route])).toBe(40);
    expect(matchFixedRoute(far, lausanne, [route])).toBeUndefined();
    expect(matchFixedRoute(lausanne, near, [route])).toBeUndefined();
    expect(matchFixedRoute(lausanne, near, [{ ...route, bothWays: true }])).toBe(40);
  });

  it("accepts any address on either side and prefers the tightest route", () => {
    const station = { label: "Geneva station", lat: 46.2102, lng: 6.1424, radiusKm: 1 };
    const wide = { ...route, from: [{ ...airport, radiusKm: 10 }], price: 55 };
    const multi = { ...route, from: [airport, station], price: 45 };
    expect(matchFixedRoute(station, lausanne, [wide, multi])).toBe(45);
    expect(matchFixedRoute(undefined, lausanne, [multi])).toBeUndefined();
  });
});

describe("extras", () => {
  it("flags requested extras that are switched off and prices them at zero", () => {
    const extras = { ...defaultExtras(), childSeat: { enabled: true, price: 7 } };
    expect(disabledExtrasRequested({ meetAndGreet: true, childSeats: 1, babySeats: 1 }, extras)).toEqual(["meetGreet", "babySeat"]);
    const quote = quoteFare(vehicle, { bookingType: "destination", meetAndGreet: true, childSeats: 2 }, {}, undefined, { extras });
    expect(quote.lines.find((line) => line.code === "meet_greet")).toBeUndefined();
    expect(quote.lines.find((line) => line.code === "child_seats")?.amount).toBe(14);
  });
});

vi.mock("@/features/payments/lib/fare/route-distance", () => ({
  fetchRoute: vi.fn(async () => ({ km: 60, pickup: { lat: 46.0, lng: 7.5 }, dropoff: { lat: 46.5197, lng: 6.6323 } })),
  fetchRouteDistanceKm: vi.fn(async () => 60),
}));

afterAll(() => {
  vi.doUnmock("@/features/payments/lib/fare/route-distance");
  vi.resetModules();
});

describe("priceServerBooking", () => {
  it("measures endpoints on the server, ignoring client coordinates, and rejects disabled extras", async () => {
    const { priceServerBooking } = await import("@/features/pricing/lib/price-server-booking");
    const FixedRoute = (await import("@/features/pricing/model/FixedRoute")).default;
    const PricingRule = (await import("@/features/pricing/model/PricingRule")).default;
    await FixedRoute.create(route);
    await PricingRule.create({ extras: { ...defaultExtras(), childSeat: { enabled: true, price: 5 } } });
    const booking = {
      bookingType: "destination" as const,
      tripType: "oneway" as const,
      pickup: "Geneva Airport",
      dropoff: "Lausanne",
      // A spoofer claims to start at the airport; the server-measured start is far away.
      pickupLat: airport.lat,
      pickupLng: airport.lng,
    };
    const spoofed = await priceServerBooking({ vehicle, booking, distanceKm: 60, tax: {} });
    expect(spoofed.ok && spoofed.quote.lines[0].amount).toBe(100);

    const honest = await priceServerBooking({
      vehicle,
      booking,
      distanceKm: 60,
      tax: {},
      measureRoute: async () => ({ km: 60, pickup: { lat: airport.lat, lng: airport.lng }, dropoff: lausanne }),
    });
    expect(honest.ok && honest.quote.lines[0].amount).toBe(40);

    const meet = await priceServerBooking({ vehicle, booking: { ...booking, meetAndGreet: true }, tax: {} });
    expect(meet).toEqual({ ok: false, error: "extra_disabled" });
    const seat = await priceServerBooking({ vehicle, booking: { ...booking, childSeats: 1 }, tax: {} });
    expect(seat.ok).toBe(true);
  });

  it("prunes expired holiday ranges with one update", async () => {
    const { pruneExpiredHolidays } = await import("@/features/pricing/lib/prune-holidays");
    const PricingRule = (await import("@/features/pricing/model/PricingRule")).default;
    await PricingRule.create({
      holidays: [
        { start: "2026-12-20", end: "2026-12-21", percent: 5 },
        { start: "2026-12-25", end: "2026-12-26", percent: 10 },
      ],
    });
    expect(await pruneExpiredHolidays(new Date("2026-12-27T13:00:00Z"))).toBe(1);
    const rule = await PricingRule.findOne().lean<{ holidays: { end: string }[] }>();
    expect(rule?.holidays.map((h) => h.end)).toEqual([]);
  });
});
