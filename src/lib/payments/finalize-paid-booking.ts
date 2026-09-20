import { connectDB } from '@/lib/database';
import { Booking, PendingBooking } from '@/models/booking';
import { buildBookingEmailDataFromBooking } from '@/lib/payments/booking-email-data';
import { createBookingFromPending } from '@/lib/payments/create-booking-from-pending';
import { sendBookingEmails } from '@/lib/payments/send-booking-emails';
import { tryFastPathFinalized } from '@/lib/payments/try-fast-path-finalized';
import { verifyMultisafepayPayment } from '@/lib/payments/verify-multisafepay-payment';
import { verifyStripePayment } from '@/lib/payments/verify-stripe-payment';
import type {
  FinalizePaidBookingInput,
  FinalizePaidBookingResult,
} from '@/lib/payments/finalize-paid-booking.types';

export type {
  FinalizePaidBookingInput,
  FinalizePaidBookingResult,
  PaymentProvider,
} from '@/lib/payments/finalize-paid-booking.types';

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
