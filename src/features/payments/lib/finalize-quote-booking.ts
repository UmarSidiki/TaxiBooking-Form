import type { IBooking } from "@/features/booking/model";
import {
  updateBookingById,
  updateBookingFields,
} from "@/features/booking/lib/booking.repo";
import { initCashBookingPartners } from "@/features/booking/lib/init-cash-booking-partners";
import { buildBookingEmailDataFromBooking } from "@/features/payments/lib/booking-email-data";
import { refundQuotePaymentIntent } from "@/features/payments/lib/quote-payment-intent";
import { sendBookingEmails } from "@/features/payments/lib/send-booking-emails";
import type { FinalizePaidBookingResult } from "@/features/payments/lib/finalize-paid-booking.types";
import type { PaymentProvider } from "@/features/payments/lib/finalize-paid-booking.types";

export async function finalizeQuoteBooking(input: {
  booking: IBooking;
  provider: PaymentProvider;
  paidAmount: number;
  currency: string;
  baseUrl?: string;
  stripePaymentIntentId?: string;
  multisafepayOrderId?: string;
  multisafepayTransactionId?: string;
}): Promise<FinalizePaidBookingResult> {
  const { booking } = input;

  if (booking.paymentStatus === "completed" && booking.status === "upcoming") {
    const emails = await sendBookingEmails(
      buildBookingEmailDataFromBooking(booking, {
        paymentMethod: input.provider,
        currency: input.currency,
        baseUrl: input.baseUrl,
      }),
      String(booking._id)
    );
    return {
      success: true,
      tripId: booking.tripId,
      bookingId: String(booking._id),
      alreadyExisted: true,
      emails,
    };
  }

  if (booking.status !== "awaiting_payment") {
    return {
      success: false,
      message: "Booking is not awaiting payment",
    };
  }

  const quoted = Number(booking.quotedAmount ?? booking.totalAmount ?? 0);
  if (quoted > 0 && input.paidAmount + 0.05 < quoted) {
    if (input.provider === "stripe" && input.stripePaymentIntentId) {
      const refund = await refundQuotePaymentIntent(
        input.stripePaymentIntentId
      );
      if (!refund.ok) {
        return {
          success: false,
          retryable: true,
          message: refund.message,
        };
      }
      await updateBookingById(String(booking._id), {}, [
        "stripePaymentIntentId",
      ]);
      return {
        success: false,
        message:
          "Paid amount does not match the quoted total. The charge was refunded.",
      };
    }
    return {
      success: false,
      message: "Paid amount does not match the quoted total",
    };
  }

  await updateBookingFields(String(booking._id), {
    status: "upcoming",
    paymentStatus: "completed",
    paymentMethod: input.provider,
    totalAmount: quoted || input.paidAmount,
    ...(input.stripePaymentIntentId
      ? { stripePaymentIntentId: input.stripePaymentIntentId }
      : {}),
    ...(input.multisafepayOrderId
      ? { multisafepayOrderId: input.multisafepayOrderId }
      : {}),
    ...(input.multisafepayTransactionId
      ? { multisafepayTransactionId: input.multisafepayTransactionId }
      : {}),
  });

  const plain =
    typeof booking.toObject === "function"
      ? booking.toObject()
      : { ...booking };

  const refreshed = {
    ...plain,
    status: "upcoming" as const,
    paymentStatus: "completed" as const,
    paymentMethod: input.provider,
    totalAmount: quoted || input.paidAmount,
  };

  const emailData = buildBookingEmailDataFromBooking(refreshed as IBooking, {
    paymentMethod: input.provider,
    currency: input.currency,
    baseUrl: input.baseUrl,
  });

  const emails = await sendBookingEmails(emailData, String(booking._id));

  await initCashBookingPartners(
    String(booking._id),
    input.provider,
    quoted || input.paidAmount,
    input.baseUrl
  );

  return {
    success: true,
    tripId: booking.tripId,
    bookingId: String(booking._id),
    emails,
  };
}
