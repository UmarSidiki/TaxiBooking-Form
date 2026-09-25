"use client";

import React, { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
// import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/chrome/language-switcher";
import { useBookingFormContainer } from "@/features/booking/hooks/form-container/useBookingFormContainer";
import { useGeo } from "@/features/geo/context/geo-context";
import { useTheme } from "@/features/settings/context/theme-context";
import Image from "next/image";

// Lazy load steps to reduce initial bundle size
const Step1TripDetails = lazy(() => import("./steps/step1-trip-details"));
const Step2VehicleSelection = lazy(() => import("./steps/step2-vehicle-selection"));
const Step3Payment = lazy(() => import("./steps/step3-payment"));

// Loading fallback component
const StepLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function BookingFormContainer() {
  const { initialized, currentStep } = useBookingFormContainer();
  const { isLoading } = useGeo();
  const { settings } = useTheme();
  // const t = useTranslations();

  // Wait until URL params are processed
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header - More Compact */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/icon.png"
                alt="RideNow"
                className="h-8 w-8 rounded-lg"
                width={32}
                height={32}
                priority
              />
              <span className="text-xl font-semibold text-gray-800">{process.env.NEXT_PUBLIC_WEBSITE_NAME}</span>
            </div>

            {/* Progress Indicator - Centered in Header */}
            {/* <div className="hidden md:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      currentStep >= 1
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-xs mt-1 text-gray-600">
                    {stepTitles[0]}
                  </span>
                </div>

                <div
                  className={`h-1 w-12 transition-all ${
                    currentStep >= 2 ? "bg-primary" : "bg-gray-200"
                  }`}
                ></div>

                <div className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      currentStep >= 2
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-xs mt-1 text-gray-600">
                    {stepTitles[1]}
                  </span>
                </div>

                <div
                  className={`h-1 w-12 transition-all ${
                    currentStep >= 3 ? "bg-primary" : "bg-gray-200"
                  }`}
                ></div>

                <div className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      currentStep >= 3
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs mt-1 text-gray-600">
                    {stepTitles[2]}
                  </span>
                </div>
              </div>
            </div> */}

            {/* Language Switcher */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Progress Indicator */}
      {/* <div className="md:hidden bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                    currentStep >= 1
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  1
                </div>
                <span className="text-xs mt-1 text-gray-600">
                  {stepTitles[0]}
                </span>
              </div>

              <div
                className={`h-1 w-8 transition-all ${
                  currentStep >= 2 ? "bg-primary" : "bg-gray-200"
                }`}
              ></div>

              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                    currentStep >= 2
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span className="text-xs mt-1 text-gray-600">
                  {stepTitles[1]}
                </span>
              </div>

              <div
                className={`h-1 w-8 transition-all ${
                  currentStep >= 3 ? "bg-primary" : "bg-gray-200"
                }`}
              ></div>

              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                    currentStep >= 3
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  3
                </div>
                <span className="text-xs mt-1 text-gray-600">
                  {stepTitles[2]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content - Increased Width */}
      <main className="max-w-7xl max-sm:max-w-full mx-auto pb-8 pt-6">
        <div className="bg-transparent overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<StepLoader />}>
              {currentStep === 1 && <Step1TripDetails />}
              {currentStep === 2 && <Step2VehicleSelection />}
              {currentStep === 3 && <Step3Payment />}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}