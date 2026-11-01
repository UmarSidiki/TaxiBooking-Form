import { describe, expect, it } from "vitest";
import type { FormData } from "@/features/booking/context/booking-form-context";
import { applyBookingTypeChange } from "@/features/booking/lib/apply-booking-type-change";

const roundTrip = {
  bookingType: "destination",
  pickup: "Geneva Airport",
  pickupLatLng: { lat: 46.23, lng: 6.1 },
  dropoff: "Chamonix",
  dropoffLatLng: { lat: 45.92, lng: 6.87 },
  stops: [{ location: "Annecy", order: 0 }],
  tripType: "roundtrip",
  date: "2026-12-01",
  time: "10:00",
  returnDate: "2026-12-03",
  returnTime: "18:00",
  duration: 3,
} as unknown as FormData;

describe("applyBookingTypeChange", () => {
  it("hourly drops the return leg, drop-off and stops but keeps pickup and start", () => {
    const next = applyBookingTypeChange(roundTrip, "hourly");
    expect(next).toMatchObject({
      bookingType: "hourly", tripType: "oneway", returnDate: "", returnTime: "",
      dropoff: "", dropoffLatLng: null, stops: [],
      pickup: "Geneva Airport", pickupLatLng: { lat: 46.23, lng: 6.1 }, date: "2026-12-01", time: "10:00", duration: 3,
    });
  });
  it("back to destination keeps current inputs untouched", () => {
    const hourly = applyBookingTypeChange(roundTrip, "hourly");
    expect(applyBookingTypeChange(hourly, "destination")).toEqual({ ...hourly, bookingType: "destination" });
  });
  it("does not mutate the previous state", () => {
    applyBookingTypeChange(roundTrip, "hourly");
    expect(roundTrip.tripType).toBe("roundtrip");
  });
});
