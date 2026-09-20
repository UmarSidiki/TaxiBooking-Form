"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormData } from "@/contexts/BookingFormContext";
import { Clock } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step1DurationTripTypeFields({
  t,
  formData,
  handleInputChange,
  handleInputBlur,
  handleTripTypeChange,
}: {
  t: TFn;
  formData: FormData;
  handleInputChange: (field: string, value: string | number) => void;
  handleInputBlur: (field: string) => void;
  handleTripTypeChange: (type: FormData["tripType"]) => void;
}) {
  return (
    <>
          {/* Duration - Only for hourly bookings */}
          {formData.bookingType === "hourly" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                {t("Step1.Duration")} *
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="2"
                className="focus:border-primary-500 focus:ring-primary-500"
                value={formData.duration}
                onChange={(e) => {
                  handleInputChange("duration", parseInt(e.target.value) || 1);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Step1.DurationDescription")}
              </p>
            </div>
          )}

          {/* Trip Type - Only for destination-based bookings */}
          {formData.bookingType === "destination" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Trip Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    handleTripTypeChange("oneway");
                    if (formData.pickup && formData.dropoff) {
                      handleInputBlur("pickup");
                    }
                  }}
                  variant="outline"
                  className={`${
                    formData.tripType === "oneway"
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {t("Step1.OneWay")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleTripTypeChange("roundtrip");
                    if (formData.pickup && formData.dropoff) {
                      handleInputBlur("pickup");
                    }
                  }}
                  variant="outline"
                  className={`${
                    formData.tripType === "roundtrip"
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {t("Step1.RoundTrip")}
                </Button>
              </div>
            </div>
          )}
    </>
  );
}
