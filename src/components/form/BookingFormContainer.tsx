"use client";

import React from "react";
import { Car } from "lucide-react";
import Step1TripDetails from "./steps/Step1TripDetails";
import Step2VehicleSelection from "./steps/Step2VehicleSelection";
import Step3Payment from "./steps/Step3Payment";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useBookingFormContainer } from "@/hooks/form/form-container/useBookingFormContainer";

export default function BookingFormContainer() {
  const { initialized, currentStep, getStepTitle } = useBookingFormContainer();
  const t = useTranslations();

  // Wait until URL params are processed
  if (!initialized) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="text-primary h-8 w-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary">
                  {process.env.NEXT_PUBLIC_WEBSITE_NAME}
                </h1>
                <p className="text-xs text-gray-500">
                  {t("FormContainer.Title")}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-600">{getStepTitle()}</span>
              </div>
              <div className="flex gap-2">
                <div
                  className={`h-2 w-2 sm:h-3 sm:w-8 rounded-full transition-all ${
                    currentStep >= 1 ? "bg-primary" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`h-2 w-2 sm:h-3 sm:w-8 rounded-full transition-all ${
                    currentStep >= 2 ? "bg-primary" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`h-2 w-2 sm:h-3 sm:w-8 rounded-full transition-all ${
                    currentStep >= 3 ? "bg-primary" : "bg-gray-300"
                  }`}
                ></div>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full">
          {/* Step Title - Mobile */}
          <div className="sm:hidden text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getStepTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              {t("FormContainer.StepIndicator", { currentStep, totalSteps: 3 })}
            </p>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              {currentStep === 1 && <Step1TripDetails />}
              {currentStep === 2 && <Step2VehicleSelection />}
              {currentStep === 3 && <Step3Payment />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
