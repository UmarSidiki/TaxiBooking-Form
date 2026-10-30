"use client";

import { Segmented } from "@/shared/ui/riviera/segmented";
import { Input } from "@/shared/ui/input";
import type { FormData } from "@/features/booking/context/booking-form-context";
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
              <label className="block text-sm font-medium mb-1.5 text-[color:var(--ink)]">
                {t("Step1.Duration")} *
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="2"
                className="focus:border-[var(--ink)]-500 focus:ring-primary-500"
                value={formData.duration}
                onChange={(e) => {
                  handleInputChange("duration", parseInt(e.target.value) || 1);
                }}
              />
              <p className="text-xs text-[color:var(--ink2)] mt-1">
                {t("Step1.DurationDescription")}
              </p>
            </div>
          )}

          {/* Trip Type - Only for destination-based bookings */}
          {formData.bookingType === "destination" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[color:var(--ink)]">
                {t("Step1.TripType")}
              </label>
              <Segmented
                label={t("Step1.TripType")}
                value={formData.tripType}
                options={[
                  { value: "oneway", label: t("Step1.OneWay") },
                  { value: "roundtrip", label: t("Step1.RoundTrip") },
                ]}
                onChange={(type) => {
                  handleTripTypeChange(type);
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur("pickup");
                  }
                }}
              />
            </div>
          )}
    </>
  );
}
