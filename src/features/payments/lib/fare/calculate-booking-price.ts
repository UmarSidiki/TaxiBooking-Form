import {
  DEFAULT_VEHICLE_MINIMUM_HOURS,
  DEFAULT_VEHICLE_PRICE_PER_HOUR,
  DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE,
} from "@/features/fleet/lib/vehicle-form-defaults";
import type { IVehicle } from "@/features/fleet/model";
import { applyPriceTiers } from "@/features/fleet/lib/apply-price-tiers";

export interface BookingPriceInput {
  bookingType?: "destination" | "hourly";
  tripType?: "oneway" | "roundtrip";
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

export interface BookingPriceBreakdown {
  vehiclePrice: number;
  discountPercentage: number;
  discountAmount: number;
  discountedVehiclePrice: number;
  childSeatsPrice: number;
  babySeatsPrice: number;
  stopsTotalPrice: number;
  extrasPrice: number;
}

export interface BookingPriceResult {
  subtotal: number;
  taxAmount: number;
  taxPercentage: number;
  taxIncluded: boolean;
  total: number;
  breakdown: BookingPriceBreakdown;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function vehiclePriceFor(
  vehicle: IVehicle,
  input: BookingPriceInput,
  distanceKm?: number
): number {
  if (input.bookingType === "hourly") {
    const pricePerHour =
      vehicle.pricePerHour ?? DEFAULT_VEHICLE_PRICE_PER_HOUR;
    const minimumHours = vehicle.minimumHours ?? DEFAULT_VEHICLE_MINIMUM_HOURS;
    const hours = Math.max(input.duration ?? 0, minimumHours);
    return pricePerHour * hours;
  }

  const minimumFare = vehicle.minimumFare ?? 0;

  if (typeof distanceKm === "number" && Number.isFinite(distanceKm)) {
    const tieredOneWay = applyPriceTiers(vehicle.priceTiers, distanceKm);

    // Tier-based pricing — minimum fare still applies
    const oneWayPrice =
      tieredOneWay !== undefined
        ? Math.max(tieredOneWay, minimumFare)
        : Math.max(
            (vehicle.price ?? 0) + (vehicle.pricePerKm ?? 0) * distanceKm,
            minimumFare
          );

    if (input.tripType === "roundtrip") {
      const returnPercentage =
        vehicle.returnPricePercentage ??
        DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE;
      return oneWayPrice + oneWayPrice * (returnPercentage / 100);
    }

    return oneWayPrice;
  }

  return vehicle.price ?? 0;
}

function stopsTotal(vehicle: IVehicle, input: BookingPriceInput): number {
  const stopBasePrice = vehicle.stopPrice ?? 0;
  const stopPricePerHour = vehicle.stopPricePerHour ?? 0;

  return (input.stops || [])
    .filter((stop) => stop.location?.trim())
    .reduce((total, stop) => {
      const durationCost =
        stop.duration && stop.duration > 0
          ? stopPricePerHour * (stop.duration / 60)
          : 0;
      return total + stopBasePrice + durationCost;
    }, 0);
}

/**
 * The single fare authority for both client preview and server storage.
 * Pass `distanceKm` from a server-fetched route distance; without it a
 * destination booking falls back to the vehicle's base price.
 */
export function calculateBookingPrice(
  vehicle: IVehicle,
  input: BookingPriceInput,
  taxSettings: TaxSettings,
  distanceKm?: number
): BookingPriceResult {
  const vehiclePrice = vehiclePriceFor(vehicle, input, distanceKm);

  const discountPercentage = vehicle.discount ?? 0;
  const discountedVehiclePrice =
    discountPercentage > 0
      ? vehiclePrice * (1 - discountPercentage / 100)
      : vehiclePrice;

  const childSeatsPrice =
    (Number(input.childSeats) || 0) * (vehicle.childSeatPrice ?? 0);
  const babySeatsPrice =
    (Number(input.babySeats) || 0) * (vehicle.babySeatPrice ?? 0);
  const stopsTotalPrice = stopsTotal(vehicle, input);
  const extrasPrice = childSeatsPrice + babySeatsPrice + stopsTotalPrice;

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
  const roundedTax = roundMoney(taxAmount);
  const roundedTotal = roundMoney(total);

  return {
    // Derived from total - tax so the displayed subtotal always adds up to the
    // displayed total (independent rounding could otherwise be a cent adrift).
    subtotal: roundMoney(roundedTotal - roundedTax),
    taxAmount: roundedTax,
    taxPercentage: enableTax ? taxPercentage : 0,
    taxIncluded,
    total: roundedTotal,
    breakdown: {
      vehiclePrice: roundMoney(vehiclePrice),
      discountPercentage,
      discountAmount: roundMoney(vehiclePrice - discountedVehiclePrice),
      discountedVehiclePrice: roundMoney(discountedVehiclePrice),
      childSeatsPrice: roundMoney(childSeatsPrice),
      babySeatsPrice: roundMoney(babySeatsPrice),
      stopsTotalPrice: roundMoney(stopsTotalPrice),
      extrasPrice: roundMoney(extrasPrice),
    },
  };
}
