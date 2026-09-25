import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";

export async function applyApprovePartner(
  booking: IBooking,
  marginPercentage: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (!booking.totalAmount || Number.isNaN(Number(booking.totalAmount))) {
    return {
      ok: false,
      status: 400,
      message: "Booking total amount is missing",
    };
  }

  const {
    enablePartners,
    partnerCashSettlement,
    defaultPartnerMarginPercentage,
  } = await getPartnerDispatchSettings();

  if (!enablePartners) {
    return {
      ok: false,
      status: 400,
      message: "Partner marketplace is disabled",
    };
  }

  const isCash = booking.paymentMethod === "cash";
  const totalAmount =
    typeof booking.totalAmount === "number"
      ? booking.totalAmount
      : Number(booking.totalAmount);

  // keep_cash: Partner keeps full cash — force 0% margin (also recovers stuck pending cash rides)
  if (isCash && partnerCashSettlement === "keep_cash") {
    updateData.partnerMarginPercentage = 0;
    updateData.partnerMarginAmount = 0;
    updateData.partnerPayoutAmount = totalAmount;
    updateData.partnerReviewStatus = "approved";
    updateData.partnerApprovedAt = new Date();
    updateData.availableForPartners = false;
    updateData.partnerNotificationSent = false;
    return { ok: true, updateData };
  }

  const submittedMargin =
    marginPercentage !== undefined
      ? Number(marginPercentage)
      : defaultPartnerMarginPercentage;

  if (
    Number.isNaN(submittedMargin) ||
    submittedMargin < 0 ||
    submittedMargin > 100
  ) {
    return {
      ok: false,
      status: 400,
      message: "Margin percentage must be between 0 and 100",
    };
  }

  const marginAmount = Number(
    ((totalAmount * submittedMargin) / 100).toFixed(2)
  );
  const partnerPayout = Number((totalAmount - marginAmount).toFixed(2));

  updateData.partnerMarginPercentage = submittedMargin;
  updateData.partnerMarginAmount = marginAmount;
  updateData.partnerPayoutAmount = partnerPayout;
  updateData.partnerReviewStatus = "approved";
  updateData.partnerApprovedAt = new Date();
  updateData.availableForPartners = false;
  updateData.partnerNotificationSent = false;

  return { ok: true, updateData };
}
