import {
  DEFAULT_VEHICLE_MINIMUM_HOURS,
  DEFAULT_VEHICLE_PRICE_PER_HOUR,
  DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE,
} from "@/lib/fleet/vehicle-form-defaults";
import type { IVehicle } from '@/models/vehicle';

export interface BookingPriceInput {
  bookingType?: 'destination' | 'hourly';
  tripType?: 'oneway' | 'roundtrip';
  duration?: number;
  pickup?: string;
  dropoff?: string;
  stops?: Array<{ location: string; duration?: number }>;
  childSeats?: number;
  babySeats?: number;
}

export interface TaxSettings {
  enableTax?: boolean;
  taxPercentage?: number;
  taxIncluded?: boolean;
}

export interface BookingPriceResult {
  subtotal: number;
  taxAmount: number;
  taxPercentage: number;
  taxIncluded: boolean;
  total: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateBookingPrice(
  vehicle: IVehicle,
  input: BookingPriceInput,
  taxSettings: TaxSettings,
  distanceKm?: number
): BookingPriceResult {
  let vehiclePrice = 0;

  if (input.bookingType === 'hourly') {
    const pricePerHour = vehicle.pricePerHour || DEFAULT_VEHICLE_PRICE_PER_HOUR;
    const minimumHours = vehicle.minimumHours || DEFAULT_VEHICLE_MINIMUM_HOURS;
    const hours = Math.max(input.duration || 0, minimumHours);
    vehiclePrice = pricePerHour * hours;
  } else if (typeof distanceKm === 'number' && Number.isFinite(distanceKm)) {
    const distancePrice = vehicle.pricePerKm * distanceKm;
    let oneWayPrice = vehicle.price + distancePrice;
    oneWayPrice = Math.max(oneWayPrice, vehicle.minimumFare);

    if (input.tripType === 'roundtrip') {
      const returnPercentage =
        vehicle.returnPricePercentage === undefined ? DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE : vehicle.returnPricePercentage;
      vehiclePrice = oneWayPrice + oneWayPrice * (returnPercentage / 100);
    } else {
      vehiclePrice = oneWayPrice;
    }
  } else {
    vehiclePrice = vehicle.price;
  }

  const discount = vehicle.discount || 0;
  const discountedVehiclePrice =
    discount > 0 ? vehiclePrice * (1 - discount / 100) : vehiclePrice;

  const childSeatPrice = vehicle.childSeatPrice || 0;
  const babySeatPrice = vehicle.babySeatPrice || 0;
  const stopBasePrice = vehicle.stopPrice || 0;
  const stopPricePerHour = vehicle.stopPricePerHour || 0;

  let stopsTotalPrice = 0;
  if (input.stops && input.stops.length > 0) {
    input.stops
      .filter((stop) => stop.location?.trim())
      .forEach((stop) => {
        stopsTotalPrice += stopBasePrice;
        if (stop.duration && stop.duration > 0) {
          stopsTotalPrice += stopPricePerHour * (stop.duration / 60);
        }
      });
  }

  const extrasPrice =
    (Number(input.childSeats) || 0) * childSeatPrice +
    (Number(input.babySeats) || 0) * babySeatPrice +
    stopsTotalPrice;

  const subtotal = discountedVehiclePrice + extrasPrice;
  const enableTax = taxSettings.enableTax ?? false;
  const taxPercentage = taxSettings.taxPercentage ?? 0;
  const taxIncluded = taxSettings.taxIncluded ?? false;

  const taxAmount =
    enableTax && taxPercentage > 0
      ? taxIncluded
        ? subtotal - subtotal / (1 + taxPercentage / 100)
        : subtotal * (taxPercentage / 100)
      : 0;

  const total = taxIncluded ? subtotal : subtotal + taxAmount;

  return {
    subtotal: roundMoney(taxIncluded ? subtotal - taxAmount : subtotal),
    taxAmount: roundMoney(taxAmount),
    taxPercentage: enableTax ? taxPercentage : 0,
    taxIncluded,
    total: roundMoney(total),
  };
}

export async function fetchRouteDistanceKm(input: {
  pickup: string;
  dropoff: string;
  stops?: Array<{ location: string }>;
}): Promise<number | undefined> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || !input.pickup || !input.dropoff) {
    return undefined;
  }

  const validStops = (input.stops || [])
    .map((stop) => stop.location?.trim())
    .filter((location): location is string => Boolean(location));

  const waypoints =
    validStops.length > 0
      ? `&waypoints=${validStops.map((stop) => `via:${encodeURIComponent(stop)}`).join('|')}`
      : '';

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    input.pickup
  )}&destination=${encodeURIComponent(input.dropoff)}${waypoints}&key=${apiKey}&units=metric`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.routes?.[0]) {
    return undefined;
  }

  const meters = data.routes[0].legs.reduce(
    (total: number, leg: { distance: { value: number } }) => total + leg.distance.value,
    0
  );

  return meters / 1000;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
}
