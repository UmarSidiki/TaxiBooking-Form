"use client";

import {
  DEFAULT_BABY_SEAT_PRICE,
  DEFAULT_CHILD_SEAT_PRICE,
} from "@/features/fleet/lib/vehicle-form-defaults";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { IVehicle } from "@/features/fleet/model";
import { useMemo } from "react";

export function useStep3Pricing({
  selectedVehicle,
  formData,
  distanceData,
  paymentSettings,
}: {
  selectedVehicle: IVehicle | undefined;
  formData: FormData;
  distanceData: DistanceData | null;
  paymentSettings: ISetting | null;
}) {
  const enableTax = paymentSettings?.enableTax ?? false;
  const taxPercentage = paymentSettings?.taxPercentage ?? 0;
  const taxIncluded = paymentSettings?.taxIncluded ?? false;

  const priced = useMemo(() => {
    if (!selectedVehicle) return null;

    return calculateBookingPrice(
      selectedVehicle,
      {
        bookingType: formData.bookingType,
        tripType: formData.tripType,
        duration: formData.duration,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        stops: formData.stops,
        childSeats: formData.childSeats,
        babySeats: formData.babySeats,
      },
      { enableTax, taxPercentage, taxIncluded },
      distanceData?.distance.km
    );
  }, [
    selectedVehicle,
    formData.bookingType,
    formData.tripType,
    formData.duration,
    formData.pickup,
    formData.dropoff,
    formData.stops,
    formData.childSeats,
    formData.babySeats,
    distanceData,
    enableTax,
    taxPercentage,
    taxIncluded,
  ]);

  const breakdown = priced?.breakdown;
  const subtotalPrice = breakdown
    ? breakdown.discountedVehiclePrice + breakdown.extrasPrice
    : 0;

  return {
    vehiclePrice: breakdown?.vehiclePrice ?? 0,
    discount: breakdown?.discountPercentage ?? 0,
    discountedVehiclePrice: breakdown?.discountedVehiclePrice ?? 0,
    childSeatPrice: selectedVehicle?.childSeatPrice ?? DEFAULT_CHILD_SEAT_PRICE,
    babySeatPrice: selectedVehicle?.babySeatPrice ?? DEFAULT_BABY_SEAT_PRICE,
    stopBasePrice: selectedVehicle?.stopPrice ?? 0,
    stopPricePerHour: selectedVehicle?.stopPricePerHour ?? 0,
    stopsTotalPrice: breakdown?.stopsTotalPrice ?? 0,
    extrasPrice: breakdown?.extrasPrice ?? 0,
    subtotalPrice,
    enableTax,
    taxPercentage,
    taxIncluded,
    taxAmount: priced?.taxAmount ?? 0,
    totalPrice: priced?.total ?? 0,
    displaySubtotalAmount: priced?.subtotal ?? 0,
  };
}
