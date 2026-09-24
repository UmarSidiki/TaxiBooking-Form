import type { IVehicle } from '@/features/fleet/model';
import type { CashBookingInput } from '@/features/booking/schema/cash-booking.schema';
import { applyPriceTiers } from '@/features/fleet/lib/apply-price-tiers';

const DEFAULT_PRICE_PER_HOUR = 30;
const DEFAULT_MINIMUM_HOURS = 2;
const DEFAULT_HOURLY_DURATION = 2;
const DEFAULT_CHILD_SEAT_PRICE = 10;
const DEFAULT_BABY_SEAT_PRICE = 10;
const DEFAULT_RETURN_PERCENTAGE = 100;
const MINUTES_PER_HOUR = 60;

export async function calculateCashBookingTotal(
  formData: CashBookingInput,
  vehicle: IVehicle,
  baseUrl: string
): Promise<number> {
  let totalAmount = 0;

  if (formData.bookingType === 'hourly') {
    const pricePerHour = vehicle.pricePerHour || DEFAULT_PRICE_PER_HOUR;
    const minimumHours = vehicle.minimumHours || DEFAULT_MINIMUM_HOURS;
    const hours = Math.max(
      formData.duration || DEFAULT_HOURLY_DURATION,
      minimumHours
    );
    totalAmount = pricePerHour * hours;
  } else {
    totalAmount = vehicle.price;

    if (formData.pickup && formData.dropoff) {
      try {
        const distanceResponse = await fetch(`${baseUrl}/api/distance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: formData.pickup,
            destination: formData.dropoff,
          }),
        });

        if (distanceResponse.ok) {
          const distanceData = await distanceResponse.json();
          if (distanceData.success) {
            const distanceKm = distanceData.data.distance.km;

            // Try tier-based pricing first; fall back to base + pricePerKm
            const tieredOneWay = applyPriceTiers(vehicle.priceTiers, distanceKm);
            let oneWayPrice: number;
            if (tieredOneWay !== undefined) {
              oneWayPrice = Math.max(tieredOneWay, vehicle.minimumFare);
            } else {
              const distancePrice = vehicle.pricePerKm * distanceKm;
              oneWayPrice = Math.max(vehicle.price + distancePrice, vehicle.minimumFare);
            }

            if (formData.tripType === 'roundtrip') {
              const returnPercentage =
                vehicle.returnPricePercentage || DEFAULT_RETURN_PERCENTAGE;
              totalAmount =
                oneWayPrice + oneWayPrice * (returnPercentage / 100);
            } else {
              totalAmount = oneWayPrice;
            }
          }
        }
      } catch {
        totalAmount = vehicle.price;
      }
    }
  }

  const childSeatsCost =
    formData.childSeats * (vehicle.childSeatPrice || DEFAULT_CHILD_SEAT_PRICE);
  const babySeatsCost =
    formData.babySeats * (vehicle.babySeatPrice || DEFAULT_BABY_SEAT_PRICE);
  totalAmount += childSeatsCost + babySeatsCost;

  if (formData.stops && formData.stops.length > 0) {
    const stopBasePrice = vehicle.stopPrice || 0;
    const stopPricePerHour = vehicle.stopPricePerHour || 0;

    formData.stops.forEach((stop) => {
      totalAmount += stopBasePrice;

      if (stop.duration && stop.duration > 0) {
        const hours = stop.duration / MINUTES_PER_HOUR;
        totalAmount += stopPricePerHour * hours;
      }
    });
  }

  return totalAmount;
}
