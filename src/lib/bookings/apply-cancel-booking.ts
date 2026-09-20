import type { IBooking } from '@/models/booking';
import { Setting } from '@/models/settings';
import { processStripeRefund } from '@/lib/payments/process-stripe-refund';
import type { BookingPatchApplyResult } from '@/lib/bookings/booking-patch-result';

export async function applyCancelBooking(
  booking: IBooking,
  bookingId: string,
  refundPercentage: number | undefined,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  console.log('PATCH booking - Cancel action for booking ID:', bookingId);
  updateData.status = 'canceled';
  updateData.canceledAt = new Date();

  if (booking.paymentStatus !== 'completed') {
    return { ok: true, updateData };
  }

  if (booking.paymentMethod === 'stripe' && booking.stripePaymentIntentId) {
    const settings = await Setting.findOne();
    const refundResult = await processStripeRefund(
      booking,
      refundPercentage ?? 100,
      settings
    );

    if (!refundResult.success) {
      return { ok: false, status: 500, message: refundResult.error ?? 'Refund failed' };
    }

    updateData.refundPercentage = refundPercentage ?? 100;
    updateData.refundAmount = refundResult.refundAmount;
    updateData.paymentStatus = 'refunded';
    return { ok: true, updateData };
  }

  if (booking.paymentMethod === 'bank_transfer') {
    const percentage = refundPercentage ?? 100;
    const baseAmount =
      typeof booking.totalAmount === 'number' ? booking.totalAmount : 0;
    updateData.refundPercentage = percentage;
    updateData.refundAmount = baseAmount * (percentage / 100);
    updateData.paymentStatus = 'refunded';
  }

  return { ok: true, updateData };
}
