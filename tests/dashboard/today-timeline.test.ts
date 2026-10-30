import { describe, expect, it } from "vitest";
import { buildTimeline, zonedToday, type TimelineRide } from "@/features/dashboard/lib/today-timeline";

const ride = (time: string, id = time): TimelineRide => ({ _id: id, tripId: id, time, pickup: "A", status: "upcoming" });

describe("buildTimeline", () => {
  it("covers the working day with empty hours", () => {
    const rows = buildTimeline([]);
    expect(rows[0].hour).toBe(6);
    expect(rows.at(-1)?.hour).toBe(22);
    expect(rows.every((r) => r.rides.length === 0)).toBe(true);
  });

  it("buckets and sorts rides, stretching for early and late ones", () => {
    const rows = buildTimeline([ride("09:45"), ride("09:05"), ride("04:30"), ride("23:10")]);
    expect(rows[0].hour).toBe(4);
    expect(rows.at(-1)?.hour).toBe(23);
    expect(rows.find((r) => r.hour === 9)?.rides.map((r) => r.time)).toEqual(["09:05", "09:45"]);
  });

  it("ignores malformed times", () => {
    expect(buildTimeline([ride("soon")]).flatMap((r) => r.rides)).toEqual([]);
  });
});

describe("zonedToday", () => {
  it("returns the date and hour in the given zone", () => {
    const now = new Date("2026-10-30T23:30:00Z");
    expect(zonedToday(now, "Europe/Zurich")).toEqual({ date: "2026-10-31", hour: 0 });
    expect(zonedToday(now, "UTC")).toEqual({ date: "2026-10-30", hour: 23 });
  });
});
