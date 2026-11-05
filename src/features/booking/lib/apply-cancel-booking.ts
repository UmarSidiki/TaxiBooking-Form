import type { IBooking } from '@/features/booking/model';
import { Setting } from '@/features/settings/model';
import { processStripeRefund } from '@/features/payments/lib/process-stripe-refund';
import { refundDeposit } from '@/features/payments/lib/refund-deposit';
import { refundableDepositCents } from '@/features/payments/lib/refundable-deposit';
import type { BookingPatchApplyResult } from '@/features/booking/lib/booking-patch-result';

export async function applyCancelBooking(
  booking: IBooking,
  bookingId: string,
  refundPercentage: number | undefined,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  console.log('PATCH booking - Cancel action for booking ID:', bookingId);
  updateData.status = 'canceled';
  updateData.canceledAt = new Date();

  // Cash bookings and appointment requests may carry an online deposit.
  const depositCents = refundableDepositCents(booking);
  if (depositCents > 0) {
    const refund = await refundDeposit(booking);
    if (!refund.ok) {
      return { ok: false, status: 500, message: refund.message };
    }
    let refundAmount = refund.refundAmount;
    let refundedCents = refund.refundedCents;
    let warn = refund.warn;

    // An appointment deposit may sit on its own PI while the balance was paid
    // on a later PI; refund both so the customer gets the full amount back.
    if (booking.paymentMethod === 'stripe' && booking.stripePaymentIntentId) {
      const settings = await Setting.findOne();
      const balanceRefund = await processStripeRefund(
        booking,
        refundPercentage ?? 100,
        settings
      );
      if (!balanceRefund.success) {
        return {
          ok: false,
          status: 500,
          message: balanceRefund.error ?? 'Refund failed',
        };
      }
      refundAmount += balanceRefund.refundAmount ?? 0;
      refundedCents += Math.round((balanceRefund.refundAmount ?? 0) * 100);
    } else if (booking.paymentMethod === 'multisafepay') {
      warn =
        warn ??
        'Refund the MultiSafepay balance from the MultiSafepay dashboard.';
    }

    updateData.refundPercentage = refundPercentage ?? 100;
    updateData.refundAmount = (Number(booking.refundAmount) || 0) + refundAmount;
    updateData.amountRefundedCents =
      (Number(booking.amountRefundedCents) || 0) + refundedCents;
    if (refundedCents > 0) updateData.paymentStatus = 'refunded';
    updateData.balanceDue = 0;
    return { ok: true, updateData, warn };
  }

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
