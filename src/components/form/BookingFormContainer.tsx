"use client";

import React, { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { useBookingForm } from "@/contexts/BookingFormContext";
import { useSearchParams } from "next/navigation";
import type { FormData } from "@/contexts/BookingFormContext";
import Step1TripDetails from "./steps/Step1TripDetails";
import Step2VehicleSelection from "./steps/Step2VehicleSelection";
import Step3Payment from "./steps/Step3Payment";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../LanguageSwitcher";

export default function BookingFormContainer() {
  const { currentStep, setCurrentStep, setFormData } = useBookingForm();
  // Prevent flash of default step when deep linking
  const [initialized, setInitialized] = useState(false);
  const searchParams = useSearchParams();

  // Prefill form data and set step based on URL parameters
  useEffect(() => {
    const params = searchParams;
    const stepRaw = params.get("step");
    const bookingRaw = params.get("bookingType") ?? params.get("bookingtype");
    const pickupRaw = params.get("pickup");
    const dropoffRaw = params.get("dropoff");
    const dateRaw = params.get("date");
    const timeRaw = params.get("time");
    const paxRaw = params.get("passengers");
    const tripRaw = params.get("tripType") ?? params.get("triptype");
    const durationRaw = params.get("duration") ?? params.get("hours");

    // Build updates
    const updates: Partial<FormData> = {};
    if (bookingRaw === "destination" || bookingRaw === "hourly") {
      updates.bookingType = bookingRaw as "destination" | "hourly";
      if (bookingRaw === "hourly") updates.dropoff = "";
    }
    if (pickupRaw) updates.pickup = pickupRaw;
    if (dropoffRaw && updates.bookingType !== "hourly")
      updates.dropoff = dropoffRaw;
    if (dateRaw) updates.date = dateRaw;
    if (timeRaw) updates.time = timeRaw;
    if (paxRaw) updates.passengers = parseInt(paxRaw, 10) || 1;
    // Only accept 'oneway' or 'return' (mapped to 'roundtrip')
    if (tripRaw === "oneway" || tripRaw === "return") {
      updates.tripType = tripRaw === "return" ? "roundtrip" : "oneway";
    }
    if (bookingRaw === "hourly" && durationRaw) {
      const d = parseInt(durationRaw, 10);
      if (!isNaN(d) && d > 0) updates.duration = d;
    }

    // Apply updates if any form params exist
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
      // Determine step
      if (stepRaw && ["1", "2", "3"].includes(stepRaw)) {
        setCurrentStep(parseInt(stepRaw, 10) as 1 | 2 | 3);
      } else {
        setCurrentStep(2);
      }
    }
    // Mark initialization complete after processing params
    setInitialized(true);
  }, [searchParams, setFormData, setCurrentStep]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t('FormContainer.trip-details');
      case 2:
        return t('FormContainer.select-vehicle');
      case 3:
        return t('FormContainer.payment-and-details');
      default:
        return t('FormContainer.booking');
    }
  };
  const t = useTranslations();

  // Wait until URL params are processed
  if (!initialized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">{t("Footer.Copyright")}</p>
            <p className="text-xs">
              {t("Footer.Support")}{" "}
              <a
                href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {process.env.NEXT_PUBLIC_PHONE_NUMBER}
              </a>
              {" | "}
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
