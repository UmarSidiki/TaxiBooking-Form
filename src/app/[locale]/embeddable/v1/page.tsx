"use client";
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
import { useBookingForm } from "@/lib/useEMBDBookingForm";
import { useTranslations } from "next-intl";

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

export default function BookingFormUI() {
  const t = useTranslations();
  const {
    isMounted,
    focusedField,
    formData,
    errors,
    isSubmitting,
    isHourly,
    progressSteps,
    minDate,
    pickupInputRef,
    dropoffInputRef,
    setFocusedField,
    handleSubmit,
    updateFormData,
    setBookingType,
    setTripType,
    setDuration,
    setPassengers,
  } = useBookingForm();

  return (
    <div
      className={`w-full max-w-md mx-auto bg-transparent font-sans transition-all duration-700 ease-out ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {/* Compact Progress Bar */}
      <div className="flex justify-between items-center px-3 py-2 md:px-4 md:py-2">
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
                  index === 0 ? "text-primary" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Compact Form Card */}
      <Card className="rounded-xl bg-white shadow-lg p-3 md:p-4 border-0">
        <header className="mb-3 pb-1 text-center">
          <h1 className="text-base md:text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Car className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            {t("embeddable.trip-booking")}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t("embeddable.book-your-ride-in-seconds")}
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Compact Booking Type Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs md:text-sm font-medium mb-3">
            {(["destination", "hourly"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBookingType(type)}
                className={`flex-1 rounded-md px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  formData.bookingType === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {type === "destination" ? (
                  <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                ) : (
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
                {type === "destination" ? t("embeddable.destination") : t("embeddable.hourly")}
              </button>
            ))}
          </div>

          {/* Compact Form Inputs */}
          <div className="space-y-3">
            {/* Pickup Location */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <Input
                ref={pickupInputRef}
                placeholder={t("embeddable.pickup-location")}
                value={formData.pickup}
                onChange={(e) => updateFormData({ pickup: e.target.value })}
                onFocus={() => setFocusedField("pickup")}
                onBlur={() => setFocusedField(null)}
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

            {/* Dropoff Location */}
            {!isHourly && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </div>
                <Input
                  ref={dropoffInputRef}
                  placeholder={t("embeddable.destination")}
                  value={formData.dropoff}
                  onChange={(e) => updateFormData({ dropoff: e.target.value })}
                  onFocus={() => setFocusedField("dropoff")}
                  onBlur={() => setFocusedField(null)}
                  className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                    errors.dropoff
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : focusedField === "dropoff"
                      ? "border-primary focus:border-primary focus:ring-primary/20"
                      : "border-slate-200 focus:border-primary focus:ring-primary/20"
                  }`}
                />
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
              <div className="flex rounded-lg border bg-slate-50 p-1 text-xs md:text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setTripType("oneway")}
                  className={`flex-1 rounded-md px-2 py-1.5 md:px-3 md:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    formData.tripType === "oneway"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" /> {t("embeddable.one-way")}
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
                  <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" /> {t("embeddable.round-trip")}
                </button>
              </div>
            )}

            {/* Compact Date and Time */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </div>
                <Input
                  type="date"
                  value={formData.date}
                  min={minDate}
                  onChange={(e) => updateFormData({ date: e.target.value })}
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
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </div>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateFormData({ time: e.target.value })}
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
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
              <Input
                type="number"
                placeholder={t("embeddable.passengers")}
                min={1}
                max={8}
                value={formData.passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Compact Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-lg bg-primary py-2 md:py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-3.5 w-3.5 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("embeddable.redirecting")}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {t("embeddable.search")}
                <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </div>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}