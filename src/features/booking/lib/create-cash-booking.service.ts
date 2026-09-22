import { sendOrderConfirmationEmail } from '@/features/booking/email/order-confirmation';
import { sendOrderNotificationEmail } from '@/features/booking/email/order-notification';
import { connectDB } from '@/shared/db';
import { generateTripId } from '@/shared/lib/generate-id';
import { getCurrencySymbol } from '@/shared/lib/utils';
import { sanitizeInput } from '@/shared/lib/validation';
import {
  createBookingDocument,
  findRecentDuplicateBooking,
  updateBookingFields,
} from '@/features/booking/lib/booking.repo';
import { calculateCashBookingTotal } from '@/features/booking/lib/calculate-cash-booking-total';
import { createCashBookingEmailData } from '@/features/booking/lib/create-cash-booking-email-data';
import { getSettingsCurrency } from '@/features/booking/lib/get-settings-currency';
import { initCashBookingPartners } from '@/features/booking/lib/init-cash-booking-partners';
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
  origin: string,
  baseUrl?: string
): Promise<CreateCashBookingResult> {
  await connectDB();
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
      totalAmount: existingBooking.totalAmount,
      message: 'Booking already confirmed',
    };
  }

  const totalAmount = await calculateCashBookingTotal(formData, vehicle, origin);
  const tripId = generateTripId();
  const currency = await getSettingsCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const sanitizedNotes = sanitizeInput(formData.notes || '');
  const sanitizedFlightNumber = formData.flightNumber
    ? sanitizeInput(formData.flightNumber)
    : undefined;

  const bookingData = {
    tripId,
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
    notes: sanitizedNotes,
    flightNumber: sanitizedFlightNumber,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    whatsappOptIn: formData.whatsappOptIn ?? false,
    locale: formData.locale,
    paymentMethod: formData.paymentMethod || 'stripe',
    paymentStatus:
      (formData.paymentStatus as
        | 'pending'
        | 'completed'
        | 'failed'
        | 'refunded') || 'completed',
    stripePaymentIntentId: formData.stripePaymentIntentId,
    status: 'upcoming',
    totalAmount: formData.totalAmount || totalAmount,
    subtotalAmount: formData.subtotalAmount,
    taxAmount: formData.taxAmount,
    taxPercentage: formData.taxPercentage,
  };

  const savedBooking = await createBookingDocument(bookingData);

  await initCashBookingPartners(
    savedBooking._id.toString(),
    bookingData.paymentMethod,
    bookingData.totalAmount,
    baseUrl
  );

  const emailData = await createCashBookingEmailData(
    formData,
    vehicle,
    tripId,
    totalAmount,
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
    totalAmount,
    message: 'Booking confirmed',
  };
}
