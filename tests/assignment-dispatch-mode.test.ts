import { describe, expect, it } from "vitest";
import type { IBooking } from "@/features/booking/model";
import { applyAssignDriver } from "@/features/booking/lib/apply-assign-driver";
import { applyAssignPartner } from "@/features/booking/lib/apply-assign-partner";
import {
  createDriver,
  createPartner,
  createVehicle,
  saveDispatchSettings,
} from "./helpers/fixtures";

function approvedBooking(vehicleId: unknown): IBooking {
  return {
    partnerReviewStatus: "approved",
    selectedVehicle: String(vehicleId),
  } as IBooking;
}

describe("dispatch assignee mode", () => {
  it("exclusive assignment unsets the other assignee", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "exclusive" });

    const driverUpdate: Partial<IBooking> = {};
    const assignedDriver = await applyAssignDriver(String(driver._id), driverUpdate);
    expect(assignedDriver.ok).toBe(true);
    if (!assignedDriver.ok) return;
    expect(assignedDriver.unsetFields).toContain("assignedPartner");
    expect(assignedDriver.unsetFields).toContain("partnerAcceptanceDeadline");
    expect(driverUpdate.availableForPartners).toBe(false);
    expect(driverUpdate.assignedDriver?.email).toBe("driver@example.com");

    const partnerUpdate: Partial<IBooking> = {};
    const assignedPartner = await applyAssignPartner(
      approvedBooking(vehicle._id),
      "booking-id",
      String(partner._id),
      partnerUpdate,
    );
    expect(assignedPartner.ok).toBe(true);
    if (!assignedPartner.ok) return;
    expect(assignedPartner.unsetFields).toContain("assignedDriver");
    expect(partnerUpdate.assignedPartner?.email).toBe("alpha@example.com");
  });

  it("allow_both keeps the other assignee in place", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "allow_both" });

    const driverUpdate: Partial<IBooking> = {};
    const assignedDriver = await applyAssignDriver(String(driver._id), driverUpdate);
    expect(assignedDriver.ok).toBe(true);
    if (!assignedDriver.ok) return;
    expect(assignedDriver.unsetFields).toEqual(["partnerAcceptanceDeadline"]);

    const partnerUpdate: Partial<IBooking> = {};
    const assignedPartner = await applyAssignPartner(
      approvedBooking(vehicle._id),
      "booking-id",
      String(partner._id),
      partnerUpdate,
    );
    expect(assignedPartner.ok).toBe(true);
    if (!assignedPartner.ok) return;
    expect(assignedPartner.unsetFields).toEqual(["partnerAcceptanceDeadline"]);
  });

  it("rejects a missing driver, an unapproved partner, and a ride that is not partner-approved", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
      status: "pending",
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "exclusive" });

    const missing = await applyAssignDriver("", {});
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.status).toBe(400);

    const unknown = await applyAssignDriver("507f1f77bcf86cd799439011", {});
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.status).toBe(404);

    const unapproved = await applyAssignPartner(
      approvedBooking(vehicle._id),
      "booking-id",
      String(partner._id),
      {},
    );
    expect(unapproved.ok).toBe(false);
    if (!unapproved.ok) expect(unapproved.message).toMatch(/approved/i);

    const approved = await createPartner({
      name: "Beta",
      email: "beta@example.com",
      vehicleId: vehicle._id,
    });
    const notReviewed = await applyAssignPartner(
      { partnerReviewStatus: "pending" } as IBooking,
      "booking-id",
      String(approved._id),
      {},
    );
    expect(notReviewed.ok).toBe(false);
    if (!notReviewed.ok) expect(notReviewed.status).toBe(400);
  });
});
