import type { IBooking } from "@/features/booking/model";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { postPartnerLedger } from "@/features/partners/lib/post-partner-ledger";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";

/** Reverse ride credits that do not already have a clawback row. */
export async function clawbackPartnerSettlementsForBooking(
  booking: IBooking,
  createdBy?: string,
) {
  const partnerId = booking.assignedPartner?._id
    ? String(booking.assignedPartner._id)
    : null;
  const bookingId = booking._id?.toString();
  if (!partnerId || !bookingId) return;

  const credits = await PartnerSettlementEntry.find({
    partnerId,
    bookingId,
    type: { $in: ["ride_credit", "payout_credit", "remittance_credit"] },
  }).lean();
  if (!credits.length) return;

  const { currency } = await getPartnerDispatchSettings();

  for (const credit of credits) {
    const delta = typeof credit.balanceDelta === "number" ? credit.balanceDelta : legacyDelta(credit);
    if (delta === 0) continue;
    await postPartnerLedger({
      partnerId,
      bookingId,
      type: "clawback",
      balanceDelta: -delta,
      amount: Math.abs(delta),
      currency,
      channel: credit.channel,
      createdBy,
      reversesEntryId: String(credit._id),
      note: "Ride credit reversed",
    });
  }
}

function legacyDelta(credit: {
  type: string;
  channel?: string;
  amount: number;
}) {
  if (credit.type === "remittance_credit") return -credit.amount;
  if (credit.type === "payout_credit" && credit.channel === "online") return credit.amount;
  return 0;
}
