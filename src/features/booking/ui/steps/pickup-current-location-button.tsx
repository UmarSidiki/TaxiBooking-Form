"use client";

import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import {
  reverseGeocodePickup,
  type CurrentPickupFailure,
} from "@/features/booking/lib/maps/reverse-geocode-pickup";
import { useTheme } from "@/features/settings/context/theme-context";

const ERROR_KEYS: Record<CurrentPickupFailure, string> = {
  "permission-denied": "Step1.location-permission-denied",
  unavailable: "Step1.location-unavailable",
  "outside-service-area": "Step1.location-outside-service-area",
};

export function PickupCurrentLocationButton() {
  const t = useTranslations();
  const { setFormData, setErrors } = useBookingForm();
  const { settings } = useTheme();
  const [locating, setLocating] = useState(false);

  async function handleClick() {
    if (locating) return;
    setLocating(true);
    try {
      const result = await reverseGeocodePickup(settings);
      if (!result.ok) {
        setErrors((prev) => ({
          ...prev,
          pickup: t(ERROR_KEYS[result.reason]),
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, pickup: result.address, pickupLatLng: result.coords }));
      setErrors((prev) => ({ ...prev, pickup: undefined }));
    } finally {
      setLocating(false);
    }
  }

  return (
    <button
      type="button"
      className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      aria-label={
        locating ? t("Step1.locating") : t("Step1.use-current-location")
      }
      aria-busy={locating}
      disabled={locating}
      onClick={handleClick}
    >
      {locating ? (
        <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
      ) : (
        <LocateFixed className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
