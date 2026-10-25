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
              className={`flex min-h-11 flex-1 items-center justify-center rounded-md px-2 transition-colors duration-300 sm:px-4 ${
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
              className={`flex min-h-11 flex-1 items-center justify-center rounded-md px-2 transition-colors duration-300 sm:px-4 ${
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
