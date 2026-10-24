import { describe, expect, it } from "vitest";
import { Booking } from "@/features/booking/model";
import CorporateAccount from "@/features/corporate/model/CorporateAccount";
import RecurringRide from "@/features/corporate/model/RecurringRide";
import { generateDueRecurring } from "@/features/corporate/lib/generate-recurring";
import { sendQuoteFollowUps } from "@/features/corporate/lib/quote-follow-up";
import { corporateMonth } from "@/features/corporate/lib/monthly-statement";
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
    expect((await generateDueRecurring(now)).created).toBe(1);
    expect((await generateDueRecurring(now)).created).toBe(0);
    const ride = await Booking.findOne({ pickup: "Office" });
    expect(ride?.date).toBe("2026-10-26");
    ride!.totalAmount = 40;
    await ride!.save();
    const statement = await corporateMonth(String(account._id), "2026-10");
    expect(statement?.total).toBe(40);
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
