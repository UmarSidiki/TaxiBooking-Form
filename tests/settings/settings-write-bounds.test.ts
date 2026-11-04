import { describe, expect, it } from "vitest";
import { settingsWriteSchema } from "@/features/settings/schema/settings-write.schema";

const square = [
  { lat: 46.3, lng: 6.0 },
  { lat: 46.3, lng: 6.3 },
  { lat: 46.1, lng: 6.3 },
];

describe("settings write schema: service area", () => {
  it("keeps a drawn polygon and its bounding box", () => {
    const parsed = settingsWriteSchema.parse({
      mapPolygonPoints: square,
      mapBounds: { north: 46.3, south: 46.1, east: 6.3, west: 6.0 },
    });
    expect(parsed.mapPolygonPoints).toEqual(square);
    expect(parsed.mapBounds).toEqual({ north: 46.3, south: 46.1, east: 6.3, west: 6.0 });
  });

  it("accepts Clear bounds (both null) and stores no polygon", () => {
    const parsed = settingsWriteSchema.safeParse({ mapPolygonPoints: null, mapBounds: null });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.mapPolygonPoints).toEqual([]);
    expect(parsed.data?.mapBounds).toBeNull();
  });

  it("drops the _id Mongo adds to stored points", () => {
    const parsed = settingsWriteSchema.parse({
      mapPolygonPoints: square.map((p, i) => ({ ...p, _id: `id${i}` })),
    });
    expect(parsed.mapPolygonPoints).toEqual(square);
  });
});
