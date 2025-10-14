"use client";
import { useState, useEffect } from "react";
import {
  Car,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useTranslations } from "next-intl";
import { BookingFormProvider } from "@/contexts/BookingFormContext";
import Image from "next/image";

const iconMap = {
  MapPin,
  Car,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Users,
  Calendar,
  AlertCircle,
};

function BookingFormUI() {
  const t = useTranslations();
  const {
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,
    formData,
    errors,
    calculatingDistance,
    isLoading,
    redirectToStep2,
    handleBookingTypeChange,
    handleTripTypeChange,
    handleInputChange,
    handleInputBlur,
  } = useStep1();

  // Define progress steps
  const progressSteps = [
    { icon: "MapPin", label: t("embeddable.trip") },
    { icon: "Car", label: t("embeddable.vehicle") },
    { icon: "CheckCircle", label: t("embeddable.payment") },
  ];

  // Get today's date in YYYY-MM-DD format for minDate
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  // Check if booking type is hourly
  const isHourly = formData.bookingType === "hourly";

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the form data if needed
    if (formData.passengers < 1) {
      handleInputChange("passengers", 1);
    }
    
    // Use redirectToStep2 instead of handleNext
    redirectToStep2();
  };

  // Helper functions for updating specific form fields
  const setBookingType = (type: "destination" | "hourly") => {
    handleBookingTypeChange(type);
  };

  const setTripType = (type: "oneway" | "roundtrip") => {
    handleTripTypeChange(type);
  };

  const setDuration = (duration: number) => {
    handleInputChange("duration", duration);
  };

  const setPassengers = (passengers: number) => {
    // Allow empty value or 0 for input, but don't update state with 0
    if (passengers === 0 || isNaN(passengers)) {
      // Don't update state, allowing the input to be cleared
      return;
    }
    handleInputChange("passengers", passengers);
  };

  // For the focused field state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // For the isMounted state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={`w-full max-w-md mx-auto bg-transparent font-sans transition-all duration-700 ease-out ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {/* Map container - only show if map is loaded */}
      {mapLoaded && (
        <div className="mb-4 rounded-xl overflow-hidden h-56 shadow-lg">
          <div ref={mapRef} className="w-full h-full" />
        </div>
      )}

      {/* Compact Progress Bar */}
      <div className="flex justify-between items-center px-4 py-3 mb-4">
        {progressSteps.map(({ icon: iconName, label }, index) => {
          const Icon = iconMap[iconName as keyof typeof iconMap];
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center relative"
            >
              {index < progressSteps.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 bg-slate-200 -z-10" />
              )}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  index === 0
                    ? "border-primary bg-primary text-white shadow-md"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  index === 0 ? "text-primary" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Professional Form Card */}
      <Card className="rounded-2xl bg-white shadow-xl p-5 md:p-6 border-0">
        <header className="mb-5 pb-2 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
            {t("embeddable.trip-booking")}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t("embeddable.book-your-ride-in-seconds")}
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Professional Booking Type Toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium mb-5 shadow-sm">
            {(["destination", "hourly"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBookingType(type)}
                className={`flex-1 rounded-lg px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                  formData.bookingType === type
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {type === "destination" ? (
                  <MapPin className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                {type === "destination"
                  ? t("embeddable.destination")
                  : t("embeddable.hourly")}
              </button>
            ))}
          </div>

          {/* Professional Form Inputs */}
          <div className="space-y-4">
            {/* Pickup Location */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin className="h-5 w-5" />
              </div>
              <Input
                ref={pickupInputRef}
                placeholder={t("embeddable.pickup-location")}
                value={formData.pickup}
                onChange={(e) => {
                  handleInputChange("pickup", e.target.value);
                }}
                onBlur={() => handleInputBlur("pickup")}
                onFocus={() => setFocusedField("pickup")}
                className={`rounded-xl border bg-white pl-12 pr-4 py-4 text-base transition-all duration-200 shadow-sm ${
                  errors.pickup
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : focusedField === "pickup"
                    ? "border-primary focus:border-primary focus:ring-primary/20 shadow-md"
                    : "border-slate-200 focus:border-primary focus:ring-primary/20"
                }`}
              />
              {errors.pickup && (
                <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.pickup}
                </div>
              )}
            </div>

            {/* Dropoff Location */}
            {!isHourly && (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <Input
                  ref={dropoffInputRef}
                  placeholder={t("embeddable.destination")}
                  value={formData.dropoff}
                  onChange={(e) => {
                    handleInputChange("dropoff", e.target.value);
                  }}
                  onBlur={() => handleInputBlur("dropoff")}
                  onFocus={() => setFocusedField("dropoff")}
                  className={`rounded-xl border bg-white pl-12 pr-4 py-4 text-base transition-all duration-200 shadow-sm ${
                    errors.dropoff
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : focusedField === "dropoff"
                      ? "border-primary focus:border-primary focus:ring-primary/20 shadow-md"
                      : "border-slate-200 focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {errors.dropoff && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {errors.dropoff}
                  </div>
                )}
              </div>
            )}

            {/* Duration */}
            {isHourly && (
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <Input
                  type="number"
                  placeholder={t("embeddable.duration-hours")}
                  min={1}
                  value={formData.duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="rounded-xl border bg-white pl-12 pr-4 py-4 text-base border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200 shadow-sm"
                />
              </div>
            )}

            {/* Professional One-way / Round-trip Toggle */}
            {!isHourly && (
              <div className="flex rounded-xl border bg-slate-100 p-1 text-sm font-medium shadow-sm">
                <button
                  type="button"
                  onClick={() => setTripType("oneway")}
                  className={`flex-1 rounded-lg px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                    formData.tripType === "oneway"
                      ? "bg-white shadow-md text-slate-800"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <ArrowRight className="h-5 w-5" />{" "}
                  {t("embeddable.one-way")}
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("roundtrip")}
                  className={`flex-1 rounded-lg px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                    formData.tripType === "roundtrip"
                      ? "bg-white shadow-md text-slate-800"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <RefreshCw className="h-5 w-5" />{" "}
                  {t("embeddable.round-trip")}
                </button>
              </div>
            )}

            {/* Professional Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <Input
                  type="date"
                  value={formData.date}
                  min={minDate}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={`rounded-xl border bg-white pl-12 pr-4 py-4 text-base transition-all duration-200 shadow-sm ${
                    errors.date
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {errors.date && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {errors.date}
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Clock className="h-5 w-5" />
                </div>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  className={`rounded-xl border bg-white pl-12 pr-4 py-4 text-base transition-all duration-200 shadow-sm ${
                    errors.time
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {errors.time && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {errors.time}
                  </div>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Users className="h-5 w-5" />
              </div>
              <Input
                type="number"
                placeholder={t("embeddable.passengers")}
                // Removed min={1} to allow clearing the field
                value={formData.passengers}
                max="15"
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for clearing
                  if (value === "") {
                    handleInputChange("passengers", "");
                    return;
                  }
                  // Convert to number and validate
                  const numValue = Number(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setPassengers(numValue);
                  }
                }}
                onBlur={() => {
                  // On blur, ensure we have at least 1 passenger
                  if (Number(formData.passengers) < 1) {
                    handleInputChange("passengers", 1);
                  }
                  handleInputBlur("passengers");
                }}
                className={`rounded-xl border bg-white pl-12 pr-4 py-4 text-base border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200 shadow-sm ${
                  errors.passengers
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-primary focus:ring-primary/20"
                }`}
              />
              {errors.passengers && (
                <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errors.passengers}
                </div>
              )}
            </div>
          </div>

          {/* Professional Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-xl bg-primary py-4 text-base font-semibold tracking-wide text-white hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            disabled={isLoading || calculatingDistance}
          >
            {isLoading || calculatingDistance ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("embeddable.redirecting")}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {t("embeddable.search")}
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </Button>
          <div>
            <p className="text-sm text-center text-slate-500 mt-4">
              By submitting my data, I agree to be contacted.
            </p>
          </div>
          <div className="flex justify-center gap-3 flex-wrap pt-4">
            <Image src="/visa.webp" alt="Visa" width={40} height={25} className="h-7 w-auto opacity-70" />
            <Image src="/mastercard.webp" alt="MasterCard" width={40} height={25} className="h-7 w-auto opacity-70" />
            <Image src="/paypal.webp" alt="PayPal" width={40} height={25} className="h-7 w-auto opacity-70" />
            <Image src="/twint.webp" alt="Twint" width={40} height={25} className="h-7 w-auto opacity-70" />
            <Image src="/applepay.webp" alt="Apple Pay" width={40} height={25} className="h-7 w-auto opacity-70" />
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <BookingFormUI />
    </BookingFormProvider>
  );
}