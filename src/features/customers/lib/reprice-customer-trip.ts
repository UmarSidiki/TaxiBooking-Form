import type { IBooking } from "@/features/booking/model";
import { Vehicle } from "@/features/fleet/model";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { priceServerBooking } from "@/features/pricing/lib/price-server-booking";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";

export type RepriceCustomerTripInput = {
  date?: string;
  time?: string;
  pickup?: string;
  dropoff?: string;
  selectedVehicle?: string;
  passengers?: number;
  childSeats?: number;
  babySeats?: number;
  meetAndGreet?: boolean;
};

function normalizeInput(
  dateOrInput: string | RepriceCustomerTripInput | undefined,
  time?: string
): RepriceCustomerTripInput {
  if (typeof dateOrInput === "string") {
    return { date: dateOrInput, time };
  }
  return dateOrInput ?? {};
}

/** Re-prices a customer date/time/pax/extras change on the server. */
export async function repriceCustomerTrip(
  booking: IBooking,
  dateOrInput: string | RepriceCustomerTripInput,
  time?: string
): Promise<Partial<IBooking> | null> {
  const input = normalizeInput(dateOrInput, time);
  const date = input.date ?? booking.date;
  const timeValue = input.time ?? booking.time;

  const pickup = input.pickup ?? booking.pickup;
  const dropoff = input.dropoff ?? booking.dropoff;
  const vehicleId = input.selectedVehicle ?? booking.selectedVehicle;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return null;

  const { settings } = await loadPaymentSettings();
  const distanceKm =
    booking.bookingType === "hourly"
      ? undefined
      : await fetchRouteDistanceKm({
          pickup,
          dropoff: dropoff || "",
          stops: booking.stops,
        });

  if (
    booking.bookingType !== "hourly" &&
    booking.dropoff &&
    distanceKm == null
  ) {
    return null;
  }

  const baseBooking = {
    bookingType: booking.bookingType,
    tripType: booking.tripType,
    duration: booking.duration,
    pickup,
    dropoff,
    stops: booking.stops,
    childSeats: input.childSeats ?? booking.childSeats,
    babySeats: input.babySeats ?? booking.babySeats,
    meetAndGreet: input.meetAndGreet ?? booking.meetAndGreet,
    date,
    time: timeValue,
    returnDate: booking.returnDate,
    returnTime: booking.returnTime,
    email: booking.email,
    passengers: input.passengers ?? booking.passengers,
  };

  let serverPrice = await priceServerBooking({
    vehicle,
    booking: { ...baseBooking, promoCode: booking.promoCode } as any,
    distanceKm,
    tax: settings ?? {},
    redeem: false,
    now: zonedRideInstant(date, timeValue, "UTC") ?? undefined,
  });

  // If the promo no longer validates, reprice without it (never double-discount).
  if (!serverPrice.ok && String(serverPrice.error).startsWith("promo_")) {
    serverPrice = await priceServerBooking({
      vehicle,
      booking: { ...baseBooking, promoCode: undefined } as any,
      distanceKm,
      tax: settings ?? {},
      redeem: false,
      now: zonedRideInstant(date, timeValue, "UTC") ?? undefined,
    });
  }

  if (!serverPrice.ok) return null;
  const quote = serverPrice.quote;

  return {
    date,
    time: timeValue,
    pickup,
    dropoff,
    selectedVehicle: vehicleId,
    passengers: input.passengers ?? booking.passengers,
    childSeats: input.childSeats ?? booking.childSeats,
    babySeats: input.babySeats ?? booking.babySeats,
    meetAndGreet: input.meetAndGreet ?? booking.meetAndGreet,
    totalAmount: quote.total,
    subtotalAmount: quote.subtotal,
    taxAmount: quote.taxAmount,
    taxPercentage: quote.taxPercentage,
    depositDue: quote.depositDue,
    balanceDue: quote.balanceDue,
    fareLines: quote.lines,
    promoCode: quote.promoCode,
  };
}