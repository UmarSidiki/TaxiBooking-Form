import { sendOrderConfirmationEmail } from '@/features/booking/email/order-confirmation';
import { sendOrderNotificationEmail } from '@/features/booking/email/order-notification';
import { connectDB } from '@/shared/db';
import { generateTripId } from '@/shared/lib/generate-id';
import { getCurrencySymbol } from '@/shared/lib/utils';
import { sanitizeInput } from '@/shared/lib/validation';
import { isDuplicateKeyError } from '@/shared/lib/mongo-error';
import { Booking, PendingBooking } from '@/features/booking/model';
import {
  createBookingDocument,
  findRecentDuplicateBooking,
  updateBookingFields,
} from '@/features/booking/lib/booking.repo';
import { createCashBookingEmailData } from '@/features/booking/lib/create-cash-booking-email-data';
import { getSettingsCurrency } from '@/features/booking/lib/get-settings-currency';
import { initCashBookingPartners } from '@/features/booking/lib/init-cash-booking-partners';
import { priceServerBooking } from '@/features/pricing/lib/price-server-booking';
import { bookingAbuseReason, turnstileOk } from '@/shared/http/booking-abuse';
import { fetchRouteDistanceKm } from '@/features/payments/lib/fare/route-distance';
import { loadPaymentSettings } from '@/features/payments/lib/load-payment-settings';
import type { CashBookingInput } from '@/features/booking/schema/cash-booking.schema';
import { Vehicle } from '@/features/fleet/model';
import { sendBookingWhatsApp } from '@/features/settings/lib/send-booking-whatsapp';

export type CreateCashBookingResult =
  | {
      ok: true;
      tripId: string;
      totalAmount: number;
      message: string;
    }
  | { ok: false; status: number; message: string };

export async function createCashBooking(
  formData: CashBookingInput,
  baseUrl?: string,
  draftId?: string
): Promise<CreateCashBookingResult> {
  const abuse = bookingAbuseReason(formData);
  if (abuse) return { ok: false, status: 400, message: abuse };
  if (!(await turnstileOk(formData.turnstileToken, "unknown"))) {
    return { ok: false, status: 400, message: "turnstile" };
  }
  await connectDB();

  if (draftId) {
    const existing = await Booking.findOne({ draftId });
    if (existing) {
      return {
        ok: true,
        tripId: existing.tripId,
        totalAmount: existing.totalAmount ?? 0,
        message: "Booking already confirmed",
      };
    }
  }

  const vehicle = await Vehicle.findById(formData.selectedVehicle);

  if (!vehicle) {
    return { ok: false, status: 404, message: 'Selected vehicle not found' };
  }

  if (!vehicle.isActive) {
    return {
      ok: false,
      status: 400,
      message: 'Selected vehicle is not available',
    };
  }

  const existingBooking = await findRecentDuplicateBooking({
    email: formData.email,
    phone: formData.phone,
    pickup: formData.pickup,
    date: formData.date,
    time: formData.time,
  });

  if (existingBooking) {
    return {
      ok: true,
      tripId: existingBooking.tripId,
      totalAmount: existingBooking.totalAmount ?? 0,
      message: 'Booking already confirmed',
    };
  }

  const { settings } = await loadPaymentSettings();
  const distanceKm =
    formData.bookingType === 'hourly'
      ? undefined
      : await fetchRouteDistanceKm({
          pickup: formData.pickup,
          dropoff: formData.dropoff || '',
          stops: formData.stops,
        });

  const serverPrice = await priceServerBooking({
    vehicle,
    booking: formData,
    distanceKm,
    tax: settings ?? {},
    redeem: true,
  });
  if (!serverPrice.ok) {
    return { ok: false, status: 400, message: serverPrice.error };
  }
  const priced = serverPrice.quote;

  // Never store a destination fare that silently ignored the route distance.
  if (
    formData.bookingType !== 'hourly' &&
    formData.pickup &&
    formData.dropoff &&
    distanceKm == null
  ) {
    return { ok: false, status: 400, message: 'Could not calculate the route distance' };
  }

  if (priced.total <= 0) {
    return { ok: false, status: 400, message: 'Calculated fare is zero' };
  }

  const tripId = generateTripId();
  const currency = await getSettingsCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const sanitizedNotes = sanitizeInput(formData.notes || '');
  const sanitizedFlightNumber = formData.flightNumber
    ? sanitizeInput(formData.flightNumber)
    : undefined;

  const paymentMethod =
    formData.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cash';

  const bookingData = {
    tripId,
    draftId,
    pickup: formData.pickup,
    dropoff: formData.dropoff || '',
    stops: formData.stops || [],
    tripType: formData.tripType,
    bookingType: formData.bookingType,
    duration: formData.duration,
    date: formData.date,
    time: formData.time,
    returnDate: formData.returnDate,
    returnTime: formData.returnTime,
    passengers: formData.passengers,
    selectedVehicle: formData.selectedVehicle,
    vehicleDetails: {
      name: vehicle.name,
      price: `${currencySymbol}${vehicle.price}`,
      seats: `${vehicle.persons} persons`,
    },
    childSeats: formData.childSeats,
    babySeats: formData.babySeats,
    meetAndGreet: formData.meetAndGreet,
    promoCode: priced.promoCode,
    fareLines: priced.lines,
    notes: sanitizedNotes,
    flightNumber: sanitizedFlightNumber,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    whatsappOptIn: formData.whatsappOptIn ?? false,
    locale: formData.locale,
    paymentMethod,
    paymentStatus: 'pending' as const,
    status: 'upcoming',
    totalAmount: priced.total,
    subtotalAmount: priced.subtotal,
    taxAmount: priced.taxAmount,
    taxPercentage: priced.taxPercentage,
    depositDue: priced.depositDue,
    balanceDue: priced.balanceDue,
  };

  let savedBooking: Awaited<ReturnType<typeof createBookingDocument>>;
  try {
    savedBooking = await createBookingDocument(bookingData);
  } catch (error) {
    if (draftId && isDuplicateKeyError(error)) {
      const existing = await Booking.findOne({ draftId });
      if (existing) {
        return {
          ok: true,
          tripId: existing.tripId,
          totalAmount: existing.totalAmount ?? 0,
          message: "Booking already confirmed",
        };
      }
    }
    throw error;
  }

  if (draftId) {
    await PendingBooking.updateOne({ draftId }, { $set: { status: "abandoned" } });
  }

  await initCashBookingPartners(
    savedBooking._id.toString(),
    paymentMethod,
    priced.total,
    baseUrl
  );

  const emailData = await createCashBookingEmailData(
    {
      ...formData,
      totalAmount: priced.total,
      subtotalAmount: priced.subtotal,
      taxAmount: priced.taxAmount,
      taxPercentage: priced.taxPercentage,
    },
    vehicle,
    tripId,
    priced.total,
    baseUrl,
    savedBooking._id.toString()
  );

  const whatsapp = sendBookingWhatsApp(savedBooking._id.toString());
  try {
    const confirmationSent = await sendOrderConfirmationEmail(emailData);
    const adminSent = await sendOrderNotificationEmail(emailData);
    if (confirmationSent || adminSent) {
      await updateBookingFields(savedBooking._id.toString(), {
        ...(confirmationSent ? { confirmationEmailSent: true } : {}),
        ...(adminSent ? { adminNotificationSent: true } : {}),
      });
    }
  } catch {
    // Email failures are logged but don't prevent booking success
  } finally {
    await whatsapp;
  }

  return {
    ok: true,
    tripId,
    totalAmount: priced.total,
    message: 'Booking confirmed',
  };
}
