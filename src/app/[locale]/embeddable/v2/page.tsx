"use client";
import { useState, useEffect } from "react";
import "@/style/EmbeddableLayout.css";
import {
  Car,
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
      duration: 0,
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

  // Handle stop duration change
  const handleStopDurationChange = (index: number, duration: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, i) =>
        i === index ? { ...stop, duration } : stop
      ),
    }));
  };

  return (
    <>
      <div
        className={`font-sans transition-all duration-75 ease-out w-full h-full overflow-auto ${
          isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        {/* Map container - only show if map is loaded */}
        {mapLoaded && (
          <div className="mb-3 rounded-lg overflow-hidden h-24 sm:h-32 md:h-48">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        )}
        {/* Compact Form Card */}
        <Card className="rounded-xl bg-white/90 backdrop-blur-md p-2 sm:p-3 md:p-4 border-0 h-full flex flex-col shimmer-container">
          <header className="mb-1 text-center">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
              {t("embeddable.trip-booking")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t("embeddable.book-your-ride-in-seconds")}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              {/* Compact Booking Type Toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs sm:text-sm font-medium mb-3">
                {(["destination", "hourly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBookingType(type)}
                    className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      formData.bookingType === type
                        ? "bg-gradient-to-r from-primary/80 to-primary text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {type === "destination" ? (
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    )}
                    <span className="hidden xs:inline">
                      {type === "destination"
                        ? t("embeddable.destination")
                        : t("embeddable.hourly")}
                    </span>
                    <span className="xs:hidden">
                      {type === "destination" ? t('Step1.DestinationBased') : t('Step1.TimeBased')}
                    </span>
                  </button>
                ))}
              </div>

              {/* Compact Form Inputs */}
              <div className="space-y-2 sm:space-y-3">
                {/* Pickup Location */}
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
                    className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
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
                      <span className="truncate">{errors.pickup}</span>
                    </div>
                  )}
                </div>

                {/* Stops - Only for destination-based bookings */}
                {!isHourly && (
                  <div className="space-y-2">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 flex gap-2">
                          <div className="relative flex-[3]">
                            <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                            </div>
                            <Input
                              ref={(el) => {
                                if (stopInputRefs.current) {
                                  stopInputRefs.current[index] = el;
                                }
                              }}
                              placeholder={t('embeddable.stop-index-1-location', { 0: index + 1 })}
                              value={stop.location}
                              onChange={(e) =>
                                handleStopChange(index, e.target.value)
                              }
                              className="rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                          </div>
                          <div className="relative flex-1 min-w-[80px] sm:min-w-[90px]">
                            <div className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </div>
                            <select
                              value={stop.duration || 0}
                              onChange={(e) => handleStopDurationChange(index, parseInt(e.target.value))}
                              className="w-full rounded-lg border bg-white pl-6 sm:pl-7 pr-6 sm:pr-7 py-2 sm:py-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 cursor-pointer appearance-none"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.25rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.15em 1.15em',
                              }}
                            >
                              <option value={0}>—</option>
                              <option value={10}>10m</option>
                              <option value={20}>20m</option>
                              <option value={30}>30m</option>
                              <option value={40}>40m</option>
                              <option value={50}>50m</option>
                              <option value={60}>1h</option>
                              <option value={70}>1h 10m</option>
                              <option value={80}>1h 20m</option>
                              <option value={90}>1h 30m</option>
                              <option value={100}>1h 40m</option>
                              <option value={110}>1h 50m</option>
                              <option value={120}>2h</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(index)}
                          className="flex-shrink-0 p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        >
                          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
                        {t('embeddable.add-a-stop')} </button>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
                        className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
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
                        <span className="truncate">{errors.dropoff}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Duration */}
                {isHourly && (
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="number"
                      placeholder={t("embeddable.duration-hours")}
                      min={1}
                      value={formData.duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                )}

                {/* Compact One-way / Round-trip Toggle */}
                {!isHourly && (
                  <div className="flex rounded-lg border bg-slate-200 p-1 text-xs sm:text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setTripType("oneway")}
                      className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        formData.tripType === "oneway"
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">{t("embeddable.one-way")}</span>
                      <span className="xs:hidden">One-way</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType("roundtrip")}
                      className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        formData.tripType === "roundtrip"
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">{t("embeddable.round-trip")}</span>
                      <span className="xs:hidden">{t('embeddable.round')}</span>
                    </button>
                  </div>
                )}

                {/* Compact Date and Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="date"
                      value={formData.date}
                      min={minDate}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                        errors.date
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate">{errors.date}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                        errors.time
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.time && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate">{errors.time}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passengers */}
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
                    className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200 ${
                      errors.passengers
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.passengers && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span className="truncate">{errors.passengers}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-2 sm:pt-3">
              {/* Animated Submit Button */}
              <Button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-primary via-primary/90 to-primary/70 hover:from-primary/95 hover:via-primary/85 hover:to-primary/65 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wide text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading || calculatingDistance}
              >
                {isLoading || calculatingDistance ? (
                  <div className="taxi-animation-container w-full">
                    {/* Road/Path */}
                    <div className="taxi-road"></div>

                    {/* Taxi Icon */}
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 taxi-icon text-white" />
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
                    <span className="hidden xs:inline">{t("embeddable.search")}</span>
                    <span className="xs:hidden">{t('embeddable.search')}</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </div>
                )}
              </Button>
              <div>
                <p className="text-xs text-center text-slate-500 mt-2 sm:mt-3">
                  {t('embeddable.by-submitting-my-data-i-agree-to-be-contacted')} </p>
              </div>
              <div className="flex justify-center gap-2 flex-wrap pt-2">
                <Image
                  src="/visa.webp"
                  alt="Visa"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/mastercard.webp"
                  alt="MasterCard"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/paypal.webp"
                  alt="PayPal"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/twint.webp"
                  alt="Twint"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/applepay.webp"
                  alt="Apple Pay"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
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