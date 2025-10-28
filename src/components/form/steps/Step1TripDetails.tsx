"use client";

import React from "react";
import {
  MapPin,
  Flag,
  CalendarDays,
  Clock,
  Users,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useTranslations } from "next-intl";

export default function Step1TripDetails() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const {
    // State
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,

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

  // Handle passenger input change - simplified logic
  const handlePassengerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only update form data if it's a valid number
    const numValue = parseInt(value, 10);
    if (value === "" || (!isNaN(numValue) && numValue >= 1 && numValue <= 8)) {
      const finalValue = value === "" ? 1 : numValue;
      handleInputChange("passengers", finalValue);
    }
  };

  // Handle passenger input blur - simplified logic
  const handlePassengerBlur = () => {
    if (formData.passengers < 1) {
      handleInputChange("passengers", 1);
    } else {
      // Ensure the value is within bounds
      const numValue = Math.min(8, Math.max(1, formData.passengers));
      handleInputChange("passengers", numValue);
    }
  };

  // Handle adding a stop
  const handleAddStop = () => {
    const newStop = {
      location: "",
      order: formData.stops.length + 1,
    };
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, newStop],
    }));
  };

  // Handle removing a stop
  const handleRemoveStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((stop, i) => ({
        ...stop,
        order: i + 1,
      })),
    }));
  };

  // Handle stop location change
  const handleStopChange = (index: number, location: string) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, i) =>
        i === index ? { ...stop, location } : stop
      ),
    }));
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
                      <p className="text-xs text-gray-500">
                        {t("Step1.Distance")}
                      </p>
                      <p className="font-semibold">
                        {distanceData.distance.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("Step1.Duration")}
                      </p>
                      <p className="font-semibold">
                        {distanceData.duration.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Date")}</p>
                      <p className="font-semibold">
                        {formData.date || t("not-set")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("Step1.Passengers")}
                      </p>
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
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              {t("Step1.BookingType")}
            </label>
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
                <MapPin className="h-4 w-4" />
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
                <Clock className="h-4 w-4" />
                {t("Step1.TimeBased")}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.bookingType === "destination"
                ? t("Step1.price-based-on-distance-traveled")
                : t("Step1.price-based-on-hourly-rate")}
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
              className={`${
                errors.pickup ? "border-red-500" : "border-gray-300"
              } focus:border-primary-500 focus:ring-primary-500`}
              value={formData.pickup}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, pickup: e.target.value }));
              }}
              onBlur={() => {
                if (formData.pickup && formData.dropoff) {
                  handleInputBlur("pickup");
                }
              }}
            />
            {errors.pickup && (
              <p className="text-red-500 text-xs mt-1">{errors.pickup}</p>
            )}
          </div>

          {/* Stops - Only for destination-based bookings */}
          {formData.bookingType === "destination" && (
            <div className="space-y-2">
              {formData.stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input
                      ref={(el) => {
                        stopInputRefs.current[index] = el;
                      }}
                      placeholder={`Stop ${index + 1} location`}
                      value={stop.location}
                      onChange={(e) => handleStopChange(index, e.target.value)}
                      className="pl-10 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveStop(index)}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Dropoff Location - Only for destination-based bookings */}
          {formData.bookingType === "destination" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  <Flag className="inline h-4 w-4 mr-1 text-primary" />
                  {t("Step1.DropoffLocation")} *
                </label>
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Add a stop
                </button>
              </div>
              <Input
                ref={dropoffInputRef}
                placeholder={t("Step1.DropoffPlaceholder")}
                className={`${
                  errors.dropoff ? "border-red-500" : "border-gray-300"
                } focus:border-primary-500 focus:ring-primary-500`}
                value={formData.dropoff}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dropoff: e.target.value }));
                }}
                onBlur={() => {
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur("dropoff");
                  }
                }}
              />
              {errors.dropoff && (
                <p className="text-red-500 text-xs mt-1">{errors.dropoff}</p>
              )}
              {calculatingDistance && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  {t("Step1.CalculatingDistance")}
                </p>
              )}
            </div>
          )}


          {/* Duration - Only for hourly bookings */}
          {formData.bookingType === "hourly" && (
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
                  handleInputChange("duration", parseInt(e.target.value) || 1);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Step1.DurationDescription")}
              </p>
            </div>
          )}

          {/* Trip Type - Only for destination-based bookings */}
          {formData.bookingType === "destination" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Trip Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    handleTripTypeChange("oneway");
                    if (formData.pickup && formData.dropoff) {
                      handleInputBlur("pickup");
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
                      handleInputBlur("pickup");
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
                {formData.tripType === "roundtrip" ? t("Step1.DepartureDate") : t("Step1.Date")} *
              </label>
              <Input
                type="date"
                min={today}
                className={`${
                  errors.date ? "border-red-500" : "border-gray-300"
                } focus:border-primary-500 focus:ring-primary-500`}
                value={formData.date}
                onChange={(e) => {
                  handleInputChange("date", e.target.value);
                }}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                {formData.tripType === "roundtrip" ? t("Step1.DepartureTime") : t("Step1.Time")} *
              </label>
              <Input
                type="time"
                className={`${
                  errors.time ? "border-red-500" : "border-gray-300"
                } focus:border-primary-500 focus:ring-primary-500`}
                value={formData.time}
                onChange={(e) => {
                  handleInputChange("time", e.target.value);
                }}
              />
              {errors.time && (
                <p className="text-red-500 text-xs mt-1">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Return Date & Time - Only for roundtrip */}
          {formData.tripType === "roundtrip" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  <CalendarDays className="inline h-4 w-4 mr-1" />
                  {t("Step1.ReturnDate")} *
                </label>
                <Input
                  type="date"
                  min={formData.date || today}
                  className={`${
                    errors.returnDate ? "border-red-500" : "border-gray-300"
                  } focus:border-primary-500 focus:ring-primary-500`}
                  value={formData.returnDate}
                  onChange={(e) => {
                    handleInputChange("returnDate", e.target.value);
                  }}
                />
                {errors.returnDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.returnDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t("Step1.ReturnTime")} *
                </label>
                <Input
                  type="time"
                  className={`${
                    errors.returnTime ? "border-red-500" : "border-gray-300"
                  } focus:border-primary-500 focus:ring-primary-500`}
                  value={formData.returnTime}
                  onChange={(e) => {
                    handleInputChange("returnTime", e.target.value);
                  }}
                />
                {errors.returnTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.returnTime}</p>
                )}
              </div>
            </div>
          )}

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
              value={formData.passengers}
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
            <Image
              src="/visa.webp"
              alt="Visa"
              width={35}
              height={25}
              className="h-6 w-auto opacity-70"
            />
            <Image
              src="/mastercard.webp"
              alt="MasterCard"
              width={35}
              height={25}
              className="h-6 w-auto opacity-70"
            />
            <Image
              src="/paypal.webp"
              alt="PayPal"
              width={35}
              height={25}
              className="h-6 w-auto opacity-70"
            />
            <Image
              src="/twint.webp"
              alt="Twint"
              width={35}
              height={25}
              className="h-6 w-auto opacity-70"
            />
            <Image
              src="/applepay.webp"
              alt="Apple Pay"
              width={35}
              height={25}
              className="h-6 w-auto opacity-70"
            />
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