import { describe, expect, it } from "vitest";
import type { IVehicle } from "@/features/fleet/model";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import { isNightTime, matchZonePrice, quoteFare } from "@/features/pricing/lib/quote-fare";
import { loadPromo, redeemPromo } from "@/features/pricing/lib/redeem-promo";
import PromoCode from "@/features/pricing/model/PromoCode";

const vehicle = {
  price: 10,
  pricePerKm: 2,
  minimumFare: 20,
  childSeatPrice: 5,
  babySeatPrice: 0,
  discount: 0,
  returnPricePercentage: 100,
  stopPrice: 0,
  stopPricePerHour: 0,
  priceTiers: [],
} as unknown as IVehicle;

const trip = {
  bookingType: "destination" as const,
  tripType: "oneway" as const,
  pickup: "Geneva Airport",
  dropoff: "Lausanne Station",
  childSeats: 1,
  date: "2026-12-25",
  time: "23:00",
};

describe("quoteFare", () => {
  it("matches calculateBookingPrice when no operator rules are set", () => {
    const base = calculateBookingPrice(vehicle, trip, { enableTax: true, taxPercentage: 10 }, 25);
    const quote = quoteFare(vehicle, trip, { enableTax: true, taxPercentage: 10 }, 25, {});
    expect(quote.total).toBe(base.total);
    expect(quote.lines.find((line) => line.code === "child_seats")?.amount).toBe(5);
  });

  it("uses a zone price, then night, holiday, meet & greet, minimum, and a percent promo", () => {
    const quote = quoteFare(
      vehicle,
      { ...trip, meetAndGreet: true },
      { enableTax: true, taxPercentage: 10 },
      25,
      {
        zones: [{ fromLabel: "Geneva Airport", toLabel: "Lausanne", price: 40 }],
        night: { start: "22:00", end: "06:00", percent: 10 },
        holidays: [{ date: "2026-12-25", percent: 10 }],
        meetGreetPrice: 15,
        operatorMinimumFare: 0,
      },
      { code: "SAVE10", kind: "percent", amount: 10 },
    );
    expect(matchZonePrice("Geneva Airport T1", "Lausanne Station", [
      { fromLabel: "Geneva Airport", toLabel: "Lausanne", price: 40 },
    ])).toBe(40);
    expect(isNightTime("23:00", "22:00", "06:00")).toBe(true);
    expect(isNightTime("12:00", "22:00", "06:00")).toBe(false);
    expect(quote.lines.find((line) => line.code === "vehicle")?.amount).toBe(40);
    expect(quote.lines.find((line) => line.code === "meet_greet")?.amount).toBe(15);
    expect(quote.lines.find((line) => line.code === "promo")?.amount).toBeLessThan(0);
    expect(quote.total).toBeGreaterThan(0);
    expect(quote.promoCode).toBe("SAVE10");
  });

  it("floors the fare at the operator minimum without replacing the vehicle minimum", () => {
    const quote = quoteFare(
      vehicle,
      { ...trip, time: "12:00", childSeats: 0 },
      {},
      1,
      { operatorMinimumFare: 80 },
    );
    expect(quote.lines.find((line) => line.code === "minimum")?.amount).toBeGreaterThan(0);
    expect(quote.total).toBe(80);
  });
});

describe("promo redemption", () => {
  it("rejects an unknown code and enforces the total use limit", async () => {
    expect((await loadPromo("NOPE", "ada@example.com")).ok).toBe(false);
    const created = await PromoCode.create({
      code: "ONCE",
      kind: "fixed",
      amount: 5,
      maxUses: 1,
      maxUsesPerCustomer: 1,
    });
    const loaded = await loadPromo("once", "ada@example.com");
    expect(loaded.ok).toBe(true);
    expect((await redeemPromo(String(created._id), "ada@example.com")).ok).toBe(true);
    const blocked = await loadPromo("ONCE", "ada@example.com");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("promo_limit");
  });
});
