"use client";

import React, { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import "./riviera/theme.css";
import "./riviera/riviera.css";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { LanguageSwitcher } from "@/shared/chrome/language-switcher";
import { TripStrip } from "./riviera/trip-strip";
import { RivieraThemeToggle } from "./riviera/theme-toggle";
import { useBookingFormContainer } from "@/features/booking/hooks/form-container/useBookingFormContainer";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { useGeo } from "@/features/geo/context/geo-context";
import { useTheme } from "@/features/settings/context/theme-context";

const RivieraMap = dynamic(() => import("./riviera/route-map").then((m) => m.RivieraMap), { ssr: false });

// Lazy load steps to reduce initial bundle size
const Step1TripDetails = lazy(() => import("./riviera/steps/route-step"));
const Step2VehicleSelection = lazy(() => import("./riviera/steps/vehicle-step"));
const Step3Payment = lazy(() => import("./riviera/steps/details-step"));

// Loading fallback component
const StepLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function BookingFormContainer() {
  const { initialized, currentStep } = useBookingFormContainer();
  const { formData, setFormData } = useBookingForm();
  const { isLoading } = useGeo();
  const { settings } = useTheme();
  const t = useTranslations();
  // const t = useTranslations();

  // Wait until URL params are processed
  useEffect(() => {
    if (formData.formStartedAt) return;
    setFormData((prev) => (prev.formStartedAt ? prev : { ...prev, formStartedAt: Date.now() }));
  }, [formData.formStartedAt, setFormData]);

  if (!initialized) return null;

  // Hold only while a configured restriction is still resolving. The block
  // itself is shown in step 3, in place of the payment options.
  const countryRestricted =
    (settings?.allowedBookingCountries?.length ?? 0) > 0;
  if (countryRestricted && isLoading) return <StepLoader />;

  // Get step titles directly from translations
  // const stepTitles = [
  //   t("FormContainer.trip-details"),
  //   t("FormContainer.select-vehicle"),
  //   t("FormContainer.payment-and-details")
  // ];

  const stepLabels = [t("FormContainer.trip-details"), t("FormContainer.select-vehicle"), t("FormContainer.payment-and-details")];

  return (
    <div className={`riviera min-h-screen ${currentStep > 1 ? "no-map" : ""}`}>
      <header className="top">
        <span className="brand">
          <b></b>
          {process.env.NEXT_PUBLIC_WEBSITE_NAME}
        </span>
        <div className="lang">
          <LanguageSwitcher />
        </div>
        <RivieraThemeToggle />
      </header>

      {currentStep === 1 && (
        <div className="map">
          <Suspense fallback={<StepLoader />}>
            <RivieraMap />
          </Suspense>
        </div>
      )}

      <main className="sheet">
        <nav className="steps" aria-label="Progress">
          {stepLabels.map((s, i) => (
            <span key={s} className={i + 1 === currentStep ? "on" : i + 1 < currentStep ? "done" : ""} aria-current={i + 1 === currentStep ? "step" : undefined}>
              {s}
            </span>
          ))}
        </nav>

        <Suspense fallback={<StepLoader />}>
          {currentStep === 1 && <Step1TripDetails />}
          {currentStep === 2 && <Step2VehicleSelection />}
          {currentStep === 3 && <Step3Payment />}
        </Suspense>
      </main>
    </div>
  );
}