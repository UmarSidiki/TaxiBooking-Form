import { getCurrencySymbol } from '@/shared/lib/utils';
import type { IPendingBooking } from '@/features/booking/model/PendingBooking';
import type { PaymentProvider } from '@/features/payments/lib/finalize-paid-booking.types';

export function buildPaidBookingRecord(
  orderId: string,
  pending: IPendingBooking,
  vehicle: { name: string; price: number | string; persons: number },
  options: {
    paymentMethod: PaymentProvider;
    paidAmount: number;
    currency: string;
    draftId?: string;
    stripePaymentIntentId?: string;
    multisafepayOrderId?: string;
    multisafepayTransactionId?: string;
  }
) {
  const currencySymbol = getCurrencySymbol(options.currency);
  const data = pending.bookingData;
  const purpose = pending.purpose ?? "booking";
  const isAppointment = purpose === "appointment_deposit";
  const paymentMethod = isAppointment
    ? "unpaid"
    : pending.paymentMethod || options.paymentMethod;

  return {
    tripId: orderId,
    draftId: options.draftId,
    pickup: data.pickup,
    pickupLatLng: data.pickupLatLng ?? undefined,
    dropoff: data.dropoff || '',
    dropoffLatLng: data.bookingType === 'hourly' ? undefined : data.dropoffLatLng ?? undefined,
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
    whatsappOptIn: data.whatsappOptIn ?? false,
    locale: data.locale,
    paymentMethod,
    paymentStatus: 'completed' as const,
    amountPaidCents: Math.round(options.paidAmount * 100),
    ...(purpose === "booking"
      ? {}
      : {
          depositPaidCents: Math.round(options.paidAmount * 100),
          ...(options.stripePaymentIntentId
            ? { depositPaymentIntentId: options.stripePaymentIntentId }
            : {}),
        }),
    stripePaymentIntentId: options.stripePaymentIntentId,
    multisafepayOrderId: options.multisafepayOrderId,
    multisafepayTransactionId: options.multisafepayTransactionId,
    status: isAppointment ? ('requested' as const) : ('upcoming' as const),
    ...(isAppointment ? { estimatedAmount: data.totalAmount } : {}),
    totalAmount: data.totalAmount,
    subtotalAmount: data.subtotalAmount,
    taxAmount: data.taxAmount,
    taxPercentage: data.taxPercentage,
    depositDue: data.depositDue,
    balanceDue: data.balanceDue,
    fareLines: data.fareLines,
    promoCode: data.promoCode,
    meetAndGreet: data.meetAndGreet,
    // Partner review required before overflow / assign (no notify until approve)
    partnerReviewStatus: 'pending' as const,
  };
}
