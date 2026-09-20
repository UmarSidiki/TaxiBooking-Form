import {
  sendOrderConfirmationEmail,
  sendOrderNotificationEmail,
} from '@/controllers/email/bookings';
import { connectDB } from '@/lib/database';
import { generateTripId } from '@/lib/generate-id';
import { getCurrencySymbol } from '@/lib/utils';
import { sanitizeInput } from '@/lib/validation';
import {
  createBookingDocument,
  findRecentDuplicateBooking,
  updateBookingFields,
} from '@/lib/bookings/booking.repo';
import { calculateCashBookingTotal } from '@/lib/bookings/calculate-cash-booking-total';
import { createCashBookingEmailData } from '@/lib/bookings/create-cash-booking-email-data';
import { getSettingsCurrency } from '@/lib/bookings/get-settings-currency';
import { initCashBookingPartners } from '@/lib/bookings/init-cash-booking-partners';
import type { BookingInput } from '@/models/booking';
import { Vehicle } from '@/models/vehicle';

export type CreateCashBookingResult =
  | {
      ok: true;
      tripId: string;
      totalAmount: number;
      message: string;
    }
  | { ok: false; status: number; message: string };

export async function createCashBooking(
  formData: BookingInput,
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
  }

  return {
    ok: true,
    tripId,
    totalAmount,
    message: 'Booking confirmed',
  };
}
