import {
  DEFAULT_VEHICLE_MINIMUM_HOURS,
  DEFAULT_VEHICLE_PRICE_PER_HOUR,
  DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE,
} from "@/lib/fleet/vehicle-form-defaults";
import { buildStopCostBreakdown } from "@/lib/form/build-stop-cost-breakdown";
import type { DistanceData, FormData } from "@/contexts/BookingFormContext";
import type { ISetting } from "@/models/settings";
import type { IVehicle } from "@/models/vehicle";
import { useCallback } from "react";

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
  const calculateVehiclePrice = useCallback(() => {
    if (!selectedVehicle) return 0;

    // Hourly booking calculation
    if (formData.bookingType === "hourly") {
      const pricePerHour = selectedVehicle.pricePerHour || DEFAULT_VEHICLE_PRICE_PER_HOUR;
      const minimumHours = selectedVehicle.minimumHours || DEFAULT_VEHICLE_MINIMUM_HOURS;
      const hours = Math.max(formData.duration, minimumHours);
      return pricePerHour * hours;
    }
    // Destination-based booking calculation
    else {
      if (!distanceData) {
        return selectedVehicle.price;
      }
      const distancePrice =
        selectedVehicle.pricePerKm * distanceData.distance.km;
      let oneWayPrice = selectedVehicle.price + distancePrice;
      oneWayPrice = Math.max(oneWayPrice, selectedVehicle.minimumFare);

      let totalPrice = oneWayPrice;
      if (formData.tripType === "roundtrip") {
        const returnPercentage =
          selectedVehicle.returnPricePercentage === undefined
            ? DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE
            : selectedVehicle.returnPricePercentage;
        totalPrice = oneWayPrice + oneWayPrice * (returnPercentage / 100);
      }
      return totalPrice;
    }
  }, [selectedVehicle, formData.bookingType, formData.duration, formData.tripType, distanceData]);

  const vehiclePrice = calculateVehiclePrice();

  // Apply discount
  const discount = selectedVehicle?.discount || 0;
  const discountedVehiclePrice =
    discount > 0 ? vehiclePrice * (1 - discount / 100) : vehiclePrice;

  const childSeatPrice = selectedVehicle?.childSeatPrice || 0;
  const babySeatPrice = selectedVehicle?.babySeatPrice || 0;
  
  // Calculate stop costs
  const stopBasePrice = selectedVehicle?.stopPrice || 0;
  const stopPricePerHour = selectedVehicle?.stopPricePerHour || 0;
  const stopsTotalPrice = buildStopCostBreakdown(
    formData.stops,
    stopBasePrice,
    stopPricePerHour
  ).stopCosts;
  
  const extrasPrice =
    formData.childSeats * childSeatPrice + formData.babySeats * babySeatPrice + stopsTotalPrice;
  const subtotalPrice = discountedVehiclePrice + extrasPrice;
  
  // Tax calculation
  const enableTax = paymentSettings?.enableTax ?? false;
  const taxPercentage = paymentSettings?.taxPercentage ?? 0;
  const taxIncluded = paymentSettings?.taxIncluded ?? false;
  
  // If tax is included, calculate the tax portion from the subtotal (tax is already in the price)
  // If tax is not included, add tax on top of the subtotal
  const taxAmount = enableTax && taxPercentage > 0 
    ? (taxIncluded 
        ? subtotalPrice - (subtotalPrice / (1 + taxPercentage / 100)) // Extract tax from price
        : subtotalPrice * (taxPercentage / 100)) // Add tax to price
    : 0;
  const totalPrice = taxIncluded ? subtotalPrice : subtotalPrice + taxAmount;
  
  // For display/storage: when tax is included, subtotalAmount should be the pre-tax amount
  const displaySubtotalAmount = taxIncluded ? (subtotalPrice - taxAmount) : subtotalPrice;

  return {
    vehiclePrice,
    discount,
    discountedVehiclePrice,
    childSeatPrice,
    babySeatPrice,
    stopBasePrice,
    stopPricePerHour,
    stopsTotalPrice,
    extrasPrice,
    subtotalPrice,
    enableTax,
    taxPercentage,
    taxIncluded,
    taxAmount,
    totalPrice,
    displaySubtotalAmount,
  };
}
