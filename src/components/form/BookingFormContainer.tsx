"use client";

import React from "react";
import Step1TripDetails from "./steps/Step1TripDetails";
import Step2VehicleSelection from "./steps/Step2VehicleSelection";
import Step3Payment from "./steps/Step3Payment";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useBookingFormContainer } from "@/hooks/form/form-container/useBookingFormContainer";
import Image from "next/image";

export default function BookingFormContainer() {
  const { initialized, currentStep, getStepTitle } = useBookingFormContainer();
  const t = useTranslations();

  // Wait until URL params are processed
  if (!initialized) return null;

  // Get all step titles for the progress tracker
  const getAllStepTitles = () => {
    // Store current step to restore after getting titles
    const originalStep = currentStep;

    // Get titles for each step by temporarily changing the step
    const step1Title =
      originalStep === 1 ? getStepTitle() : t("FormContainer.trip-details");
    const step2Title =
      originalStep === 2 ? getStepTitle() : t("FormContainer.select-vehicle");
    const step3Title =
      originalStep === 3
        ? getStepTitle()
        : t("FormContainer.payment-and-details");

    return [step1Title, step2Title, step3Title];
  };

  const stepTitles = getAllStepTitles();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Header - More Compact */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/icon.png"
                alt="RideNow"
                className="h-8 w-8 rounded-lg"
                width={32}
                height={32}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary">
                  RideNow
                </h1>
              </div>
            </div>

            {/* Progress Indicator - Centered in Header */}
            <div className="hidden md:flex items-center justify-center flex-1 mx-8">
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
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Progress Indicator */}
      <div className="md:hidden bg-white shadow-sm">
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
      </div>

      {/* Main Content - Increased Width */}
      <main className="max-w-full mx-auto pb-8 pt-6">
        <div className="bg-transparent overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            {currentStep === 1 && <Step1TripDetails />}
            {currentStep === 2 && <Step2VehicleSelection />}
            {currentStep === 3 && <Step3Payment />}
          </div>
        </div>
      </main>
    </div>
  );
}