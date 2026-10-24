import { describe, expect, it } from "vitest";
import { claimDailyRun, dailyStamp, unclaimDailyRun } from "@/features/cron/lib/daily-gate";
import { withCronLock } from "@/features/cron/lib/cron-lock";
import CronMarker from "@/features/cron/model/CronMarker";

describe("daily cron gate", () => {
  it("claims a UTC day once and releases the claim", async () => {
    const now = new Date("2026-10-24T22:00:00.000Z");
    expect(await claimDailyRun(now)).toBe(dailyStamp(now));
    expect(await claimDailyRun(now)).toBeNull();
    expect(await claimDailyRun(new Date("2026-10-25T00:10:00.000Z"))).toBe("2026-10-25");
    await unclaimDailyRun("2026-10-25");
    expect(await claimDailyRun(new Date("2026-10-25T01:00:00.000Z"))).toBe("2026-10-25");
  });
});

describe("cron lock", () => {
  it("skips a second run while the lock is held", async () => {
    await CronMarker.create({ key: "lock", lockedUntil: new Date(Date.now() + 60_000) });
    const skipped = await withCronLock(async () => "ran");
    expect(skipped.locked).toBe(false);
  });

  it("runs and then releases the lock", async () => {
    const first = await withCronLock(async () => "ran");
    expect(first).toEqual({ locked: true, value: "ran" });
    const second = await withCronLock(async () => "again");
    expect(second).toEqual({ locked: true, value: "again" });
  });
});
