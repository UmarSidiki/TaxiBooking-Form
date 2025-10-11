"use client";

import React, { useEffect } from 'react';
import { Car } from 'lucide-react';
import { useBookingForm } from '@/contexts/BookingFormContext';
import Step1TripDetails from './steps/Step1TripDetails';
import Step2VehicleSelection from './steps/Step2VehicleSelection';
import Step3Payment from './steps/Step3Payment';
import { useSearchParams } from 'next/navigation';

export default function BookingFormContainer() {
  const { currentStep, setCurrentStep, setFormData } = useBookingForm();
  const searchParams = useSearchParams();

  // Handle URL parameters for embeddable form
  useEffect(() => {
    const step = searchParams.get('step');
    const pickup = searchParams.get('pickup');
    const dropoff = searchParams.get('dropoff');
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const passengers = searchParams.get('passengers');
    const tripType = searchParams.get('tripType');
    const bookingType = searchParams.get('bookingType');
    const duration = searchParams.get('duration');

    // If step parameter is provided, navigate to that step
    if (step) {
      const stepNumber = parseInt(step);
      if (stepNumber === 1 || stepNumber === 2 || stepNumber === 3) {
        setCurrentStep(stepNumber);
      }
    }

    // Pre-fill form data from URL parameters
    if (pickup || dropoff || date || time || passengers || tripType || bookingType || duration) {
      setFormData(prev => ({
        ...prev,
        ...(pickup && { pickup }),
        ...(dropoff && { dropoff }),
        ...(date && { date }),
        ...(time && { time }),
        ...(passengers && { passengers: parseInt(passengers) || 1 }),
        ...(tripType && { tripType: tripType as 'oneway' | 'roundtrip' }),
        ...(bookingType && { bookingType: bookingType as 'destination' | 'hourly' }),
        ...(duration && { duration: parseInt(duration) || 2 }),
      }));
    }
  }, [searchParams, setCurrentStep, setFormData]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Trip Details";
      case 2:
        return "Select Vehicle";
      case 3:
        return "Payment & Details";
      default:
        return "Booking";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="text-primary h-8 w-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-secondary">Swiss Ride SARL</h1>
                <p className="text-xs text-gray-500">Premium Transport Service</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-600">{getStepTitle()}</span>
              </div>
              <div className="flex gap-2">
                <div className={`h-2 w-2 sm:h-3 sm:w-8 rounded-full transition-all ${currentStep >= 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`h-2 w-2 sm:h-3 sm:w-8 rounded-full transition-all ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`h-2 w-2 sm:h-3 sm:w-8 rounded-full transition-all ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full">
          {/* Step Title - Mobile */}
          <div className="sm:hidden text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h2>
            <p className="text-sm text-gray-500">Step {currentStep} of 3</p>
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
            <p className="mb-2">© 2025 Swiss Ride SARL. All rights reserved.</p>
            <p className="text-xs">
              24/7 Support: <a href="tel:+41763868121" className="text-primary-600 hover:text-primary-700">+41 76 3868121</a>
              {' | '}
              <a href="mailto:booking@swissride-sarl.ch" className="text-primary-600 hover:text-primary-700">booking@swissride-sarl.ch</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
