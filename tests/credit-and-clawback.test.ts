import { describe, expect, it } from "vitest";
import type { IBooking } from "@/features/booking/model";
import { creditPartnerOnComplete } from "@/features/booking/lib/credit-partner-on-complete";
import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";
import { clawbackPartnerSettlementsForBooking } from "@/features/partners/lib/clawback-partner-settlements";
import {
  createPartner,
  createRide,
  createVehicle,
  saveDispatchSettings,
} from "./helpers/fixtures";

async function balances(partnerId: unknown) {
  const partner = await Partner.findById(partnerId).lean();
  return {
    totalEarnings: partner?.totalEarnings ?? 0,
    onlineEarnings: partner?.onlineEarnings ?? 0,
    cashEarnings: partner?.cashEarnings ?? 0,
    payoutBalance: partner?.payoutBalance ?? 0,
    remittanceBalance: partner?.remittanceBalance ?? 0,
  };
}

describe("partner credit on completion", () => {
  it("credits an online payout once and ignores a second complete", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ partnerCashSettlement: "keep_cash" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      paymentMethod: "stripe",
      paymentStatus: "completed",
      partnerPayoutAmount: 80,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });

    const input = {
      action: "complete" as const,
      previousStatus: "upcoming" as const,
      updatedBooking: ride,
      bookingId: String(ride._id),
    };
    expect(await creditPartnerOnComplete(input)).toEqual({ ok: true });
    expect(await creditPartnerOnComplete({ ...input, previousStatus: "completed" })).toEqual({
      ok: true,
    });

    expect(await balances(partner._id)).toEqual({
      totalEarnings: 80,
      onlineEarnings: 80,
      cashEarnings: 0,
      payoutBalance: 80,
      remittanceBalance: 0,
    });
    const entries = await PartnerSettlementEntry.find({ bookingId: ride._id });
    expect(entries.map((entry) => entry.type)).toEqual(["payout_credit"]);
  });

  it("parallel completes record a single online credit", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({});
    await PartnerSettlementEntry.syncIndexes();
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      partnerPayoutAmount: 40,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    const input = {
      action: "complete" as const,
      previousStatus: "upcoming" as const,
      updatedBooking: ride,
      bookingId: String(ride._id),
    };

    await Promise.all([creditPartnerOnComplete(input), creditPartnerOnComplete(input)]);

    expect((await balances(partner._id)).payoutBalance).toBe(40);
    expect(await PartnerSettlementEntry.countDocuments({ bookingId: ride._id })).toBe(1);
  });

  it("keeps cash with the partner when settlement is keep_cash", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ partnerCashSettlement: "keep_cash" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      paymentMethod: "cash",
      paymentStatus: "pending",
      partnerPayoutAmount: 30,
      partnerMarginAmount: 10,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });

    expect(
      await creditPartnerOnComplete({
        action: "complete",
        previousStatus: "upcoming",
        updatedBooking: ride,
        bookingId: String(ride._id),
      }),
    ).toEqual({ ok: true });

    expect(await balances(partner._id)).toMatchObject({
      totalEarnings: 30,
      cashEarnings: 30,
      payoutBalance: 0,
      remittanceBalance: 0,
    });
  });

  it("adds remittance when cash settlement is operator_margin", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ partnerCashSettlement: "operator_margin" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      paymentMethod: "cash",
      partnerPayoutAmount: 30,
      partnerMarginAmount: 12,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });

    await creditPartnerOnComplete({
      action: "complete",
      previousStatus: "upcoming",
      updatedBooking: ride,
      bookingId: String(ride._id),
    });

    expect(await balances(partner._id)).toMatchObject({
      cashEarnings: 30,
      remittanceBalance: 12,
      payoutBalance: 0,
    });
    const types = (await PartnerSettlementEntry.find({ bookingId: ride._id })).map(
      (entry) => entry.type,
    );
    expect(types.sort()).toEqual(["payout_credit", "remittance_credit"]);
  });

  it("does not credit an unpaid online ride or a ride without a partner share", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({});
    const unpaid = await createRide({
      selectedVehicle: vehicle._id,
      paymentStatus: "pending",
      partnerPayoutAmount: 80,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    const missingShare = await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });

    expect(
      await creditPartnerOnComplete({
        action: "complete",
        previousStatus: "upcoming",
        updatedBooking: unpaid,
        bookingId: String(unpaid._id),
      }),
    ).toEqual({ ok: true });
    expect(
      await creditPartnerOnComplete({
        action: "complete",
        previousStatus: "upcoming",
        updatedBooking: missingShare,
        bookingId: String(missingShare._id),
      }),
    ).toEqual({
      ok: false,
      message: "Partner share is missing. Approve the ride for partners before completing.",
    });
    expect(await PartnerSettlementEntry.countDocuments({})).toBe(0);
  });

  it("skips credit when the action is not complete or no partner is assigned", async () => {
    const vehicle = await createVehicle();
    const ride = await createRide({ selectedVehicle: vehicle._id, partnerPayoutAmount: 10 });
    expect(
      await creditPartnerOnComplete({
        action: "assign",
        previousStatus: "upcoming",
        updatedBooking: ride,
        bookingId: String(ride._id),
      }),
    ).toEqual({ ok: true });
    expect(await PartnerSettlementEntry.countDocuments({})).toBe(0);
  });
});

describe("partner clawback", () => {
  it("reverses online payout and cash remittance once", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ partnerCashSettlement: "operator_margin" });
    const online = await createRide({
      selectedVehicle: vehicle._id,
      partnerPayoutAmount: 50,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    const cash = await createRide({
      selectedVehicle: vehicle._id,
      paymentMethod: "cash",
      partnerPayoutAmount: 20,
      partnerMarginAmount: 5,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });

    await creditPartnerOnComplete({
      action: "complete",
      previousStatus: "upcoming",
      updatedBooking: online,
      bookingId: String(online._id),
    });
    await creditPartnerOnComplete({
      action: "complete",
      previousStatus: "upcoming",
      updatedBooking: cash,
      bookingId: String(cash._id),
    });

    await clawbackPartnerSettlementsForBooking(online as IBooking);
    await clawbackPartnerSettlementsForBooking(online as IBooking);
    await clawbackPartnerSettlementsForBooking(cash as IBooking);

    expect(await balances(partner._id)).toEqual({
      totalEarnings: 0,
      onlineEarnings: 0,
      cashEarnings: 0,
      payoutBalance: 0,
      remittanceBalance: 0,
    });
    expect(
      await PartnerSettlementEntry.countDocuments({ bookingId: online._id, type: "clawback" }),
    ).toBe(1);
    expect(
      await PartnerSettlementEntry.countDocuments({ bookingId: cash._id, type: "clawback" }),
    ).toBe(2);
  });

  it("does nothing when the ride has no partner credits", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    await clawbackPartnerSettlementsForBooking(ride as IBooking);
    expect(await PartnerSettlementEntry.countDocuments({})).toBe(0);
  });
});
