import { describe, expect, it } from "vitest";
import type { IVehicle } from "@/features/fleet/model";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import { isNightTime, quoteFare } from "@/features/pricing/lib/quote-fare";
import { loadPromo, redeemPromo } from "@/features/pricing/lib/redeem-promo";
import PromoCode from "@/features/pricing/model/PromoCode";

const vehicle = {
  price: 10,
  pricePerKm: 2,
  minimumFare: 20,
  discount: 0,
  returnPricePercentage: 100,
  stopPrice: 0,
  stopPricePerHour: 0,
  priceTiers: [],
} as unknown as IVehicle;

const extras = { meetGreet: { enabled: true, price: 15 }, childSeat: { enabled: true, price: 5 }, babySeat: { enabled: true, price: 0 } };
const route = {
    from: [{ label: "Geneva Airport", lat: 46.2381, lng: 6.109, radiusKm: 2 }],
    to: [{ label: "Lausanne", lat: 46.5197, lng: 6.6323, radiusKm: 3 }],
    price: 40,
  };
const endpoints = { pickup: { lat: 46.2391, lng: 6.11 }, dropoff: { lat: 46.517, lng: 6.629 } };

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
    const base = calculateBookingPrice(vehicle, { ...trip, childSeatPrice: 5 }, { enableTax: true, taxPercentage: 10 }, 25);
    const quote = quoteFare(vehicle, trip, { enableTax: true, taxPercentage: 10 }, 25, { extras });
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
        fixedRoutes: [route],
        endpoints,
        night: { start: "22:00", end: "06:00", percent: 10 },
        holidays: [{ start: "2026-12-25", end: "2026-12-25", percent: 10 }],
        extras,
      },
      { code: "SAVE10", kind: "percent", amount: 10 },
    );
    expect(isNightTime("23:00", "22:00", "06:00")).toBe(true);
    expect(isNightTime("12:00", "22:00", "06:00")).toBe(false);
    expect(quote.lines.find((line) => line.code === "vehicle")?.amount).toBe(40);
    expect(quote.lines.find((line) => line.code === "meet_greet")?.amount).toBe(15);
    expect(quote.lines.find((line) => line.code === "promo")?.amount).toBeLessThan(0);
    expect(quote.total).toBeGreaterThan(0);
    expect(quote.promoCode).toBe("SAVE10");
  });

  it("keeps the return percentage stored on a mongoose document when a zone matches", () => {
    const doc = {
      toObject() {
        return {
          price: 10,
          pricePerKm: 2,
          minimumFare: 20,
          returnPricePercentage: 80,
          priceTiers: [],
          stopPrice: 0,
          stopPricePerHour: 0,
        };
      },
    } as unknown as IVehicle;
    const quote = quoteFare(
      doc,
      { ...trip, time: "12:00", childSeats: 0, tripType: "roundtrip" },
      {},
      25,
      { fixedRoutes: [route], endpoints },
    );
    expect(quote.total).toBe(72);
  });

  it("charges the deposit online and keeps the balance", () => {
    const quote = quoteFare(vehicle, { ...trip, time: "12:00", childSeats: 0 }, {}, 25, { depositPercent: 25 });
    expect(quote.chargeAmount).toBeCloseTo(quote.total * 0.25, 2);
    expect(quote.depositDue).toBe(quote.chargeAmount);
    expect(quote.balanceDue).toBeCloseTo(quote.total - quote.chargeAmount, 2);
    expect(quote.chargeAmount).toBeLessThan(quote.total);
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
