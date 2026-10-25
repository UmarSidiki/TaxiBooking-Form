import { describe, expect, it } from "vitest";
import { Partner } from "@/features/partners/model";
import { partnerCanTakeRide, partnerMayWork } from "@/features/partners/lib/partner-access";
import { migratePartnerAccess } from "@/features/partners/lib/migrate-partner-access";
import { createPartner, createVehicle } from "./helpers/fixtures";

describe("partner access", () => {
  it("treats active partners with an approved vehicle as assignable", () => {
    expect(partnerMayWork({ status: "active", isActive: false })).toBe(true);
    expect(partnerMayWork({ status: "approved", isActive: false })).toBe(false);
    expect(partnerMayWork({ status: "pending" })).toBe(false);
    expect(
      partnerCanTakeRide(
        { status: "active", vehicles: [{ vehicleId: "veh-1", status: "approved" }] },
        "veh-1",
      ),
    ).toBe(true);
    expect(
      partnerCanTakeRide(
        { status: "active", vehicles: [{ vehicleId: "veh-1", status: "pending" }] },
        "veh-1",
      ),
    ).toBe(false);
  });

  it("migrates approved plus legacy fleet into active vehicle access", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
      status: "approved",
    });
    const preview = await migratePartnerAccess(true);
    expect(preview[0]?.action).toBe("would-write");
    expect(preview[0]?.to).toBe("active");

    await migratePartnerAccess(false);
    const stored = await Partner.findById(partner._id);
    expect(stored?.status).toBe("active");
    expect(stored?.vehicles?.some((row: { vehicleId?: unknown }) => String(row.vehicleId) === String(vehicle._id))).toBe(true);

    const again = await migratePartnerAccess(false);
    expect(again[0]?.action).toBe("skip");
  });
});
