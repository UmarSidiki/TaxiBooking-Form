import { getCurrencySymbol } from '@/shared/lib/utils';
import { getSettingsCurrency } from '@/features/booking/lib/get-settings-currency';
import type { CashBookingInput } from '@/features/booking/schema/cash-booking.schema';
import type { IVehicle } from '@/features/fleet/model';

export async function createCashBookingEmailData(
  formData: CashBookingInput,
  vehicle: IVehicle,
  tripId: string,
  totalAmount: number,
  baseUrl?: string,
  bookingId?: string
) {
  const currency = await getSettingsCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  return {
    tripId,
    bookingId,
    pickup: formData.pickup,
    dropoff: formData.dropoff || 'N/A (Hourly booking)',
    stops: formData.stops || [],
    tripType: formData.tripType,
    bookingType: formData.bookingType,
    duration: formData.duration,
    locale: formData.locale,
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
    notes: formData.notes,
    flightNumber: formData.flightNumber,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    totalAmount: formData.totalAmount || totalAmount,
    subtotalAmount: formData.subtotalAmount,
    taxAmount: formData.taxAmount,
    taxPercentage: formData.taxPercentage,
    paymentMethod: formData.paymentMethod,
    paymentStatus: formData.paymentStatus,
    baseUrl,
  };
}
