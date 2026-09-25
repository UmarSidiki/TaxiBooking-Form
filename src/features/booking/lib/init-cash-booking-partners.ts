import { Booking } from "@/features/booking/model";
import { notifyEligiblePartners } from "@/features/partners/lib/notify-eligible-partners";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";

export async function initCashBookingPartners(
  savedBookingId: string,
  paymentMethod: string | undefined,
  totalAmount: number,
  baseUrl?: string
) {
  const { enablePartners, partnerCashSettlement } =
    await getPartnerDispatchSettings();

  if (!enablePartners) {
    return;
  }

  try {
    const isCash = paymentMethod === "cash";
    const autoApprove = isCash && partnerCashSettlement === "keep_cash";

    await Booking.findByIdAndUpdate(savedBookingId, {
      $set: autoApprove
        ? {
            partnerReviewStatus: "approved",
            partnerMarginPercentage: 0,
            partnerMarginAmount: 0,
            partnerPayoutAmount: totalAmount,
          }
        : {
            partnerReviewStatus: "pending",
          },
    });

    if (autoApprove) {
      const bookingForNotification = await Booking.findById(savedBookingId);
      if (bookingForNotification) {
        await notifyEligiblePartners(bookingForNotification, baseUrl);
      }
    }
  } catch {
    // keep booking create resilient
  }
}
