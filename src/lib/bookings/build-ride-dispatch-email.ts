import type { IBooking } from '@/models/booking';

const FALLBACK_VEHICLE_DETAILS = { name: 'N/A', price: '0', seats: '4' };

export function buildRideDispatchEmailPayload(
  booking: IBooking,
  assignee: { name: string; email: string },
  totalAmount: number
) {
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: booking.dropoff || 'N/A',
    stops: booking.stops || [],
    tripType: booking.tripType,
    date: booking.date,
    time: booking.time,
    returnDate: booking.returnDate,
    returnTime: booking.returnTime,
    passengers: booking.passengers,
    selectedVehicle: booking.selectedVehicle,
    vehicleDetails: booking.vehicleDetails || FALLBACK_VEHICLE_DETAILS,
    childSeats: booking.childSeats,
    babySeats: booking.babySeats,
    notes: booking.notes,
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    phone: booking.phone,
    totalAmount,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    flightNumber: booking.flightNumber,
    driverName: assignee.name,
    driverEmail: assignee.email,
  };
}

export function bookingTotalOrZero(booking: IBooking): number {
  return typeof booking.totalAmount === 'number' ? booking.totalAmount : 0;
}

export function partnerPayoutOrTotal(booking: IBooking): number {
  if (typeof booking.partnerPayoutAmount === 'number') {
    return booking.partnerPayoutAmount;
  }
  return bookingTotalOrZero(booking);
}
