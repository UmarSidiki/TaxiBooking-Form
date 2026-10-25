import { describe, expect, it } from "vitest";
import { applyAssignDriver } from "@/features/booking/lib/apply-assign-driver";
import { applyDriverRideAction } from "@/features/drivers/lib/apply-driver-ride-action";
import { Driver } from "@/features/drivers/model";
import DriverTimeOff from "@/features/drivers/model/DriverTimeOff";
import { createDriver, createRide, createVehicle } from "./helpers/fixtures";
import type { IBooking } from "@/features/booking/model";

describe("driver desk", () => {
  it("rejects an inactive driver and a vehicle mismatch", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    await Driver.updateOne({ _id: driver._id }, { $set: { isActive: false } });
    const inactive = await applyAssignDriver(String(driver._id), {}, String(vehicle._id));
    expect(inactive.ok).toBe(false);

    await Driver.updateOne(
      { _id: driver._id },
      { $set: { isActive: true, assignedVehicle: vehicle._id } },
    );
    const mismatch = await applyAssignDriver(String(driver._id), {}, "507f1f77bcf86cd799439011");
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.message).toMatch(/vehicle/i);
  });

  it("records started, cash collected, and time off", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      paymentMethod: "cash",
      status: "upcoming",
      totalAmount: 42,
      assignedDriver: { _id: driver._id, name: driver.name, email: driver.email },
    });
    const updated = await applyDriverRideAction(String(driver._id), String(ride._id), {
      action: "completed",
      cashCollected: 42,
    });
    expect(updated?.driverRideStatus).toBe("completed");
    expect(updated?.cashCollected).toBe(42);
    expect(updated?.status).toBe("completed");

    const off = await DriverTimeOff.create({
      driverId: driver._id,
      startsAt: new Date("2026-11-01T00:00:00.000Z"),
      endsAt: new Date("2026-11-03T00:00:00.000Z"),
      note: "Holiday",
    });
    expect(off.note).toBe("Holiday");
  });

  it("still assigns an approved active driver", async () => {
    const driver = await createDriver("other-driver@example.com");
    const result = await applyAssignDriver(String(driver._id), {} as Partial<IBooking>);
    expect(result.ok).toBe(true);
  });
});
