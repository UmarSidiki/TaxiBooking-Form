import type { IBooking } from '@/features/booking/model';

export function createCancellationEmailData(
  booking: IBooking,
  updateData: Partial<IBooking>
) {
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: booking.dropoff || 'N/A (Hourly booking)',
    stops: booking.stops || [],
    tripType: booking.tripType,
    date: booking.date,
    time: booking.time,
    returnDate: booking.returnDate,
    returnTime: booking.returnTime,
    passengers: booking.passengers,
    selectedVehicle: booking.selectedVehicle,
    vehicleDetails: booking.vehicleDetails,
    childSeats: booking.childSeats,
    babySeats: booking.babySeats,
    notes: booking.notes,
    firstName: booking.firstName,
    lastName: booking.lastName,
    email: booking.email,
    phone: booking.phone,
    totalAmount: typeof booking.totalAmount === 'number' ? booking.totalAmount : 0,
    refundAmount:
      typeof updateData.refundAmount === 'number'
        ? updateData.refundAmount
        : booking.refundAmount || 0,
    refundPercentage:
      typeof updateData.refundPercentage === 'number'
        ? updateData.refundPercentage
        : booking.refundPercentage,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    canceledAt: updateData.canceledAt ?? booking.canceledAt,
  };
}
