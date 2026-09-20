"use client";

import type { FormData } from "@/features/booking/context/booking-form-context";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV3TypeFields({
  t,
  isHourly,
  setBookingType,
}: {
  t: TFn;
  isHourly: boolean;
  setBookingType: (type: FormData["bookingType"]) => void;
}) {
  return (
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setBookingType("destination")}
              className={`flex-1 rounded-md px-2 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 ${
                !isHourly
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("embeddable.destination")}
            </button>
            <button
              type="button"
              onClick={() => setBookingType("hourly")}
              className={`flex-1 rounded-md px-2 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 ${
                isHourly
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("embeddable.hourly")}
            </button>
          </div>
  );
}
