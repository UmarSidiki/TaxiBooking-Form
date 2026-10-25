import type { IBooking } from "@/features/booking/model";
import type { BookingPatchAction } from "@/features/booking/schema/booking-patch.schema";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { partnerShareDelta } from "@/features/partners/lib/partner-share-delta";
import { postPartnerLedger } from "@/features/partners/lib/post-partner-ledger";

export function partnerIsPayee(booking: Pick<IBooking, "assignedPartner" | "responsibleAssignee">) {
  if (!booking.assignedPartner?._id) return false;
  return booking.responsibleAssignee !== "driver";
}

export async function creditPartnerShare(booking: IBooking, bookingId: string) {
  if (!partnerIsPayee(booking)) return { ok: true as const };
  if (booking.status !== "completed") return { ok: true as const };

  if (typeof booking.partnerPayoutAmount !== "number") {
    return {
      ok: false as const,
      message: "Partner share is missing. Approve the ride for partners before completing.",
    };
  }

  const isCash = booking.paymentMethod === "cash";
  const payable = isCash || booking.paymentStatus === "completed";
  if (!payable) return { ok: true as const };

  const { currency, partnerCashSettlement } = await getPartnerDispatchSettings();
  const margin =
    typeof booking.partnerMarginAmount === "number" ? booking.partnerMarginAmount : 0;
  const share = booking.partnerPayoutAmount;
  const balanceDelta = partnerShareDelta({
    isCash,
    cashMode: partnerCashSettlement,
    partnerShare: share,
    margin,
  });

  await postPartnerLedger({
    partnerId: String(booking.assignedPartner?._id),
    bookingId,
    type: "ride_credit",
    balanceDelta,
    amount: Math.abs(balanceDelta),
    currency,
    channel: isCash ? "cash" : "online",
    fare: typeof booking.totalAmount === "number" ? booking.totalAmount : undefined,
    margin,
    partnerShare: share,
    note: isCash ? "Cash ride complete" : "Online ride paid and complete",
  });

  return { ok: true as const };
}

export async function creditPartnerOnComplete(input: {
  action: BookingPatchAction;
  previousStatus: IBooking["status"];
  updatedBooking: IBooking;
  bookingId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (input.action !== "complete" || input.previousStatus === "completed") {
    return { ok: true };
  }
  return creditPartnerShare(input.updatedBooking, input.bookingId);
}
