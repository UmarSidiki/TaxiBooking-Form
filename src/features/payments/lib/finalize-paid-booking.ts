import { connectDB } from '@/shared/db';
import { Booking, PendingBooking } from '@/features/booking/model';
import { buildBookingEmailDataFromBooking } from '@/features/payments/lib/booking-email-data';
import { createBookingFromPending } from '@/features/payments/lib/create-booking-from-pending';
import { sendBookingEmails } from '@/features/payments/lib/send-booking-emails';
import { tryFastPathFinalized } from '@/features/payments/lib/try-fast-path-finalized';
import { verifyMultisafepayPayment } from '@/features/payments/lib/verify-multisafepay-payment';
import { verifyStripePayment } from '@/features/payments/lib/verify-stripe-payment';
import type {
  FinalizePaidBookingInput,
  FinalizePaidBookingResult,
} from '@/features/payments/lib/finalize-paid-booking.types';

export type {
  FinalizePaidBookingInput,
  FinalizePaidBookingResult,
  PaymentProvider,
} from '@/features/payments/lib/finalize-paid-booking.types';

const DEFAULT_CURRENCY = 'EUR';

/**
 * Idempotently creates a paid booking and sends emails.
 * Safe to call from webhooks and the payment success page (fallback).
 */
export async function finalizePaidBooking(
  input: FinalizePaidBookingInput
): Promise<FinalizePaidBookingResult> {
  await connectDB();

  const fastPath = await tryFastPathFinalized(input);
  if (fastPath) {
    return fastPath;
  }

  let orderId: string | undefined = input.orderId;
  let paidAmount = 0;
  let currency = DEFAULT_CURRENCY;
  const paymentIds: {
    stripePaymentIntentId?: string;
    multisafepayOrderId?: string;
    multisafepayTransactionId?: string;
  } = {};

  if (input.provider === 'stripe') {
    if (!input.paymentIntentId) {
      return { success: false, message: 'paymentIntentId is required for Stripe' };
    }

    const verified = await verifyStripePayment(input.paymentIntentId);
    if (!verified.ok) {
      return {
        success: false,
        message: verified.message,
        retryable: verified.retryable,
      };
    }

    orderId = verified.orderId;
    paidAmount = verified.paidAmount;
    currency = verified.currency;
    paymentIds.stripePaymentIntentId = input.paymentIntentId;
  } else {
    if (!input.transactionId && !input.orderId) {
      return {
        success: false,
        message: 'transactionId or orderId is required for MultiSafepay',
      };
    }

    const verified = await verifyMultisafepayPayment(
      input.transactionId,
      input.orderId
    );
    if (!verified.ok) {
      return {
        success: false,
        message: verified.message,
        retryable: verified.retryable,
      };
    }

    orderId = verified.orderId;
    paidAmount = verified.paidAmount;
    currency = verified.currency;
    paymentIds.multisafepayOrderId = verified.orderId;
    paymentIds.multisafepayTransactionId = verified.transactionId;
  }

  const existingBooking = await Booking.findOne({
    $or: [
      ...(paymentIds.stripePaymentIntentId
        ? [{ stripePaymentIntentId: paymentIds.stripePaymentIntentId }]
        : []),
      ...(paymentIds.multisafepayOrderId
        ? [
            { multisafepayOrderId: paymentIds.multisafepayOrderId },
            { tripId: paymentIds.multisafepayOrderId },
          ]
        : []),
      ...(paymentIds.multisafepayTransactionId
        ? [{ multisafepayTransactionId: paymentIds.multisafepayTransactionId }]
        : []),
      { tripId: orderId },
    ],
  });

  if (existingBooking) {
    const baseUrl = input.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || '';

    if (existingBooking.status === 'awaiting_payment') {
      const { finalizeQuoteBooking } = await import(
        '@/features/payments/lib/finalize-quote-booking'
      );
      return finalizeQuoteBooking({
        booking: existingBooking,
        provider: input.provider,
        paidAmount,
        currency,
        baseUrl,
        ...paymentIds,
      });
    }

    // Do not treat unpaid appointment requests or declined quotes as paid bookings
    if (
      existingBooking.status === 'requested' ||
      existingBooking.status === 'canceled'
    ) {
      return {
        success: false,
        message: 'Booking is not payable in its current state',
      };
    }

    await PendingBooking.deleteOne({ orderId });

    const emailData = buildBookingEmailDataFromBooking(existingBooking, {
      paymentMethod: input.provider,
      currency,
      baseUrl,
    });

    const emails = await sendBookingEmails(
      emailData,
      existingBooking._id.toString()
    );

    return {
      success: true,
      tripId: existingBooking.tripId,
      bookingId: existingBooking._id.toString(),
      alreadyExisted: true,
      emails,
    };
  }

  return createBookingFromPending(
    input,
    orderId!,
    paidAmount,
    currency,
    paymentIds
  );
}
