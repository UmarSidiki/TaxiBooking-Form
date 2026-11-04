import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { Setting } from "@/features/settings/model";
import { Booking } from "@/features/booking/model";
import { createVehicle } from "./helpers/fixtures";
import { POST as quoteRoute } from "@/app/api/quote/route";
import { POST as bookingRoute } from "@/app/api/booking/route";

const inside = { lat: 46.5, lng: 6.5 };
const outside = { lat: 48, lng: 6.5 };
let vehicleId = "";

const TRIP = {
  bookingType: "hourly" as const,
  duration: 2,
  pickup: "Lausanne",
  dropoff: "Hotel",
  tripType: "oneway" as const,
  date: "2026-12-01",
  time: "10:00",
  passengers: 2,
  childSeats: 0,
  babySeats: 0,
};
const CUSTOMER = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+14155552671",
  notes: "",
  paymentMethod: "cash",
  whatsappOptIn: false,
  locale: "en",
};

async function post(route: (r: NextRequest) => Promise<Response>, path: string, body: object) {
  const res = await route(
    new NextRequest(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, selectedVehicle: vehicleId }),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(async () => {
  vehicleId = String((await createVehicle())._id);
});

describe("server-side service area", () => {
  it("quotes anywhere when no bounds are set", async () => {
    await Setting.create({ acceptedPaymentMethods: ["cash"] });
    const res = await post(quoteRoute, "/api/quote", TRIP);
    expect(res.status).toBe(200);
  });

  it("rejects quotes outside rectangle bounds and without coordinates", async () => {
    await Setting.create({ acceptedPaymentMethods: ["cash"], mapBounds: { north: 47, south: 46, east: 7, west: 6 } });
    expect(await post(quoteRoute, "/api/quote", { ...TRIP, pickupLatLng: outside }))
      .toEqual({ status: 400, body: { error: "outside_service_area" } });
    expect(await post(quoteRoute, "/api/quote", TRIP)).toEqual({ status: 400, body: { error: "location_required" } });
    expect((await post(quoteRoute, "/api/quote", { ...TRIP, pickupLatLng: inside })).status).toBe(200);
  });

  it("refuses to create a booking outside the polygon", async () => {
    await Setting.create({
      acceptedPaymentMethods: ["cash"],
      mapPolygonPoints: [
        { lat: 46, lng: 6 },
        { lat: 46, lng: 7 },
        { lat: 47, lng: 7 },
        { lat: 47, lng: 6 },
      ],
    });
    const rejected = await post(bookingRoute, "/api/booking", { ...TRIP, ...CUSTOMER, pickupLatLng: outside });
    expect(rejected.status).toBe(400);
    expect(JSON.stringify(rejected.body)).toContain("outside_service_area");
    expect(await Booking.countDocuments()).toBe(0);
    const ok = await post(bookingRoute, "/api/booking", { ...TRIP, ...CUSTOMER, pickupLatLng: inside });
    expect(ok.status).toBeLessThan(300);
  });
});
