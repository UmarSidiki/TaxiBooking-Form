import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function getStep1Errors(formData: FormData, t: TFn): FormErrors {
  const newErrors: FormErrors = {};

  if (!formData.pickup.trim()) {
    newErrors.pickup = t("Step1.pickup-location-is-required");
  }

  // Dropoff is only required for destination-based bookings
  if (formData.bookingType === "destination" && !formData.dropoff.trim()) {
    newErrors.dropoff = t("Step1.dropoff-location-is-required");
  }

  if (!formData.date) {
    newErrors.date = t("Step1.date-is-required");
  }
  if (!formData.time) {
    newErrors.time = t("Step1.time-is-required");
  }

  // Validate return date/time for roundtrip bookings
  if (formData.tripType === "roundtrip") {
    if (!formData.returnDate) {
      newErrors.returnDate = t("Step1.return-date-is-required");
    } else if (formData.date && formData.returnDate < formData.date) {
      newErrors.returnDate = t("Step1.return-date-must-be-after-departure");
    }
    if (!formData.returnTime) {
      newErrors.returnTime = t("Step1.return-time-is-required");
    }
  }

  return newErrors;
}
