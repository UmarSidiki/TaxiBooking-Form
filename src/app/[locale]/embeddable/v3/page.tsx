"use client";
import { useState, useEffect } from "react";
import "@/style/EmbeddableLayout.css";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  X,
  Plus,
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

function BookingFormUI() {
  const t = useTranslations();
  const { setFormData } = useBookingForm();
  const {
    pickupInputRef,
    dropoffInputRef,
    stopInputRefs,
    formData,
    errors,
    calculatingDistance,
    isLoading,
    redirectToStep2,
    handleBookingTypeChange,
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
    redirectToStep2();
  };

  // Helper functions for updating specific form fields
  const setBookingType = (type: "destination" | "hourly") => {
    handleBookingTypeChange(type);
  };

  const setPassengers = (passengers: number) => {
    if (passengers === 0 || isNaN(passengers)) {
      return;
    }
    handleInputChange("passengers", passengers);
  };

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
    <div
      className={`font-sans transition-all duration-700 ease-out w-full h-full overflow-auto ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <Card className="rounded-xl bg-white p-3 sm:p-4 md:p-5 border-0 shadow-sm w-full h-full min-h-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-3 sm:space-y-4">
          {/* Booking Type Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => setBookingType("destination")}
              className={`flex-1 rounded-md px-2 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 ${
                !isHourly
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("embeddable.destination")}
            </button>
            <button
              type="button"
              onClick={() => setBookingType("hourly")}
              className={`flex-1 rounded-md px-2 sm:px-4 py-1.5 sm:py-2 transition-all duration-300 ${
                isHourly
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t("embeddable.hourly")}
            </button>
          </div>

          {/* Form Fields Container */}
          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3">
            {/* Pickup Location */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t("embeddable.pickup-location")} *
              </label>
              <div className="relative">
                <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <Input
                  ref={pickupInputRef}
                  placeholder={t("embeddable.pickup-location")}
                  value={formData.pickup}
                  onChange={(e) => {
                    handleInputChange("pickup", e.target.value);
                  }}
                  onBlur={() => handleInputBlur("pickup")}
                  className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                    errors.pickup
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-primary focus:ring-primary/20"
                  }`}
                />
              </div>
              {errors.pickup && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span className="truncate">{errors.pickup}</span>
                </div>
              )}
            </div>

            {/* Stops - Only for destination-based bookings */}
            {!isHourly && formData.stops.length > 0 && (
              <div className="space-y-2">
                {formData.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                        className="rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-gray-300 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(index)}
                      className="flex-shrink-0 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropoff Location - Only for destination-based bookings */}
            {!isHourly && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    {t("embeddable.destination")} *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">{t('embeddable.add-a-stop')}</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <Input
                    ref={dropoffInputRef}
                    placeholder={t("embeddable.destination")}
                    value={formData.dropoff}
                    onChange={(e) => {
                      handleInputChange("dropoff", e.target.value);
                    }}
                    onBlur={() => handleInputBlur("dropoff")}
                    className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                      errors.dropoff
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
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

            {/* Duration - Only for hourly bookings */}
            {isHourly && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t("embeddable.duration-hours")} *
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <Input
                    type="number"
                    placeholder={t("embeddable.duration-hours")}
                    min={1}
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", Number(e.target.value))
                    }
                    className="rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-gray-300 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t("Step1.Date")} *
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <Input
                    type="date"
                    value={formData.date}
                    min={minDate}
                    onChange={(e) =>
                      handleInputChange("date", e.target.value)
                    }
                    className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                      errors.date
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                </div>
                {errors.date && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span className="truncate">{errors.date}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t("Step1.Time")} *
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      handleInputChange("time", e.target.value)
                    }
                    className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                      errors.time
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                </div>
                {errors.time && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span className="truncate">{errors.time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t("embeddable.passengers")}
              </label>
              <div className="relative">
                <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <Input
                  type="number"
                  placeholder={t("embeddable.passengers")}
                  value={formData.passengers}
                  max="15"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleInputChange("passengers", "");
                      return;
                    }
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setPassengers(numValue);
                    }
                  }}
                  onBlur={() => {
                    if (Number(formData.passengers) < 1) {
                      handleInputChange("passengers", 1);
                    }
                    handleInputBlur("passengers");
                  }}
                  className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                    errors.passengers
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-primary focus:ring-primary/20"
                  }`}
                />
              </div>
              {errors.passengers && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span className="truncate">{errors.passengers}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-auto pt-2 sm:pt-3">
            <Button
              type="submit"
              className="w-full rounded-lg py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-primary via-primary/90 to-primary/70 hover:from-primary/95 hover:via-primary/85 hover:to-primary/65"
              disabled={isLoading || calculatingDistance}
            >
              {isLoading || calculatingDistance ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                t("embeddable.search")
              )}
            </Button>
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