"use client";

import { BookingPaymentIcons } from "@/features/booking/ui/booking-payment-icons";
import { Card } from "@/shared/ui/card";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import type { IVehicle } from "@/features/fleet/model";
import type { useTranslations } from "next-intl";
import { Step2IncludedServices } from "./step2-included-services";
import { Step2PriceBreakdown } from "./step2-price-breakdown";
import { Step2Support } from "./step2-support";
import { Step2TripRoute } from "./step2-trip-route";

type TFn = ReturnType<typeof useTranslations>;

export function Step2TripSummary({
  formData,
  vehicles,
  distanceData,
  calculatePrice,
  enableTax,
  taxPercentage,
  taxIncluded,
  currencySymbol,
  t,
}: {
  formData: FormData;
  vehicles: IVehicle[];
  distanceData: DistanceData | null;
  calculatePrice: (vehicle: IVehicle) => number;
  enableTax: boolean;
  taxPercentage: number;
  taxIncluded: boolean;
  currencySymbol: string;
  t: TFn;
}) {
  return (
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">
            {t("Step2.your-trip")}
          </h3>

          {/* Trip Details */}
          <Step2TripRoute
            formData={formData}
            distanceData={distanceData}
            t={t}
          />

          {/* Selected Vehicle Price */}
          <Step2PriceBreakdown
            formData={formData}
            vehicles={vehicles}
            calculatePrice={calculatePrice}
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
