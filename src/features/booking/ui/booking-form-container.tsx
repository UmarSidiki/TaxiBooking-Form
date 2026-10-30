"use client";
import { brandName } from "@/features/settings/lib/brand-name";

import React, { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import "./riviera/riviera.css";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { ControlDock } from "./riviera/control-dock";
import { useBookingFormContainer } from "@/features/booking/hooks/form-container/useBookingFormContainer";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { useGeo } from "@/features/geo/context/geo-context";
import { useTheme } from "@/features/settings/context/theme-context";

const HAS_MAP = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
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



  const withMap = currentStep === 1 && HAS_MAP;
  const dock = <ControlDock brand={brandName(settings) || t("Riviera.brandFallback")} />;

  return (
    <div className={`riviera min-h-screen ${withMap ? "" : "no-map"}`}>
      {withMap && (
        <div className="map">
          <Suspense fallback={<StepLoader />}>
            <RivieraMap />
          </Suspense>
          {dock}
        </div>
      )}

      <main className="sheet">
        <p className="step-count">{t("FormContainer.StepIndicator", { currentStep })}</p>

        <Suspense fallback={<StepLoader />}>
          {currentStep === 1 && <Step1TripDetails />}
          {currentStep === 2 && <Step2VehicleSelection />}
          {currentStep === 3 && <Step3Payment />}
        </Suspense>
      </main>
      {!withMap && dock}
    </div>
  );
}