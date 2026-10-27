"use client";

import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { IVehicle } from "@/features/fleet/model";
import { useMemo } from "react";
import { useQuotedTotal } from "@/features/pricing/lib/use-quoted-total";
import { seatPrices, usePricingExtras } from "@/features/pricing/lib/use-pricing-extras";

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

  const extras = usePricingExtras();
  const seats = seatPrices(extras);

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
        ...seats,
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
    seats.childSeatPrice,
    seats.babySeatPrice,
    distanceData,
    enableTax,
    taxPercentage,
    taxIncluded,
  ]);

  const quoted = useQuotedTotal(formData, distanceData?.distance.km, priced?.total ?? 0);

  const breakdown = priced?.breakdown;
  const subtotalPrice = breakdown
    ? breakdown.discountedVehiclePrice + breakdown.extrasPrice
    : 0;

  return {
    vehiclePrice: breakdown?.vehiclePrice ?? 0,
    discount: breakdown?.discountPercentage ?? 0,
    discountedVehiclePrice: breakdown?.discountedVehiclePrice ?? 0,
    childSeatPrice: seats.childSeatPrice,
    babySeatPrice: seats.babySeatPrice,
    extras,
    stopBasePrice: selectedVehicle?.stopPrice ?? 0,
    stopPricePerHour: selectedVehicle?.stopPricePerHour ?? 0,
    stopsTotalPrice: breakdown?.stopsTotalPrice ?? 0,
    extrasPrice: breakdown?.extrasPrice ?? 0,
    subtotalPrice,
    enableTax,
    taxPercentage,
    taxIncluded,
    taxAmount: priced?.taxAmount ?? 0,
    totalPrice: quoted.total,
    chargeAmount: quoted.chargeAmount,
    depositDue: quoted.depositDue,
    balanceDue: quoted.balanceDue,
    quoteReady: quoted.ready,
    displaySubtotalAmount: priced?.subtotal ?? 0,
  };
}
