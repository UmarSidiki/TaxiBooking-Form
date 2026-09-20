import { Booking } from '@/features/booking/model';
import { Setting } from '@/features/settings/model';
import { notifyEligiblePartners } from '@/features/partners/lib/notify-eligible-partners';

export async function initCashBookingPartners(
  savedBookingId: string,
  paymentMethod: string | undefined,
  totalAmount: number,
  baseUrl?: string
) {
  const settings = await Setting.findOne();

  if (!settings?.enablePartners) {
    return;
  }

  try {
    const requiresPartnerReview = paymentMethod !== 'cash';

    await Booking.findByIdAndUpdate(savedBookingId, {
      $set: {
        partnerReviewStatus: requiresPartnerReview ? 'pending' : 'approved',
        partnerMarginPercentage: 0,
        partnerMarginAmount: 0,
        partnerPayoutAmount: totalAmount,
      },
    });

    if (!requiresPartnerReview) {
      const bookingForNotification = await Booking.findById(savedBookingId);
      if (bookingForNotification) {
        await notifyEligiblePartners(bookingForNotification, baseUrl);
      }
    }
  } catch {
    // Log error silently, don't expose details to user
  }
}
