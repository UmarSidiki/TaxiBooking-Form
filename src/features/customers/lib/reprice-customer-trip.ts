import type { IBooking } from "@/features/booking/model";
import { Vehicle } from "@/features/fleet/model";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { priceServerBooking } from "@/features/pricing/lib/price-server-booking";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";

/** Re-prices a customer date/time change on the server. */
export async function repriceCustomerTrip(
  booking: IBooking,
  date: string,
  time: string
): Promise<Partial<IBooking> | null> {
  const vehicle = await Vehicle.findById(booking.selectedVehicle);
  if (!vehicle) return null;

  const { settings } = await loadPaymentSettings();
  const distanceKm =
    booking.bookingType === "hourly"
      ? undefined
      : await fetchRouteDistanceKm({
          pickup: booking.pickup,
          dropoff: booking.dropoff || "",
          stops: booking.stops,
        });

  if (
    booking.bookingType !== "hourly" &&
    booking.dropoff &&
    distanceKm == null
  ) {
    return null;
  }

  const serverPrice = await priceServerBooking({
    vehicle,
    booking: {
      bookingType: booking.bookingType,
      tripType: booking.tripType,
      duration: booking.duration,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      stops: booking.stops,
      childSeats: booking.childSeats,
      babySeats: booking.babySeats,
      meetAndGreet: booking.meetAndGreet,
      promoCode: booking.promoCode,
      date,
      time,
      returnDate: booking.returnDate,
      returnTime: booking.returnTime,
      email: booking.email,
    },
    distanceKm,
    tax: settings ?? {},
    redeem: false,
    now: zonedRideInstant(date, time, "UTC") ?? undefined,
  });

  if (!serverPrice.ok) return null;
  const quote = serverPrice.quote;

  return {
    date,
    time,
    totalAmount: quote.total,
    subtotalAmount: quote.subtotal,
    taxAmount: quote.taxAmount,
    taxPercentage: quote.taxPercentage,
    depositDue: quote.depositDue,
    balanceDue: quote.balanceDue,
    fareLines: quote.lines,
  };
}
