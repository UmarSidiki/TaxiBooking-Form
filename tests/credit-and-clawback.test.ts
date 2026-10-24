import { describe, expect, it } from "vitest";
import type { IBooking } from "@/features/booking/model";
import { creditPartnerOnComplete, creditPartnerShare } from "@/features/booking/lib/credit-partner-on-complete";
import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";
import { clawbackPartnerSettlementsForBooking } from "@/features/partners/lib/clawback-partner-settlements";
import { migratePartnerBalances } from "@/features/partners/lib/migrate-partner-balance";
import { settlePartner } from "@/features/partners/lib/settle-partner";
import {
  createPartner,
  createRide,
  createVehicle,
  saveDispatchSettings,
} from "./helpers/fixtures";

async function balanceOf(partnerId: unknown) {
  const partner = await Partner.findById(partnerId).lean();
  return partner?.balance ?? 0;
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
      status: "completed",
      paymentMethod: "stripe",
      paymentStatus: "completed",
      partnerPayoutAmount: 80,
      totalAmount: 100,
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
      responsibleAssignee: "partner",
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

    expect(await balanceOf(partner._id)).toBe(80);
    const entries = await PartnerSettlementEntry.find({ bookingId: ride._id });
    expect(entries.map((entry) => entry.type)).toEqual(["ride_credit"]);
    expect(entries[0]?.balanceDelta).toBe(80);
  });

  it("credits an online ride only after payment clears", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({});
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "completed",
      paymentStatus: "pending",
      paymentMethod: "stripe",
      partnerPayoutAmount: 80,
      responsibleAssignee: "partner",
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
    expect(await PartnerSettlementEntry.countDocuments({})).toBe(0);

    ride.paymentStatus = "completed";
    await ride.save();
    expect(await creditPartnerShare(ride, String(ride._id))).toEqual({ ok: true });
    expect(await creditPartnerShare(ride, String(ride._id))).toEqual({ ok: true });
    expect(await balanceOf(partner._id)).toBe(80);
    expect(await PartnerSettlementEntry.countDocuments({ type: "ride_credit" })).toBe(1);
  });

  it("does not pay a partner when the driver is the responsible assignee", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ dispatchAssigneeMode: "allow_both" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "completed",
      paymentStatus: "completed",
      partnerPayoutAmount: 40,
      responsibleAssignee: "driver",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    expect(await creditPartnerShare(ride, String(ride._id))).toEqual({ ok: true });
    expect(await PartnerSettlementEntry.countDocuments({})).toBe(0);
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
      status: "completed",
      paymentStatus: "completed",
      partnerPayoutAmount: 40,
      responsibleAssignee: "partner",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    const input = {
      action: "complete" as const,
      previousStatus: "upcoming" as const,
      updatedBooking: ride,
      bookingId: String(ride._id),
    };
    await Promise.all([creditPartnerOnComplete(input), creditPartnerOnComplete(input)]);
    expect(await balanceOf(partner._id)).toBe(40);
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
      status: "completed",
      paymentMethod: "cash",
      partnerPayoutAmount: 30,
      partnerMarginAmount: 10,
      totalAmount: 40,
      responsibleAssignee: "partner",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    await creditPartnerShare(ride, String(ride._id));
    expect(await balanceOf(partner._id)).toBe(0);
    const entry = await PartnerSettlementEntry.findOne({ bookingId: ride._id });
    expect(entry?.balanceDelta).toBe(0);
    expect(entry?.partnerShare).toBe(30);
  });

  it("reduces the balance by the operator margin on cash rides", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({ partnerCashSettlement: "operator_margin" });
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "completed",
      paymentMethod: "cash",
      partnerPayoutAmount: 30,
      partnerMarginAmount: 12,
      totalAmount: 42,
      responsibleAssignee: "partner",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    await creditPartnerShare(ride, String(ride._id));
    expect(await balanceOf(partner._id)).toBe(-12);
  });

  it("does not credit a ride without a partner share", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({});
    const missingShare = await createRide({
      selectedVehicle: vehicle._id,
      status: "completed",
      paymentStatus: "completed",
      responsibleAssignee: "partner",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    expect(await creditPartnerShare(missingShare, String(missingShare._id))).toEqual({
      ok: false,
      message: "Partner share is missing. Approve the ride for partners before completing.",
    });
  });
});

describe("partner clawback and settlement", () => {
  it("reverses a ride credit once and records a partial settlement", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await saveDispatchSettings({});
    const ride = await createRide({
      selectedVehicle: vehicle._id,
      status: "completed",
      paymentStatus: "completed",
      partnerPayoutAmount: 50,
      responsibleAssignee: "partner",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    await creditPartnerShare(ride, String(ride._id));
    await clawbackPartnerSettlementsForBooking(ride as IBooking, "admin-1");
    await clawbackPartnerSettlementsForBooking(ride as IBooking, "admin-1");
    expect(await balanceOf(partner._id)).toBe(0);
    expect(await PartnerSettlementEntry.countDocuments({ type: "clawback" })).toBe(1);

    const second = await createRide({
      selectedVehicle: vehicle._id,
      status: "completed",
      paymentStatus: "completed",
      partnerPayoutAmount: 80,
      responsibleAssignee: "partner",
      assignedPartner: { _id: partner._id, name: partner.name, email: partner.email },
    });
    await creditPartnerShare(second, String(second._id));
    const settled = await settlePartner(
      String(partner._id),
      { amount: 20, direction: "pay_partner", method: "bank", reference: "WIRE-1", note: "Partial" },
      "admin-1",
    );
    expect(settled.ok).toBe(true);
    expect(await balanceOf(partner._id)).toBe(60);
  });

  it("migrates counters into one opening balance and skips a second run", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    await Partner.updateOne({ _id: partner._id }, { $set: { payoutBalance: 80, remittanceBalance: 30 } });
    await saveDispatchSettings({});

    const preview = await migratePartnerBalances(true);
    expect(preview[0]?.action).toBe("would-write");
    expect(preview[0]?.delta).toBe(50);
    expect(await balanceOf(partner._id)).toBe(0);

    const wrote = await migratePartnerBalances(false);
    expect(wrote[0]?.action).toBe("wrote");
    expect(await balanceOf(partner._id)).toBe(50);
    const again = await migratePartnerBalances(false);
    expect(again[0]?.action).toBe("skip");
    expect(await balanceOf(partner._id)).toBe(50);
  });
});
