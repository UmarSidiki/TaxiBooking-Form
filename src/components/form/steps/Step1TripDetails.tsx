"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Flag, CalendarDays, Clock, Users, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useStep1 } from '@/hooks/form/form-steps/useStep1';
import { useTranslations } from 'next-intl';

export default function Step1TripDetails() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // State for passenger input to handle empty state
  const [passengerInputValue, setPassengerInputValue] = useState('');

  const {
    // State
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,

    // Context values
    formData,
    setFormData,
    errors,
    distanceData,
    calculatingDistance,
    isLoading,

    // Functions
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
    handleNext,
  } = useStep1();

  const t = useTranslations();

  // Initialize passenger input value
  useEffect(() => {
    if (formData.passengers === 1) {
      setPassengerInputValue('1');
    } else {
      setPassengerInputValue(formData.passengers.toString());
    }
  }, [formData.passengers]);
  
  // Handle passenger input change
  const handlePassengerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassengerInputValue(value);
    
    // Only update form data if it's a valid number
    const numValue = parseInt(value, 10);
    if (value === '' || (!isNaN(numValue) && numValue >= 1 && numValue <= 8)) {
      const finalValue = value === '' ? 1 : numValue;
      handleInputChange('passengers', finalValue);
    }
  };

  // Handle passenger input blur
  const handlePassengerBlur = () => {
    if (passengerInputValue === '' || isNaN(parseInt(passengerInputValue)) || parseInt(passengerInputValue) < 1) {
      setPassengerInputValue('');
      handleInputChange('passengers', 1);
    } else {
      const numValue = Math.min(8, Math.max(1, parseInt(passengerInputValue)));
      setPassengerInputValue(numValue === 1 ? '' : numValue.toString());
      handleInputChange('passengers', numValue);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
      {/* Map Section - Left Side */}
      <div className="lg:col-span-3 max-sm:order-2">
        <Card className="h-full min-h-[500px] lg:min-h-[600px] overflow-hidden border-0 shadow-none">
          <div className="relative w-full h-full bg-white p-3">
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {/* Distance Info Overlay */}
            {distanceData && (
              <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Distance")}</p>
                      <p className="font-semibold">{distanceData.distance.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Duration")}</p>
                      <p className="font-semibold">{distanceData.duration.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Date")}</p>
                      <p className="font-semibold">{formData.date || t('not-set')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Passengers")}</p>
                      <p className="font-semibold">{formData.passengers}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Form Section - Right Side */}
      <div className="lg:col-span-4 bg-white p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{t("Step1.Title")}</h2>
            <p className="text-sm text-gray-600">{t("Step1.Description")}</p>
          </div>

          {/* Booking Type */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">{t("Step1.BookingType")}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => handleBookingTypeChange("destination")}
                variant="outline"
                className={`${
                  formData.bookingType === "destination"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t("Step1.DestinationBased")}
              </Button>
              <Button
                type="button"
                onClick={() => handleBookingTypeChange("hourly")}
                variant="outline"
                className={`${
                  formData.bookingType === "hourly"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t("Step1.TimeBased")}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.bookingType === "destination" 
                ? t('Step1.price-based-on-distance-traveled') 
                : t('Step1.price-based-on-hourly-rate')}
            </p>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1 text-primary" />
              {t("Step1.PickupLocation")} *
            </label>
            <Input 
              ref={pickupInputRef}
              placeholder={t("Step1.PickupPlaceholder")} 
              className={`${errors.pickup ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
              value={formData.pickup}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, pickup: e.target.value }));
              }}
              onBlur={() => {
                if (formData.pickup && formData.dropoff) {
                  handleInputBlur('pickup');
                }
              }}
            />
            {errors.pickup && <p className="text-red-500 text-xs mt-1">{errors.pickup}</p>}
          </div>

          {/* Dropoff Location - Only for destination-based bookings */}
          {formData.bookingType === 'destination' && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Flag className="inline h-4 w-4 mr-1 text-primary" />
                {t("Step1.DropoffLocation")} *
              </label>
              <Input 
                ref={dropoffInputRef}
                placeholder={t("Step1.DropoffPlaceholder")} 
                className={`${errors.dropoff ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
                value={formData.dropoff}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, dropoff: e.target.value }));
                }}
                onBlur={() => {
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur('dropoff');
                  }
                }}
              />
              {errors.dropoff && <p className="text-red-500 text-xs mt-1">{errors.dropoff}</p>}
              {calculatingDistance && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  {t("Step1.CalculatingDistance")}
                </p>
              )}
            </div>
          )}

          {/* Duration - Only for hourly bookings */}
          {formData.bookingType === 'hourly' && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                {t("Step1.Duration")} *
              </label>
              <Input 
                type="number"
                min="1"
                step="1"
                placeholder="2"
                className="focus:border-primary-500 focus:ring-primary-500"
                value={formData.duration}
                onChange={(e) => {
                  handleInputChange('duration', parseInt(e.target.value) || 1);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">{t("Step1.DurationDescription")}</p>
            </div>
          )}

          {/* Trip Type - Only for destination-based bookings */}
          {formData.bookingType === 'destination' && (
            <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Trip Type</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => {
                  handleTripTypeChange("oneway");
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur('pickup');
                  }
                }}
                variant="outline"
                className={`${
                  formData.tripType === "oneway"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {t("Step1.OneWay")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleTripTypeChange("roundtrip");
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur('pickup');
                  }
                }}
                variant="outline"
                className={`${
                  formData.tripType === "roundtrip"
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {t("Step1.RoundTrip")}
              </Button>
            </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <CalendarDays className="inline h-4 w-4 mr-1" />
                {t("Step1.Date")} *
              </label>
              <Input 
                type="date"
                min={today}
                className={`${errors.date ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
                value={formData.date}
                onChange={(e) => {
                  handleInputChange('date', e.target.value);
                }}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                {t("Step1.Time")} *
              </label>
              <Input 
                type="time"
                className={`${errors.time ? 'border-red-500' : 'border-gray-300'} focus:border-primary-500 focus:ring-primary-500`}
                value={formData.time}
                onChange={(e) => {
                  handleInputChange('time', e.target.value);
                }}
              />
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <Users className="inline h-4 w-4 mr-1" />
              {t("Step1.Passengers")}
            </label>
            <Input 
              type="number"
              min="1"
              max="15"
              placeholder="1"
              className="border-gray-300 focus:border-primary-500 focus:ring-primary-500" 
              value={passengerInputValue}
              onChange={handlePassengerChange}
              onBlur={handlePassengerBlur}
            />
          </div>

          {/* Next Button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base rounded-lg"
            onClick={handleNext}
            disabled={isLoading || calculatingDistance}
          >
            {isLoading || calculatingDistance ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("Step1.Processing")}
              </>
            ) : (
              <>
                {t("Step1.ContinueToVehicleSelection")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Payment Icons */}
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            <Image src="/visa.webp" alt="Visa" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/mastercard.webp" alt="MasterCard" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/paypal.webp" alt="PayPal" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/twint.webp" alt="Twint" width={35} height={25} className="h-6 w-auto opacity-70" />
            <Image src="/applepay.webp" alt="Apple Pay" width={35} height={25} className="h-6 w-auto opacity-70" />
          </div>

          {/* Support Info */}
          <div className="text-center text-xs text-gray-500 space-y-1 pt-2">
            <p>{t("Footer.Support2")}</p>
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>{process.env.NEXT_PUBLIC_PHONE_NUMBER}</span>
              <span>•</span>
              <span>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}