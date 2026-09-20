import { getCurrencySymbol } from '@/lib/utils';
import type { IPendingBooking } from '@/models/booking/PendingBooking';
import type { PaymentProvider } from '@/lib/payments/finalize-paid-booking.types';

export function buildPaidBookingRecord(
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
