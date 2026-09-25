import type { IBooking } from "@/features/booking/model";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { recordPartnerSettlement } from "@/features/partners/lib/record-partner-settlement";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";

/**
 * Reverse partner credits recorded for a booking (cancel / refund after complete).
 * Reverses each credit that does not yet have a matching clawback note for that credit id.
 */
export async function clawbackPartnerSettlementsForBooking(
  booking: IBooking,
  createdBy?: string
) {
  const partnerId = booking.assignedPartner?._id
    ? String(booking.assignedPartner._id)
    : null;
  const bookingId = booking._id?.toString();
  if (!partnerId || !bookingId) return;

  const credits = await PartnerSettlementEntry.find({
    partnerId,
    bookingId,
    type: { $in: ["payout_credit", "remittance_credit"] },
  }).lean();

  if (!credits.length) return;

  const existingClawbacks = await PartnerSettlementEntry.find({
    partnerId,
    bookingId,
    type: "clawback",
  }).lean();
  const clawedCreditIds = new Set(
    existingClawbacks
      .map((c) => {
        const m = /credit:([a-f0-9]+)/i.exec(c.note ?? "");
        return m?.[1];
      })
      .filter(Boolean)
  );

  const { currency } = await getPartnerDispatchSettings();

  for (const credit of credits) {
    const creditId = String(credit._id);
    if (clawedCreditIds.has(creditId)) continue;

    const amount = credit.amount;
    if (!(amount > 0)) continue;

    if (credit.type === "payout_credit") {
      const isCash = credit.channel === "cash";
      await recordPartnerSettlement({
        partnerId,
        bookingId,
        type: "clawback",
        channel: credit.channel,
        amount,
        currency,
        createdBy,
        note: `Clawback of payout_credit credit:${creditId}`,
        balanceInc: isCash
          ? {
              totalEarnings: -amount,
              cashEarnings: -amount,
            }
          : {
              totalEarnings: -amount,
              onlineEarnings: -amount,
              payoutBalance: -amount,
            },
      });
    } else if (credit.type === "remittance_credit") {
      await recordPartnerSettlement({
        partnerId,
        bookingId,
        type: "clawback",
        channel: credit.channel ?? "cash",
        amount,
        currency,
        createdBy,
        note: `Clawback of remittance_credit credit:${creditId}`,
        balanceInc: {
          remittanceBalance: -amount,
        },
      });
    }
  }
}
