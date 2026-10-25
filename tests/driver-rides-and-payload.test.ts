import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import { listDriverRides } from "@/features/drivers/lib/list-driver-rides";
import { Partner } from "@/features/partners/model";
import { omitPartnerDocumentFileData } from "@/features/partners/lib/to-admin-partner";
import { createDriver, createRide, createVehicle } from "./helpers/fixtures";

describe("driver ride pages", () => {
  it("returns only desk fields and walks forward by date", async () => {
    const vehicle = await createVehicle();
    const driver = await createDriver();
    const assignedDriver = {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
    };
    for (const date of ["2026-11-01", "2026-11-02", "2026-11-03"]) {
      await createRide({
        selectedVehicle: vehicle._id,
        assignedDriver,
        date,
        time: "09:00",
        status: "upcoming",
        stripePaymentIntentId: `pi_${date}`,
        paymentTokenHash: `hash-${date}`,
        email: "rider@example.com",
        phone: "+41000000001",
      });
    }

    const first = await listDriverRides(String(driver._id), { limit: 2 });
    expect(first.data).toHaveLength(2);
    expect(first.hasMore).toBe(true);
    expect(first.data[0]).toMatchObject({ date: "2026-11-01", email: "rider@example.com" });
    expect(first.data[0]).not.toHaveProperty("stripePaymentIntentId");
    expect(first.data[0]).not.toHaveProperty("paymentTokenHash");
    expect(first.nextCursor?.date).toBe("2026-11-02");

    const second = await listDriverRides(String(driver._id), {
      limit: 2,
      afterDate: first.nextCursor?.date,
      afterTime: first.nextCursor?.time,
      afterId: first.nextCursor?.id,
    });
    expect(second.data.map((ride) => ride.date)).toEqual(["2026-11-03"]);
    expect(second.hasMore).toBe(false);

    const stored = await Booking.findOne({ date: "2026-11-01" }).lean();
    expect(stored?.stripePaymentIntentId).toBe("pi_2026-11-01");
  });
});

describe("admin partner list payload", () => {
  it("omits base64 document bodies from the list shape", async () => {
    const fileData = `data:application/pdf;base64,${"A".repeat(40_000)}`;
    await Partner.create({
      name: "Alpha",
      email: "alpha@example.com",
      password: "secret-hash",
      status: "approved",
      documents: [
        {
          type: "license",
          fileName: "license.pdf",
          fileData,
          mimeType: "application/pdf",
          fileSize: fileData.length,
          status: "pending",
        },
      ],
    });

    const full = await Partner.find().lean();
    const slim = (await Partner.find().select("-password -documents.fileData").lean()).map(
      (partner) => omitPartnerDocumentFileData(partner),
    );
    const fullBytes = Buffer.byteLength(JSON.stringify(full));
    const slimBytes = Buffer.byteLength(JSON.stringify(slim));

    mkdirSync("/opt/cursor/artifacts", { recursive: true });
    writeFileSync(
      "/opt/cursor/artifacts/payload-evidence.json",
      JSON.stringify(
        {
          adminPartnersList: {
            documentsSeeded: 1,
            fileDataChars: fileData.length,
            responseBytesWithFileData: fullBytes,
            responseBytesWithoutFileData: slimBytes,
            bytesSaved: fullBytes - slimBytes,
          },
        },
        null,
        2,
      ),
    );

    expect(JSON.stringify(slim)).not.toContain(fileData);
    expect(JSON.stringify(slim)).not.toContain("secret-hash");
    expect(slimBytes).toBeLessThan(fullBytes / 5);
    expect(slim[0]?.documents?.[0]).toMatchObject({
      fileName: "license.pdf",
      mimeType: "application/pdf",
    });
  });
});
