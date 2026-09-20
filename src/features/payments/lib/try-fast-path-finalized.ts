import { Booking, PendingBooking } from '@/features/booking/model';
import type {
  FinalizePaidBookingInput,
  FinalizePaidBookingResult,
} from '@/features/payments/lib/finalize-paid-booking.types';

export async function tryFastPathFinalized(
  input: FinalizePaidBookingInput
): Promise<FinalizePaidBookingResult | null> {
  const orConditions: Record<string, string>[] = [];

  if (input.paymentIntentId) {
    orConditions.push({ stripePaymentIntentId: input.paymentIntentId });
  }
  if (input.orderId) {
    orConditions.push({ tripId: input.orderId }, { multisafepayOrderId: input.orderId });
  }
  if (input.transactionId) {
    orConditions.push({ multisafepayTransactionId: input.transactionId });
  }

  if (orConditions.length === 0) {
    return null;
  }

  const existing = await Booking.findOne({
    $or: orConditions,
    paymentStatus: 'completed',
  });

  if (
    !existing ||
    !existing.confirmationEmailSent ||
    !existing.adminNotificationSent
  ) {
    return null;
  }

  if (existing.tripId) {
    await PendingBooking.deleteOne({ orderId: existing.tripId });
  }

  return {
    success: true,
    tripId: existing.tripId,
    bookingId: existing._id.toString(),
    alreadyExisted: true,
    emails: { confirmationSent: true, adminSent: true },
  };
}
