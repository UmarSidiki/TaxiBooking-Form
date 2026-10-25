import { afterEach, describe, expect, it } from "vitest";
import { applyAssignDriver } from "@/features/booking/lib/apply-assign-driver";
import { mockRouteKm } from "@/features/booking/lib/mock-distance";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { patchBooking } from "@/features/booking/lib/patch-booking.service";
import { quotePayUrl } from "@/features/booking/lib/quote-pay-url";
import DriverTimeOff from "@/features/drivers/model/DriverTimeOff";
import { isAssignablePartner, partnerDeskOpen } from "@/features/partners/lib/partner-desk-open";
import RideActivity from "@/features/rides/model/RideActivity";
import { describeAssignment } from "@/features/rides/lib/assignment-notice";
import { clearWhatsAppOutbox, readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";
import { toE164 } from "@/shared/schema/e164-phone";
import { ApiError } from "@/shared/http/api";
import { createDriver, createRide, createVehicle, saveDispatchSettings } from "./helpers/fixtures";

describe("qa regressions", () => {
  afterEach(() => {
    delete process.env.QA_MOCK_WHATSAPP;
    clearWhatsAppOutbox();
  });

  it("rejects an invalid phone and keeps a real E.164 number", () => {
    expect(toE164("123")).toBeNull();
    expect(toE164("+14155552671")).toBe("+14155552671");
  });

  it("opens the partner desk for active accounts", () => {
    expect(partnerDeskOpen("active")).toBe(true);
    expect(partnerDeskOpen("approved")).toBe(true);
    expect(partnerDeskOpen("pending")).toBe(false);
    expect(isAssignablePartner({ status: "active", isActive: true })).toBe(true);
    expect(isAssignablePartner({ status: "approved", isActive: true })).toBe(true);
    expect(isAssignablePartner({ status: "pending", isActive: true })).toBe(false);
  });

  it("blocks assignment when the ride overlaps time off", async () => {
    const driver = await createDriver("off-duty@example.com");
    await DriverTimeOff.create({
      driverId: driver._id,
      startsAt: new Date("2026-12-01T09:00:00.000Z"),
      endsAt: new Date("2026-12-01T18:00:00.000Z"),
    });
    const blocked = await applyAssignDriver(String(driver._id), {}, undefined, {
      date: "2026-12-01",
      time: "10:00",
      tripType: "oneway",
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.message).toBe("driver_time_off");

    const later = await applyAssignDriver(String(driver._id), {}, undefined, {
      date: "2026-12-01",
      time: "19:00",
      tripType: "oneway",
    });
    expect(later.ok).toBe(true);
  });

  it("surfaces an overlap warning instead of a plain success", () => {
    const notice = describeAssignment({
      success: true,
      warning: "Overlaps qa-overlap-a at 10:00",
      successLabel: "Driver assigned successfully",
      failedLabel: "Failed",
      timeOffLabel: "Time off",
      overlapLabel: (trip, time) => `Assigned. This overlaps ${trip} at ${time}.`,
    });
    expect(notice).toBe("Assigned. This overlaps qa-overlap-a at 10:00.");

    const blocked = describeAssignment({
      success: false,
      error: new ApiError("invalid_body", 409, "driver_time_off"),
      successLabel: "ok",
      failedLabel: "Failed",
      timeOffLabel: "This driver is on time off",
      overlapLabel: () => "",
    });
    expect(blocked).toBe("This driver is on time off");
  });

  it("records an edit in the activity log", async () => {
    const vehicle = await createVehicle();
    await saveDispatchSettings({});
    const ride = await createRide({ selectedVehicle: vehicle._id, notes: "old" });
    const result = await patchBooking(
      String(ride._id),
      { action: "edit", edit: { notes: "Meet at door 2", pickup: "Geneva Airport" } },
      "http://127.0.0.1:3000",
      { id: "admin-1", role: "admin" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.notes).toBe("Meet at door 2");
      expect(result.booking.pickup).toBe("Geneva Airport");
    }
    const rows = await RideActivity.find({ bookingId: ride._id }).lean();
    expect(rows.map((row) => row.action)).toContain("edited");
  });

  it("returns a pay link when the quote email cannot be sent", async () => {
    const vehicle = await createVehicle();
    await saveDispatchSettings({});
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "requested",
      paymentStatus: "pending",
      totalAmount: 80,
    });
    const result = await patchBooking(
      String(ride._id),
      { action: "quote", quotedAmount: 90 },
      "http://127.0.0.1:3000",
      { id: "admin-1", role: "admin" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payUrl).toMatch(/\/en\/pay\//);
    expect(result.booking.status).toBe("awaiting_payment");
    expect(quotePayUrl("http://127.0.0.1:3000", "en", "token")).toBe(
      "http://127.0.0.1:3000/en/pay/token",
    );
  });

  it("records mocked WhatsApp texts without opening a socket", async () => {
    process.env.QA_MOCK_WHATSAPP = "1";
    const sent = await sendWhatsAppTexts([
      { jid: "14155552671@s.whatsapp.net", text: "Ride qa-1 is assigned to you." },
    ]);
    expect(sent.ok).toBe(true);
    expect(readWhatsAppOutbox()).toEqual([
      { jid: "14155552671@s.whatsapp.net", text: "Ride qa-1 is assigned to you." },
    ]);
  });

  it("uses one distance for one-way and return pricing", async () => {
    expect(mockRouteKm()).toBe(25.4);
    process.env.DISTANCE_MOCK = "1";
    await expect(fetchRouteDistanceKm({ pickup: "Geneva Airport", dropoff: "Lausanne" })).resolves.toBe(25.4);
    delete process.env.DISTANCE_MOCK;
  });
});
