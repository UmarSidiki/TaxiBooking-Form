import { notifyEligiblePartners } from '@/lib/partners/notify-eligible-partners';
import { Booking, PendingBooking } from '@/models/booking';
import { Vehicle } from '@/models/vehicle';
import { buildBookingEmailData } from '@/lib/payments/booking-email-data';
import { buildPaidBookingRecord } from '@/lib/payments/build-paid-booking-record';
import { isDuplicateKeyError } from '@/lib/payments/calculate-booking-total';
import type {
  FinalizePaidBookingInput,
  FinalizePaidBookingResult,
} from '@/lib/payments/finalize-paid-booking.types';
import { loadPaymentSettings } from '@/lib/payments/load-payment-settings';
import { sendBookingEmails } from '@/lib/payments/send-booking-emails';

const PAID_AMOUNT_TOLERANCE = 0.05;

export async function createBookingFromPending(
  input: FinalizePaidBookingInput,
  orderId: string,
  paidAmount: number,
  currency: string,
  paymentIds: {
    stripePaymentIntentId?: string;
    multisafepayOrderId?: string;
    multisafepayTransactionId?: string;
  }
): Promise<FinalizePaidBookingResult> {
  const pendingBooking = await PendingBooking.findOne({ orderId });

  if (!pendingBooking) {
    return {
      success: false,
      retryable: true,
      message: 'Pending booking not found — payment may still be processing',
    };
  }

  const vehicle = await Vehicle.findById(pendingBooking.bookingData.selectedVehicle);

  if (!vehicle) {
    return { success: false, message: 'Vehicle not found for pending booking' };
  }

  const expectedAmount = Number(pendingBooking.bookingData.totalAmount);
  if (Number.isFinite(expectedAmount) && paidAmount + PAID_AMOUNT_TOLERANCE < expectedAmount) {
    return {
      success: false,
      message: 'Paid amount does not match the booking total',
    };
  }

  const bookingPayload = buildPaidBookingRecord(orderId, pendingBooking, vehicle, {
    paymentMethod: input.provider,
    paidAmount,
    currency,
    ...paymentIds,
  });

  try {
    const newBooking = await Booking.create(bookingPayload);
    const baseUrl = input.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || '';

    const emailData = buildBookingEmailData(orderId, pendingBooking, vehicle, {
      bookingId: newBooking._id.toString(),
      paymentMethod: input.provider,
      currency,
      baseUrl,
    });

    const emails = await sendBookingEmails(emailData, newBooking._id.toString());

    try {
      const { settings } = await loadPaymentSettings();
      if (settings?.enablePartners) {
        await notifyEligiblePartners(newBooking, baseUrl);
      }
    } catch (partnerError) {
      console.error('Partner notification error:', partnerError);
    }

    await PendingBooking.deleteOne({ orderId });

    return {
      success: true,
      tripId: orderId,
      bookingId: newBooking._id.toString(),
      emails,
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const existing = await Booking.findOne({
      $or: [
        { tripId: orderId },
        ...(paymentIds.stripePaymentIntentId
          ? [{ stripePaymentIntentId: paymentIds.stripePaymentIntentId }]
          : []),
        ...(paymentIds.multisafepayOrderId
          ? [{ multisafepayOrderId: paymentIds.multisafepayOrderId }]
          : []),
      ],
    });

    if (!existing) {
      throw error;
    }

    return {
      success: true,
      tripId: existing.tripId,
      bookingId: existing._id.toString(),
      alreadyExisted: true,
    };
  }
}
