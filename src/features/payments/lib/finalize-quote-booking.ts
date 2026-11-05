import type { IBooking } from "@/features/booking/model";
import { Booking } from "@/features/booking/model";
import {
  updateBookingById,
  updateBookingFields,
} from "@/features/booking/lib/booking.repo";
import { initCashBookingPartners } from "@/features/booking/lib/init-cash-booking-partners";
import { queueCustomerStatsRefresh } from "@/features/customers-admin/lib/customer-stats/refresh-customer-stats";
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

  // Pending change pay link: apply the proposed change once paid.
  if (booking.pendingChange) {
    const pc = booking.pendingChange as any;
    if (pc.expiresAt && new Date(pc.expiresAt).getTime() < Date.now()) {
      await Booking.findByIdAndUpdate(String(booking._id), {
        $unset: { pendingChange: 1, paymentTokenHash: 1 },
        $set: { status: "upcoming", updatedAt: new Date() },
      });
      return { success: false, message: "Payment link expired" };
    }
    const proposed = (pc.proposed ?? {}) as Record<string, unknown>;
    await Booking.findByIdAndUpdate(String(booking._id), {
      $set: {
        ...proposed,
        totalAmount: (pc.newTotalCents ?? 0) / 100,
        status: "upcoming",
        paymentStatus: "completed",
        paymentMethod: input.provider,
        amountPaidCents: (booking.amountPaidCents ?? 0) + (pc.diffCents ?? 0),
        updatedAt: new Date(),
        ...(input.stripePaymentIntentId
          ? { stripePaymentIntentId: input.stripePaymentIntentId }
          : {}),
      },
      $unset: { pendingChange: 1, paymentTokenHash: 1, quotedAmount: 1 },
    });
    queueCustomerStatsRefresh(booking.email);
    return {
      success: true,
      tripId: booking.tripId,
      bookingId: String(booking._id),
      emails: { confirmationSent: false, adminSent: false },
    };
  }

  const quoted = Number(booking.quotedAmount ?? booking.totalAmount ?? 0);
  const depositPaid = Math.max(0, Number(booking.depositPaidCents) || 0) / 100;
  const payable = Math.max(0, Number((quoted - depositPaid).toFixed(2)));
  if (payable > 0 && input.paidAmount + 0.05 < payable) {
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
    // No automatic refund path exists for MultiSafepay, so record the shortfall
    // for manual reconciliation rather than leaving taken money invisible.
    const shortfall = Number((payable - input.paidAmount).toFixed(2));
    await updateBookingFields(String(booking._id), {
      paymentMismatchAmount: shortfall,
    });
    console.error(
      "Quote underpaid and cannot be auto-refunded; needs manual reconciliation",
      {
        tripId: booking.tripId,
        provider: input.provider,
        paidAmount: input.paidAmount,
        quoted,
        shortfall,
      }
    );
    return {
      success: false,
      message: `Paid amount does not match the quoted total (short by ${shortfall}). Needs manual reconciliation.`,
    };
  }

  await updateBookingFields(String(booking._id), {
    status: "upcoming",
    paymentStatus: "completed",
    paymentMethod: input.provider,
    totalAmount: quoted || input.paidAmount,
    balanceDue: 0,
    amountPaidCents:
      (Number(booking.amountPaidCents) || 0) +
      Math.round(input.paidAmount * 100),
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
  queueCustomerStatsRefresh(booking.email);

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
