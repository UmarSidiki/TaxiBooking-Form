import { describe, expect, it } from "vitest";
import { toE164 } from "@/shared/schema/e164-phone";
import { checkWhatsAppNumber } from "@/features/settings/lib/check-whatsapp-number";
import { applyDriverRideAction } from "@/features/drivers/lib/apply-driver-ride-action";
import RideActivity from "@/features/rides/model/RideActivity";
import { Booking } from "@/features/booking/model";
import { createDriver, createRide, createVehicle } from "./helpers/fixtures";

describe("phone and desk signals", () => {
  it("normalizes a valid number to E.164 and rejects a short one", () => {
    expect(toE164("+1 415 555 2671")).toBe("+14155552671");
    expect(toE164("123")).toBeNull();
  });

  it("allows a phone when WhatsApp is not linked", async () => {
    const result = await checkWhatsAppNumber("+41790000000");
    expect(result).toEqual({ connected: false, onWhatsApp: null });
  });

  it("writes a ride activity row when a driver completes", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "upcoming",
      assignedDriver: { _id: driver._id, name: driver.name, email: driver.email },
    });
    await applyDriverRideAction(String(driver._id), String(ride._id), { action: "started" });
    const rows = await RideActivity.find({ bookingId: ride._id }).lean();
    expect(rows.map((row) => row.action)).toEqual(["started"]);
    const stored = await Booking.findById(ride._id);
    expect(stored?.driverRideStatus).toBe("started");
  });
});
