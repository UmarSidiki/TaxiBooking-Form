"use client";

import { Segmented } from "@/shared/ui/riviera/segmented";
import type { FormData } from "@/features/booking/context/booking-form-context";
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
            <label className="block text-sm font-medium mb-1.5 text-[color:var(--ink)]">
              {t("Step1.BookingType")}
            </label>
            <Segmented
              label={t("Step1.BookingType")}
              value={formData.bookingType}
              options={[
                { value: "destination", label: t("Step1.DestinationBased") },
                { value: "hourly", label: t("Step1.TimeBased") },
              ]}
              onChange={handleBookingTypeChange}
            />
            <p className="text-xs text-[color:var(--ink2)] mt-1">
              {formData.bookingType === "destination"
                ? t("Step1.price-based-on-distance-traveled")
                : t("Step1.price-based-on-hourly-rate")}
            </p>
          </div>
  );
}
