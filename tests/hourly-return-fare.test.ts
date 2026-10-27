import { describe, expect, it } from "vitest";
import type { IVehicle } from "@/features/fleet/model";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import { quoteFare } from "@/features/pricing/lib/quote-fare";

const vehicle = {
  price: 10,
  pricePerKm: 2,
  pricePerHour: 30,
  minimumHours: 2,
  minimumFare: 20,
  returnPricePercentage: 80,
  discount: 0,
  stopPrice: 0,
  stopPricePerHour: 0,
  priceTiers: [],
} as unknown as IVehicle;

const rules = {
  fixedRoutes: [{
    from: [{ label: "Geneva Airport", lat: 46.2381, lng: 6.109, radiusKm: 2 }],
    to: [{ label: "Lausanne", lat: 46.5197, lng: 6.6323, radiusKm: 3 }],
    price: 40,
  }],
  endpoints: { pickup: { lat: 46.2391, lng: 6.11 }, dropoff: { lat: 46.517, lng: 6.629 } },
  night: { start: "22:00", end: "06:00", percent: 10 },
  holidays: [{ start: "2026-12-25", end: "2026-12-25", percent: 0 }],
  extras: { meetGreet: { enabled: true, price: 15 }, childSeat: { enabled: true, price: 5 }, babySeat: { enabled: true, price: 0 } },
};

describe("hourly and return fares", () => {
  it("bills hourly from the vehicle hour rate and minimum hours, not the zone price", () => {
    const direct = calculateBookingPrice(
      vehicle,
      { bookingType: "hourly", duration: 1, tripType: "oneway" },
      {},
    );
    expect(direct.breakdown.vehiclePrice).toBe(60);
    const quote = quoteFare(
      vehicle,
      {
        bookingType: "hourly",
        duration: 1,
        pickup: "Geneva Airport",
        dropoff: "Lausanne Station",
        time: "23:00",
        date: "2026-12-20",
        meetAndGreet: true,
      },
      {},
      25,
      rules,
      { code: "HALF", kind: "percent", amount: 50 },
    );
    expect(quote.lines.find((line) => line.code === "vehicle")?.amount).toBe(60);
    expect(quote.lines.find((line) => line.code === "night")?.amount).toBe(7.5);
    expect(quote.lines.find((line) => line.code === "meet_greet")?.amount).toBe(15);
    expect(quote.lines.find((line) => line.code === "promo")?.amount).toBe(-41.25);
    expect(quote.total).toBe(41.25);
  });

  it("applies the return percentage on top of a zone price", () => {
    const quote = quoteFare(
      vehicle,
      {
        bookingType: "destination",
        tripType: "roundtrip",
        pickup: "Geneva Airport",
        dropoff: "Lausanne Station",
        date: "2026-12-16",
        time: "09:30",
      },
      { enableTax: true, taxPercentage: 10 },
      25,
      rules,
    );
    expect(quote.lines.find((line) => line.code === "vehicle")?.amount).toBe(72);
    expect(quote.taxAmount).toBe(7.2);
    expect(quote.total).toBe(79.2);
  });
});
