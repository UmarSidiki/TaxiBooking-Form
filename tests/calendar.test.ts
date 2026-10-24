import { describe, expect, it } from "vitest";
import { buildIcs } from "@/features/calendar/lib/build-ics";
import { intervalsOverlap, rideDurationMinutes, rideInterval } from "@/features/calendar/lib/ride-window";
import { findAssigneeConflict } from "@/features/calendar/lib/find-assignee-conflict";
import { createDriver, createRide, createVehicle } from "./helpers/fixtures";

describe("calendar", () => {
  it("estimates an hour, two hours for a return, and hourly duration", () => {
    expect(rideDurationMinutes({ tripType: "oneway" })).toBe(60);
    expect(rideDurationMinutes({ tripType: "roundtrip" })).toBe(120);
    expect(rideDurationMinutes({ bookingType: "hourly", duration: 3 })).toBe(180);
  });

  it("warns when a driver already has an overlapping ride", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    await createRide({
      selectedVehicle: vehicle._id,
      date: "2026-12-01",
      time: "10:00",
      status: "upcoming",
      assignedDriver: { _id: driver._id, name: driver.name, email: driver.email },
    });
    const conflict = await findAssigneeConflict({
      field: "assignedDriver._id",
      assigneeId: String(driver._id),
      booking: { date: "2026-12-01", time: "10:30", tripType: "oneway" },
    });
    expect(conflict).toMatch(/Overlaps/);
    const later = rideInterval({ date: "2026-12-01", time: "12:00", tripType: "oneway" });
    const first = rideInterval({ date: "2026-12-01", time: "10:00", tripType: "oneway" });
    expect(later && first && intervalsOverlap(later, first)).toBe(false);
  });

  it("builds an ics feed without passenger contact details", () => {
    const ics = buildIcs([
      { tripId: "trip-1", date: "2026-12-01", time: "10:00", pickup: "Airport" },
    ]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:trip-1 Airport");
    expect(ics).not.toContain("example.com");
    expect(ics).not.toContain("+41");
  });
});
