"use client";
import { useState, useEffect } from "react";
import "@/style/EmbeddableLayout.css";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStep1 } from "@/hooks/form/form-steps/useStep1";
import { useTranslations } from "next-intl";
import {
  BookingFormProvider,
  useBookingForm,
} from "@/contexts/BookingFormContext";
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
  const { setFormData } = useBookingForm();
  const {
    mapLoaded,
    mapRef,
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
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

  // Handle adding a stop
  const handleAddStop = () => {
    const newStop = {
      location: "",
      order: formData.stops.length + 1,
    };
    setFormData((prev) => ({ ...prev, stops: [...prev.stops, newStop] }));
  };

  // Handle removing a stop
  const handleRemoveStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops
        .filter((_, i) => i !== index)
        .map((stop, i) => ({
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
    <>
      <div
        className={`font-sans transition-all duration-700 ease-out ${
          isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {/* Map container - only show if map is loaded */}
        {mapLoaded && (
          <div className="mb-3 rounded-lg overflow-hidden h-32 md:h-48">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        )}

        {/* Compact Progress Bar */}
        <div className="flex justify-between items-center px-3 py-2">
          {progressSteps.map(({ icon: iconName, label }, index) => {
            const Icon = iconMap[iconName as keyof typeof iconMap];
            return (
              <div
                key={index}
                className="flex flex-1 flex-col items-center relative"
              >
                {index < progressSteps.length - 1 && (
                  <div className="absolute top-3 left-1/2 w-full h-0.5 bg-slate-200 -z-10 md:top-4" />
                )}
                <div
                  className={`flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    index === 0
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${
                    index === 0 ? "text-primary font-bold" : "text-neutral-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Compact Form Card */}
        <Card className="rounded-xl bg-white/90 backdrop-blur-md p-3 border-0 h-full flex flex-col shimmer-container">
          <header className="mb-1 text-center">
            <h1 className="text-base md:text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
              {t("embeddable.trip-booking")}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              {t("embeddable.book-your-ride-in-seconds")}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1">
              {/* Compact Booking Type Toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs md:text-sm font-medium mb-3">
                {(["destination", "hourly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBookingType(type)}
                    className={`flex-1 rounded-md px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      formData.bookingType === type
                        ? "bg-gradient-to-r from-primary/80 to-primary text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {type === "destination" ? (
                      <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                    {type === "destination"
                      ? t("embeddable.destination")
                      : t("embeddable.hourly")}
                  </button>
                ))}
              </div>

              {/* Compact Form Inputs */}
              <div className="space-y-3">
                {/* Pickup Location */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
                    className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                      errors.pickup
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : focusedField === "pickup"
                        ? "border-primary focus:border-primary focus:ring-primary/20"
                        : "border-slate-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.pickup && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.pickup}
                    </div>
                  )}
                </div>

                {/* Stops - Only for destination-based bookings */}
                {!isHourly && (
                  <div className="space-y-2">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </div>
                          <Input
                            ref={(el) => {
                              if (stopInputRefs.current) {
                                stopInputRefs.current[index] = el;
                              }
                            }}
                            placeholder={`Stop ${index + 1} location`}
                            value={stop.location}
                            onChange={(e) =>
                              handleStopChange(index, e.target.value)
                            }
                            className="rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(index)}
                          className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropoff Location */}
                {!isHourly && (
                  <div>
                    <div className="flex justify-end mb-1.5 w-full">
                      <button
                        type="button"
                        onClick={handleAddStop}
                        className="text-xs text-primary hover:text-primary/80 underline"
                      >
                        Add a stop
                      </button>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
                        className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                          errors.dropoff
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : focusedField === "dropoff"
                            ? "border-primary focus:border-primary focus:ring-primary/20"
                            : "border-slate-200 focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                    </div>
                    {errors.dropoff && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.dropoff}
                      </div>
                    )}
                  </div>
                )}

                {/* Duration */}
                {isHourly && (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="number"
                      placeholder={t("embeddable.duration-hours")}
                      min={1}
                      value={formData.duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                )}

                {/* Compact One-way / Round-trip Toggle */}
                {!isHourly && (
                  <div className="flex rounded-lg border bg-slate-200 p-1 text-xs md:text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setTripType("oneway")}
                      className={`flex-1 rounded-md px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        formData.tripType === "oneway"
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />{" "}
                      {t("embeddable.one-way")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType("roundtrip")}
                      className={`flex-1 rounded-md px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        formData.tripType === "roundtrip"
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />{" "}
                      {t("embeddable.round-trip")}
                    </button>
                  </div>
                )}

                {/* Compact Date and Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="date"
                      value={formData.date}
                      min={minDate}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                        errors.date
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.date}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                        errors.time
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.time && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Passengers */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                  <Input
                    type="number"
                    placeholder={t("embeddable.passengers")}
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
                    className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200 ${
                      errors.passengers
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.passengers && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.passengers}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {/* Animated Submit Button */}
              <Button
                type="submit"
                className="w-full rounded-lg bg-primary py-2 md:py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                disabled={isLoading || calculatingDistance}
              >
                {isLoading || calculatingDistance ? (
                  <div className="taxi-animation-container w-full">
                    {/* Road/Path */}
                    <div className="taxi-road"></div>

                    {/* Taxi Icon */}
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-5 w-5 md:h-6 md:w-6 taxi-icon text-white" />
                    </div>

                    {/* Loading dots below taxi */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                      <span className="w-1 h-1 bg-white rounded-full loading-dot"></span>
                      <span className="w-1 h-1 bg-white rounded-full loading-dot"></span>
                      <span className="w-1 h-1 bg-white rounded-full loading-dot"></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {t("embeddable.search")}
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                )}
              </Button>
              <div>
                <p className="text-xs text-center text-slate-500 mt-3">
                  By submitting my data, I agree to be contacted.
                </p>
              </div>
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
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

export default function EmbeddableBookingPage() {
  return (
    <BookingFormProvider>
      <BookingFormUI />
    </BookingFormProvider>
  );
}
