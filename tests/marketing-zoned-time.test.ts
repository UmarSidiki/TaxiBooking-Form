import { describe, expect, it } from "vitest";

import { utcToZonedWallTime, zonedWallTimeToUtc } from "@/features/marketing/lib/zoned-time";

describe("zonedWallTimeToUtc", () => {
  it("reads wall time in the operator zone", () => {
    expect(zonedWallTimeToUtc("2026-11-02T09:30", "Asia/Karachi")?.toISOString()).toBe("2026-11-02T04:30:00.000Z");
    expect(zonedWallTimeToUtc("2026-07-01T10:00", "Europe/Zurich")?.toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(zonedWallTimeToUtc("2026-12-01T10:00", "Europe/Zurich")?.toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });
  it("handles DST change days and bad input", () => {
    expect(zonedWallTimeToUtc("2026-03-29T12:00", "Europe/Zurich")?.toISOString()).toBe("2026-03-29T10:00:00.000Z");
    expect(zonedWallTimeToUtc("2026-10-25T12:00", "Europe/Zurich")?.toISOString()).toBe("2026-10-25T11:00:00.000Z");
    expect(zonedWallTimeToUtc("nope", "UTC")).toBeNull();
    expect(zonedWallTimeToUtc("2026-01-01T00:00", "Not/AZone")?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
  it("round-trips", () => {
    const d = new Date("2026-11-01T11:06:00Z");
    expect(utcToZonedWallTime(d, "Asia/Karachi")).toBe("2026-11-01T16:06");
    expect(zonedWallTimeToUtc(utcToZonedWallTime(d, "America/New_York"), "America/New_York")?.toISOString()).toBe(d.toISOString());
  });
});
