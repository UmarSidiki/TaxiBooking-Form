import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import CorporateAccount from "@/features/corporate/model/CorporateAccount";
import RecurringRide from "@/features/corporate/model/RecurringRide";
import { generateDueRecurring } from "@/features/corporate/lib/generate-recurring";
import { sendQuoteFollowUps } from "@/features/corporate/lib/quote-follow-up";
import { corporateMonth } from "@/features/corporate/lib/monthly-statement";
import { sendCorporateStatement } from "@/features/corporate/lib/send-corporate-statement";
import { clearQaMail, readQaMail } from "@/features/settings/lib/email-outbox";
import { createRide, createVehicle } from "./helpers/fixtures";

describe("corporate and recurring rides", () => {
  it("creates one ride per rule per day and totals the month", async () => {
    const vehicle = await createVehicle();
    const account = await CorporateAccount.create({ name: "Alpine AG", billingEmail: "ap@example.com" });
    const now = new Date("2026-10-26T09:00:00.000Z");
    await RecurringRide.create({
      pickup: "Office",
      dropoff: "Airport",
      time: "08:00",
      weekdays: [now.getUTCDay()],
      vehicleId: vehicle._id,
      email: "ap@example.com",
      phone: "+14155550101",
      corporateAccountId: account._id,
    });
    process.env.DISTANCE_MOCK = "1";
    await RecurringRide.create({
      pickup: "Hotel",
      dropoff: "",
      bookingType: "hourly",
      duration: 1,
      time: "09:00",
      weekdays: [now.getUTCDay()],
      vehicleId: vehicle._id,
      email: "hourly@example.com",
      phone: "+14155550102",
      corporateAccountId: account._id,
    });
    expect((await generateDueRecurring(now)).created).toBe(2);
    expect((await generateDueRecurring(now)).created).toBe(0);
    const ride = await Booking.findOne({ pickup: "Office" });
    expect(ride?.date).toBe("2026-10-26");
    expect(ride?.priceSource).toBe("computed");
    expect(ride?.totalAmount).toBe(60.8);
    const hourly = await Booking.findOne({ email: "hourly@example.com" });
    expect(hourly?.totalAmount).toBe(60);
    const statement = await corporateMonth(String(account._id), "2026-10");
    expect(statement?.total).toBe(120.8);
    process.env.QA_MOCK_EMAIL = "1";
    clearQaMail();
    const sent = await sendCorporateStatement(String(account._id), "2026-10", "en");
    expect(sent.ok && sent.emailed).toBe(true);
    const file = Array.isArray(readQaMail().at(-1)?.attachments) ? readQaMail().at(-1)?.attachments?.[0] : undefined;
    const bytes = file && "content" in file && Buffer.isBuffer(file.content) ? file.content : Buffer.from([]);
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1500);
    mkdirSync("/opt/cursor/artifacts/qa", { recursive: true });
    writeFileSync("/opt/cursor/artifacts/qa/corporate-statement.pdf", bytes);
    delete process.env.QA_MOCK_EMAIL;
    delete process.env.DISTANCE_MOCK;
  });

  it("skips a destination rule when the route distance cannot be priced", async () => {
    delete process.env.DISTANCE_MOCK;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const vehicle = await createVehicle();
    const now = new Date("2026-10-26T09:00:00.000Z");
    await RecurringRide.create({
      pickup: "Office",
      dropoff: "Airport",
      time: "08:00",
      weekdays: [now.getUTCDay()],
      vehicleId: vehicle._id,
      email: "skip@example.com",
    });
    expect((await generateDueRecurring(now)).created).toBe(0);
    expect(await Booking.countDocuments({ email: "skip@example.com" })).toBe(0);
  });

  it("follows up an unpaid quote once", async () => {
    const vehicle = await createVehicle();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "awaiting_payment",
      paymentStatus: "pending",
    });
    await Booking.collection.updateOne({ _id: ride._id }, { $set: { createdAt: new Date("2026-10-01T00:00:00.000Z") } });
    expect((await sendQuoteFollowUps(new Date("2026-10-24"))).sent).toBe(1);
    expect((await sendQuoteFollowUps(new Date("2026-10-24"))).sent).toBe(0);
  });
});
