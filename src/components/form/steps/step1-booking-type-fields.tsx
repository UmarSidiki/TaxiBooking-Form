"use client";

import { Button } from "@/components/ui/button";
import type { FormData } from "@/contexts/BookingFormContext";
import { Clock, MapPin } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step1BookingTypeFields({
  t,
  formData,
  handleBookingTypeChange,
}: {
  t: TFn;
  formData: FormData;
  handleBookingTypeChange: (type: FormData["bookingType"]) => void;
}) {
  return (
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              {t("Step1.BookingType")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => handleBookingTypeChange("destination")}
                variant="outline"
                className={`${
                  formData.bookingType === "destination"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <MapPin className="h-4 w-4" />
                {t("Step1.DestinationBased")}
              </Button>
              <Button
                type="button"
                onClick={() => handleBookingTypeChange("hourly")}
                variant="outline"
                className={`${
                  formData.bookingType === "hourly"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <Clock className="h-4 w-4" />
                {t("Step1.TimeBased")}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.bookingType === "destination"
                ? t("Step1.price-based-on-distance-traveled")
                : t("Step1.price-based-on-hourly-rate")}
            </p>
          </div>
  );
}
