import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { Driver } from "@/features/drivers/model";
import { Vehicle } from "@/features/fleet/model";
import { authenticateApiKey, hashApiKey, issueApiKey, revokeApiKey } from "@/features/agent-api/lib/api-key";
import { expiringDocuments } from "@/features/reports/lib/expiring-documents";
import { revenueByMonth, revenueCsv } from "@/features/reports/lib/revenue-report";
import { createRide, createVehicle } from "./helpers/fixtures";

describe("revenue and documents", () => {
  it("aggregates a month and lists expiring records", async () => {
    const vehicle = await createVehicle();
    await createRide({ selectedVehicle: vehicle._id, date: "2026-10-02", totalAmount: 12.5, status: "completed" });
    await createRide({ selectedVehicle: vehicle._id, date: "2026-10-03", totalAmount: 7.5, status: "canceled" });
    const csv = revenueCsv(await revenueByMonth());
    expect(csv).toContain("2026-10,1,12.50");
    await Vehicle.updateOne({ _id: vehicle._id }, { insuranceExpiresAt: new Date("2026-10-01") });
    await Driver.create({
      name: "Dee",
      email: "dee-docs@example.com",
      password: "x",
      documents: [{ type: "license", fileName: "a", fileData: "a", mimeType: "text/plain", fileSize: 1, status: "approved", expiresAt: new Date("2026-10-20") }],
    });
    const found = await expiringDocuments(new Date("2026-10-24"));
    expect(found.vehicles.length).toBe(1);
    expect(found.drivers.length).toBe(1);
    expect(await Booking.countDocuments({ status: "canceled", totalAmount: 7.5 })).toBe(1);
  });
});

describe("agent API keys", () => {
  it("hashes the token, rate limits, and revokes", async () => {
    const issued = await issueApiKey("Desk");
    expect(issued.token.startsWith("tbk_")).toBe(true);
    expect(await authenticateApiKey(`Bearer ${issued.token}`, 1)).toMatchObject({ ok: true });
    expect((await authenticateApiKey(`Bearer ${issued.token}`, 1)).status).toBe(429);
    await revokeApiKey(issued.id);
    expect((await authenticateApiKey(`Bearer ${issued.token}`)).status).toBe(401);
    expect(hashApiKey(issued.token)).toHaveLength(64);
  });
});
