"use client";

import { BookingPaymentIcons } from "@/features/booking/ui/booking-payment-icons";
import { Card } from "@/shared/ui/card";
import { seatPrices, usePricingExtras } from "@/features/pricing/lib/use-pricing-extras";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { IVehicle } from "@/features/fleet/model";
import type { useTranslations } from "next-intl";
import { Step2IncludedServices } from "./step2-included-services";
import { Step2PriceBreakdown } from "./step2-price-breakdown";
import { Step2Support } from "./step2-support";
import { TripStrip } from "@/features/booking/ui/riviera/trip-strip";

type TFn = ReturnType<typeof useTranslations>;

export function Step2TripSummary({
  formData,
  vehicles,
  distanceData,
  enableTax,
  taxPercentage,
  taxIncluded,
  currencySymbol,
  t,
}: {
  formData: FormData;
  vehicles: IVehicle[];
  distanceData: DistanceData | null;
  enableTax: boolean;
  taxPercentage: number;
  taxIncluded: boolean;
  currencySymbol: string;
  t: TFn;
}) {
  const seats = seatPrices(usePricingExtras());
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle._id === formData.selectedVehicle
  );

  const priceBreakdown = selectedVehicle
    ? calculateBookingPrice(
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
      )
    : null;

  return (
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <TripStrip />

          {/* Selected Vehicle Price */}
          <Step2PriceBreakdown
            formData={formData}
            vehicles={vehicles}
            priceBreakdown={priceBreakdown}
            enableTax={enableTax}
            taxPercentage={taxPercentage}
            taxIncluded={taxIncluded}
            currencySymbol={currencySymbol}
            t={t}
          />

          {/* Benefits */}
          <Step2IncludedServices t={t} />

          {/* Payment Methods */}
          <div className="border-t pt-3">
            <BookingPaymentIcons
              className="flex justify-center gap-2 flex-wrap opacity-70"
              imageClassName="h-6 w-auto"
            />
          </div>

          {/* Support */}
          <Step2Support t={t} />
        </Card>
      </div>
  );
}
