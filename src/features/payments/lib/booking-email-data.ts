import { getCurrencySymbol } from '@/lib/utils';
import type { IBooking } from '@/models/booking/Booking';
import type { IPendingBooking } from '@/models/booking/PendingBooking';
import type { IVehicle } from '@/models/vehicle/Vehicle';

export interface BookingEmailData {
  tripId: string;
  bookingId?: string;
  pickup: string;
  dropoff: string;
  stops: Array<{ location: string; order: number; duration?: number }>;
  tripType: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxIncluded?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  flightNumber?: string;
  baseUrl?: string;
}

export function buildBookingEmailData(
  orderId: string,
  pending: IPendingBooking,
  vehicle: IVehicle,
  options: {
    bookingId: string;
    paymentMethod: string;
    currency: string;
    baseUrl?: string;
  }
): BookingEmailData {
  const currencySymbol = getCurrencySymbol(options.currency);

  return {
    tripId: orderId,
    bookingId: options.bookingId,
    pickup: pending.bookingData.pickup,
    dropoff: pending.bookingData.dropoff || 'N/A (Hourly booking)',
    stops: pending.bookingData.stops || [],
    tripType: pending.bookingData.tripType,
    date: pending.bookingData.date,
    time: pending.bookingData.time,
    returnDate: pending.bookingData.returnDate,
    returnTime: pending.bookingData.returnTime,
    passengers: pending.bookingData.passengers,
    selectedVehicle: pending.bookingData.selectedVehicle,
    vehicleDetails: {
      name: vehicle.name,
      price: `${currencySymbol}${vehicle.price}`,
      seats: `${vehicle.persons} persons`,
    },
    childSeats: pending.bookingData.childSeats,
    babySeats: pending.bookingData.babySeats,
    notes: pending.bookingData.notes,
    flightNumber: pending.bookingData.flightNumber,
    firstName: pending.bookingData.firstName,
    lastName: pending.bookingData.lastName,
    email: pending.bookingData.email,
    phone: pending.bookingData.phone,
    totalAmount: pending.bookingData.totalAmount,
    subtotalAmount: pending.bookingData.subtotalAmount,
    taxAmount: pending.bookingData.taxAmount,
    taxPercentage: pending.bookingData.taxPercentage,
    paymentMethod: options.paymentMethod,
    paymentStatus: 'completed',
    baseUrl: options.baseUrl,
  };
}

export function buildBookingEmailDataFromBooking(
  booking: IBooking,
  options: { paymentMethod: string; currency: string; baseUrl?: string }
): BookingEmailData {
  const currencySymbol = getCurrencySymbol(options.currency);
  const vehicleDetails = booking.vehicleDetails ?? {
    name: 'Vehicle',
    price: `${currencySymbol}${booking.totalAmount ?? 0}`,
    seats: '',
  };

  return {
    tripId: booking.tripId,
    bookingId: booking._id.toString(),
    pickup: booking.pickup,
    dropoff: booking.dropoff || 'N/A (Hourly booking)',
    stops: booking.stops || [],
    tripType: booking.tripType,
    date: booking.date,
    time: booking.time,
    returnDate: booking.returnDate,
    returnTime: booking.returnTime,
    passengers: booking.passengers,
    selectedVehicle: String(booking.selectedVehicle),
    vehicleDetails,
    childSeats: booking.childSeats,
    babySeats: booking.babySeats,
    notes: booking.notes,
    flightNumber: booking.flightNumber,
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    phone: booking.phone,
    totalAmount: booking.totalAmount ?? 0,
    subtotalAmount: booking.subtotalAmount,
    taxAmount: booking.taxAmount,
    taxPercentage: booking.taxPercentage,
    paymentMethod: options.paymentMethod,
    paymentStatus: booking.paymentStatus,
    baseUrl: options.baseUrl,
  };
}
