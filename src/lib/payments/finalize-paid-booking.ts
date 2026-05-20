import { connectDB } from '@/lib/database';
import { notifyEligiblePartners } from '@/lib/partners/notify-eligible-partners';
import { getCurrencySymbol } from '@/lib/utils';
import { Booking, PendingBooking } from '@/models/booking';
import type { IPendingBooking } from '@/models/booking/PendingBooking';
import { Setting } from '@/models/settings';
import { Vehicle } from '@/models/vehicle';
import { buildBookingEmailData, buildBookingEmailDataFromBooking } from './booking-email-data';
import { fetchMultisafepayOrder } from './multisafepay-api';
import { sendBookingEmails } from './send-booking-emails';
import { getPaidAmountFromPaymentIntent, getStripeClient } from './stripe-client';

export type PaymentProvider = 'stripe' | 'multisafepay';

export interface FinalizePaidBookingInput {
  provider: PaymentProvider;
  paymentIntentId?: string;
  transactionId?: string;
  orderId?: string;
  baseUrl?: string;
}

export interface FinalizePaidBookingResult {
  success: boolean;
  retryable?: boolean;
  message?: string;
  tripId?: string;
  bookingId?: string;
  alreadyExisted?: boolean;
  emails?: { confirmationSent: boolean; adminSent: boolean };
}

async function loadSettings() {
  await connectDB();
  const settings = await Setting.findOne();
  return { settings };
}

async function verifyStripePayment(paymentIntentId: string) {
  const { settings } = await loadSettings();
  const stripe = await getStripeClient();

  if (!stripe) {
    return { ok: false as const, message: 'Stripe is not configured' };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    return {
      ok: false as const,
      message: `Payment not completed (status: ${paymentIntent.status})`,
      retryable: paymentIntent.status === 'processing' || paymentIntent.status === 'requires_capture',
    };
  }

  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) {
    return { ok: false as const, message: 'Missing order_id in payment metadata' };
  }

  return {
    ok: true as const,
    orderId,
    paidAmount: getPaidAmountFromPaymentIntent(paymentIntent),
    currency: paymentIntent.currency?.toUpperCase() || settings?.stripeCurrency?.toUpperCase() || 'EUR',
  };
}

async function verifyMultisafepayPayment(transactionId?: string, orderIdHint?: string) {
  const { settings } = await loadSettings();
  const multisafepayApiKey = settings?.multisafepayApiKey;

  if (!multisafepayApiKey) {
    return { ok: false as const, message: 'MultiSafepay is not configured' };
  }

  if (!transactionId && !orderIdHint) {
    return { ok: false as const, message: 'Missing transaction or order ID' };
  }

  const multisafepayTestMode = settings?.multisafepayTestMode ?? true;

  // GET /orders/{id} expects the merchant order_id; try that before transactionid.
  const lookupCandidates = [
    ...(orderIdHint ? [orderIdHint] : []),
    ...(transactionId && transactionId !== orderIdHint ? [transactionId] : []),
  ];

  let orderData: NonNullable<import('./multisafepay-api').MultisafepayOrderResponse['data']> | undefined;

  for (const lookupId of lookupCandidates) {
    const result = await fetchMultisafepayOrder(multisafepayApiKey, multisafepayTestMode, lookupId);
    if (result.ok) {
      orderData = result.data;
      break;
    }
  }

  if (!orderData) {
    return { ok: false as const, message: 'Could not verify MultiSafepay order', retryable: true };
  }

  if (orderData.status !== 'completed') {
    return {
      ok: false as const,
      message: `Payment not completed (status: ${orderData.status})`,
      retryable: true,
    };
  }

  const merchantOrderId = orderData.order_id;
  if (!merchantOrderId) {
    return { ok: false as const, message: 'MultiSafepay response missing order_id' };
  }

  return {
    ok: true as const,
    orderId: merchantOrderId,
    transactionId: orderData.transaction_id || transactionId || orderIdHint || merchantOrderId,
    paidAmount: orderData.amount ? orderData.amount / 100 : 0,
    currency:
      orderData.currency?.toUpperCase() ||
      settings?.stripeCurrency?.toUpperCase() ||
      'EUR',
  };
}

function buildBookingRecord(
  orderId: string,
  pending: IPendingBooking,
  vehicle: { name: string; price: number | string; persons: number },
  options: {
    paymentMethod: PaymentProvider;
    paidAmount: number;
    currency: string;
    stripePaymentIntentId?: string;
    multisafepayOrderId?: string;
    multisafepayTransactionId?: string;
  }
) {
  const currencySymbol = getCurrencySymbol(options.currency);
  const data = pending.bookingData;

  if (Math.abs(options.paidAmount - Number(data.totalAmount)) > 0.05) {
    console.error(
      `Payment amount mismatch for ${orderId}: paid ${options.paidAmount}, expected ${data.totalAmount}`
    );
    data.totalAmount = options.paidAmount;
  }

  return {
    tripId: orderId,
    pickup: data.pickup,
    dropoff: data.dropoff || '',
    stops: data.stops || [],
    tripType: data.tripType,
    bookingType: data.bookingType,
    duration: data.duration,
    date: data.date,
    time: data.time,
    returnDate: data.returnDate,
    returnTime: data.returnTime,
    passengers: data.passengers,
    selectedVehicle: data.selectedVehicle,
    vehicleDetails: {
      name: vehicle.name,
      price: `${currencySymbol}${vehicle.price}`,
      seats: `${vehicle.persons} persons`,
    },
    childSeats: data.childSeats,
    babySeats: data.babySeats,
    notes: data.notes,
    flightNumber: data.flightNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    paymentMethod: options.paymentMethod,
    paymentStatus: 'completed' as const,
    stripePaymentIntentId: options.stripePaymentIntentId,
    multisafepayOrderId: options.multisafepayOrderId,
    multisafepayTransactionId: options.multisafepayTransactionId,
    status: 'upcoming' as const,
    totalAmount: data.totalAmount,
    subtotalAmount: data.subtotalAmount,
    taxAmount: data.taxAmount,
    taxPercentage: data.taxPercentage,
  };
}

async function createBookingFromPending(
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

  const bookingPayload = buildBookingRecord(orderId, pendingBooking, vehicle, {
    paymentMethod: input.provider,
    paidAmount,
    currency,
    ...paymentIds,
  });

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
    const { settings } = await loadSettings();
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
}

/**
 * Skip Stripe/MSP API + heavy work when booking is already fully finalized.
 */
async function tryFastPathFinalized(
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
  let currency = 'EUR';
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
      return { success: false, message: 'transactionId or orderId is required for MultiSafepay' };
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

    const emails = await sendBookingEmails(emailData, existingBooking._id.toString());

    return {
      success: true,
      tripId: existingBooking.tripId,
      bookingId: existingBooking._id.toString(),
      alreadyExisted: true,
      emails,
    };
  }

  return createBookingFromPending(input, orderId!, paidAmount, currency, paymentIds);
}
