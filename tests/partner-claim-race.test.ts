import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { claimPartnerRide } from "@/features/partners/lib/claim-partner-ride";
import {
  createPartner,
  createRide,
  createVehicle,
  openDeadline,
  saveDispatchSettings,
} from "./helpers/fixtures";

describe("partner claim race", () => {
  it("lets only one partner win an atomic claim", async () => {
    const vehicle = await createVehicle();
    const [alpha, beta] = await Promise.all([
      createPartner({ name: "Alpha", email: "alpha@example.com", vehicleId: vehicle._id }),
      createPartner({ name: "Beta", email: "beta@example.com", vehicleId: vehicle._id }),
    ]);
    await saveDispatchSettings({ dispatchAssigneeMode: "exclusive" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      availableForPartners: true,
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: openDeadline(),
    });
    const vehicleIds = [String(vehicle._id)];

    const [first, second] = await Promise.all([
      claimPartnerRide(String(ride._id), alpha, vehicleIds),
      claimPartnerRide(String(ride._id), beta, vehicleIds),
    ]);

    const winners = [first, second].filter((row) => row !== null);
    expect(winners).toHaveLength(1);

    const stored = await Booking.findById(ride._id);
    expect(stored?.availableForPartners).toBe(false);
    expect([String(alpha._id), String(beta._id)]).toContain(
      String(stored?.assignedPartner?._id),
    );
    expect(stored?.partnerAcceptanceDeadline).toBeUndefined();
  });

  it("refuses a second claim after the ride is taken", async () => {
    const vehicle = await createVehicle();
    const alpha = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    const beta = await createPartner({
      name: "Beta",
      email: "beta@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "allow_both" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      availableForPartners: true,
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: openDeadline(),
    });
    const vehicleIds = [String(vehicle._id)];

    const won = await claimPartnerRide(String(ride._id), alpha, vehicleIds);
    const lost = await claimPartnerRide(String(ride._id), beta, vehicleIds);

    expect(won?.assignedPartner?.email).toBe("alpha@example.com");
    expect(lost).toBeNull();
  });

  it("does not claim a ride whose deadline has passed or whose vehicle is not approved", async () => {
    const vehicle = await createVehicle();
    const other = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "exclusive" });
    const expired = await createRide({
      selectedVehicle: vehicle._id,
      availableForPartners: true,
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: new Date(Date.now() - 60_000),
    });
    const wrongFleet = await createRide({
      selectedVehicle: other._id,
      availableForPartners: true,
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: openDeadline(),
    });

    expect(
      await claimPartnerRide(String(expired._id), partner, [String(vehicle._id)]),
    ).toBeNull();
    expect(
      await claimPartnerRide(String(wrongFleet._id), partner, [String(vehicle._id)]),
    ).toBeNull();
  });

  it("exclusive mode does not take a ride already assigned to a driver", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "exclusive" });
    const taken = await createRide({
      selectedVehicle: vehicle._id,
      availableForPartners: true,
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: openDeadline(),
      assignedDriver: { _id: partner._id, name: "Dee", email: "dee@example.com" },
    });

    expect(
      await claimPartnerRide(String(taken._id), partner, [String(vehicle._id)]),
    ).toBeNull();
    const stored = await Booking.findById(taken._id).lean();
    expect(stored?.assignedDriver?.email).toBe("dee@example.com");
    expect(stored?.assignedPartner?._id).toBeUndefined();
  });

  it("allow_both keeps an existing driver when a partner claims", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "allow_both" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      availableForPartners: true,
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: openDeadline(),
      assignedDriver: { _id: partner._id, name: "Dee", email: "dee@example.com" },
    });

    const claimed = await claimPartnerRide(String(ride._id), partner, [String(vehicle._id)]);
    expect(claimed?.assignedPartner?.email).toBe("alpha@example.com");
    expect(claimed?.assignedDriver?.email).toBe("dee@example.com");
  });
});
