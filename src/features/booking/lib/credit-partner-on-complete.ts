import type { IBooking } from "@/features/booking/model";
import type { BookingPatchAction } from "@/features/booking/schema/booking-patch.schema";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { recordPartnerSettlement } from "@/features/partners/lib/record-partner-settlement";

export async function creditPartnerOnComplete(input: {
  action: BookingPatchAction;
  previousStatus: IBooking["status"];
  updatedBooking: IBooking;
  bookingId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { action, previousStatus, updatedBooking, bookingId } = input;

  if (
    action !== "complete" ||
    previousStatus === "completed" ||
    !updatedBooking.assignedPartner?._id
  ) {
    return { ok: true };
  }

  if (typeof updatedBooking.partnerPayoutAmount !== "number") {
    return {
      ok: false,
      message:
        "Partner share is missing. Approve the ride for partners before completing.",
    };
  }

  const isCashBooking = updatedBooking.paymentMethod === "cash";
  const isPaymentComplete =
    isCashBooking || updatedBooking.paymentStatus === "completed";
  if (!isPaymentComplete) {
    return { ok: true };
  }

  const partnerAmount = updatedBooking.partnerPayoutAmount;
  const { currency, partnerCashSettlement } =
    await getPartnerDispatchSettings();
  const partnerId = String(updatedBooking.assignedPartner._id);
  const marginAmount =
    typeof updatedBooking.partnerMarginAmount === "number"
      ? updatedBooking.partnerMarginAmount
      : 0;

  if (isCashBooking) {
    if (partnerAmount > 0) {
      await recordPartnerSettlement({
        partnerId,
        bookingId,
        type: "payout_credit",
        channel: "cash",
        amount: partnerAmount,
        currency,
        note: "Cash ride complete — partner share",
        idempotentCredit: true,
        balanceInc: {
          totalEarnings: partnerAmount,
          cashEarnings: partnerAmount,
        },
      });
    }

    if (partnerCashSettlement === "operator_margin" && marginAmount > 0) {
      await recordPartnerSettlement({
        partnerId,
        bookingId,
        type: "remittance_credit",
        channel: "cash",
        amount: marginAmount,
        currency,
        note: "Cash ride complete — operator margin due",
        idempotentCredit: true,
        balanceInc: {
          remittanceBalance: marginAmount,
        },
      });
    }
    return { ok: true };
  }

  if (!(partnerAmount > 0)) {
    return { ok: true };
  }

  await recordPartnerSettlement({
    partnerId,
    bookingId,
    type: "payout_credit",
    channel: "online",
    amount: partnerAmount,
    currency,
    note: "Online ride complete — partner share",
    idempotentCredit: true,
    balanceInc: {
      totalEarnings: partnerAmount,
      onlineEarnings: partnerAmount,
      payoutBalance: partnerAmount,
    },
  });

  return { ok: true };
}
