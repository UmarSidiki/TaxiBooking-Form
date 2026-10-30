import { describe, expect, it } from "vitest";
import {
  checkTripServiceArea,
  isInServiceArea,
  serviceAreaFrom,
} from "@/features/booking/lib/service-area";

const square = [
  { lat: 46, lng: 6 },
  { lat: 46, lng: 7 },
  { lat: 47, lng: 7 },
  { lat: 47, lng: 6 },
];
const rect = { north: 47, south: 46, east: 7, west: 6 };
const inside = { lat: 46.5, lng: 6.5 };
const outside = { lat: 48, lng: 6.5 };

describe("service area", () => {
  it("accepts points inside a polygon and rejects points outside", () => {
    const area = serviceAreaFrom({ mapPolygonPoints: square });
    expect(isInServiceArea(inside, area)).toBe(true);
    expect(isInServiceArea(outside, area)).toBe(false);
  });

  it("falls back to rectangle bounds when no polygon is set", () => {
    const area = serviceAreaFrom({ mapPolygonPoints: [], mapBounds: rect });
    expect(area?.kind).toBe("rect");
    expect(isInServiceArea(inside, area)).toBe(true);
    expect(isInServiceArea(outside, area)).toBe(false);
  });

  it("prefers the polygon over the rectangle", () => {
    const area = serviceAreaFrom({ mapPolygonPoints: square, mapBounds: { north: 60, south: 40, east: 20, west: 0 } });
    expect(isInServiceArea({ lat: 50, lng: 10 }, area)).toBe(false);
  });

  it("has no restriction when no bounds are set", () => {
    expect(serviceAreaFrom({})).toBeNull();
    expect(serviceAreaFrom({ mapPolygonPoints: [inside, outside], mapBounds: null })).toBeNull();
    expect(isInServiceArea(outside, null)).toBe(true);
    expect(checkTripServiceArea({ pickup: "Anywhere" }, null)).toEqual({ ok: true });
  });

  it("requires coordinates for every address and names the failing field", () => {
    const area = serviceAreaFrom({ mapBounds: rect });
    expect(checkTripServiceArea({ pickup: "A", pickupLatLng: inside, dropoff: "B", dropoffLatLng: inside }, area)).toEqual({ ok: true });
    expect(checkTripServiceArea({ pickup: "A" }, area)).toMatchObject({ ok: false, error: "location_required", field: "pickup" });
    expect(checkTripServiceArea({ pickup: "A", pickupLatLng: inside, dropoff: "B", dropoffLatLng: outside }, area))
      .toMatchObject({ ok: false, error: "outside_service_area", field: "dropoff" });
    expect(checkTripServiceArea({ pickup: "A", pickupLatLng: inside, stops: [{ location: "S", latLng: outside }] }, area))
      .toMatchObject({ ok: false, error: "outside_service_area", field: "stops" });
  });
});
