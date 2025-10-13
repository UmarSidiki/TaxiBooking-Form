"use client";

import { useState, useEffect, useRef } from "react";
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
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useTranslations } from "next-intl";

const initialFormData: FormData = {
  bookingType: "destination",
  pickup: "",
  dropoff: "",
  tripType: "oneway",
  duration: 2,
  date: "",
  time: "",
  passengers: 1,
  selectedVehicle: "",
  childSeats: 0,
  babySeats: 0,
  notes: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

export default function EmbeddableWidget() {
  const [isMounted, setIsMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const t = useTranslations();

  const progressSteps = [
    { label: t("embeddable.trip"), icon: MapPin },
    { label: t('embeddable.vehicle'), icon: Car },
    { label: t('embeddable.payment'), icon: CheckCircle },
  ];

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  //   make body tag bg transparent forcefully
  useEffect(() => {
    const body = document.body;
    body.style.backgroundColor = "transparent";
    return () => {
      body.style.backgroundColor = "";
    };
  }, []);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);

  const isHourly = formData.bookingType === "hourly";

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    const initAutocomplete = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      try {
        setOptions({ key: apiKey, v: "weekly" });
        const places = await importLibrary("places");
        const options = {
          componentRestrictions: { country: ["ch", "fr", "de", "it"] },
        };

        if (pickupInputRef.current) {
          const autocompletePickup = new places.Autocomplete(
            pickupInputRef.current,
            options
          );
          autocompletePickup.addListener("place_changed", () => {
            const place = autocompletePickup.getPlace();
            const newPickup = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, pickup: newPickup }));
            setErrors((prev) => ({ ...prev, pickup: undefined }));
          });
        }
        if (dropoffInputRef.current) {
          const autocompleteDropoff = new places.Autocomplete(
            dropoffInputRef.current,
            options
          );
          autocompleteDropoff.addListener("place_changed", () => {
            const place = autocompleteDropoff.getPlace();
            const newDropoff = place.formatted_address || place.name || "";
            setFormData((prev) => ({ ...prev, dropoff: newDropoff }));
            setErrors((prev) => ({ ...prev, dropoff: undefined }));
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };
    initAutocomplete();
  }, []);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!formData.pickup.trim())
      nextErrors.pickup = t('embeddable.pickup-location-is-required');
    if (!isHourly && !formData.dropoff.trim())
      nextErrors.dropoff = t('embeddable.destination-is-required');
    if (!formData.date) nextErrors.date = t('embeddable.date-is-required');
    if (!formData.time) nextErrors.time = t('embeddable.time-is-required');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createTargetUrl = () => {
    const params = new URLSearchParams({
      step: "2",
      bookingType: formData.bookingType,
      pickup: formData.pickup.trim(),
      date: formData.date,
      time: formData.time,
      passengers: String(formData.passengers),
      source: "embed_v1",
    });

    // Add dropoff and tripType only for destination bookings
    if (!isHourly) {
      params.set("dropoff", formData.dropoff.trim());
      params.set(
        "tripType",
        formData.tripType === "roundtrip" ? "return" : "oneway"
      );
    }

    // Add duration only for hourly bookings
    if (isHourly) {
      params.set("duration", String(formData.duration));
    }

    // Return the URL with parameters
    return `?${params.toString()}`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const targetUrl = createTargetUrl();
    const fullUrl = `${window.location.origin}${targetUrl}`;

    // Check if we're in an iframe and redirect parent window
    try {
      if (window.top && window.top !== window.self) {
        // We're in an iframe, try to redirect the parent window
        window.top.location.href = fullUrl;
      } else {
        // We're not in an iframe, redirect normally
        window.location.href = fullUrl;
      }
    } catch {
      // Fallback for cross-origin or security errors: open in new tab
      window.open(fullUrl, "_blank");
    }
  };

  return (
    <div
      className={`w-full max-w-[400px] mx-auto bg-transparent font-sans transition-all duration-700 ease-out ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {/* Progress Bar with reduced padding */}
      <div className="flex justify-between items-center px-2 py-2">
        {progressSteps.map(({ icon: Icon, label }, index) => (
          <div key={index} className="flex flex-1 flex-col items-center relative">
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
            <span className={`mt-1 text-xs font-medium ${
              index === 0 ? "text-primary" : "text-slate-400"
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Form Card with reduced padding */}
      <Card className="rounded-2xl bg-white shadow-xl p-4 border-0">
        <header className="mb-1 pb-1 text-center">
          <h1 className="text-base font-bold text-slate-800 flex items-center justify-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Car className="h-4 w-4 text-primary" />
            </div>
            {t('embeddable.trip-booking')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('embeddable.book-your-ride-in-seconds')}
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Booking Type Toggle with reduced padding */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm font-medium">
            {(["destination", "hourly"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    bookingType: type,
                    dropoff: type === "hourly" ? "" : prev.dropoff,
                  }))
                }
                className={`flex-1 rounded-lg px-2 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  formData.bookingType === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {type === "destination" ? (
                  <MapPin className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                {type === "destination" ? t('embeddable.destination') : t('embeddable.hourly')}
              </button>
            ))}
          </div>

          {/* Form Inputs with reduced spacing */}
          <div className="space-y-3">
            {/* Pickup Location with icon */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <Input
                ref={pickupInputRef}
                placeholder={t('embeddable.pickup-location')}
                value={formData.pickup}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pickup: e.target.value }))
                }
                onFocus={() => setFocusedField('pickup')}
                onBlur={() => setFocusedField(null)}
                className={`rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm transition-all duration-200 ${
                  errors.pickup 
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100" 
                    : focusedField === 'pickup'
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

            {/* Dropoff Location with icon */}
            {!isHourly && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <Input
                  ref={dropoffInputRef}
                  placeholder={t('embeddable.destination')}
                  value={formData.dropoff}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dropoff: e.target.value }))
                  }
                  onFocus={() => setFocusedField('dropoff')}
                  onBlur={() => setFocusedField(null)}
                  className={`rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm transition-all duration-200 ${
                    errors.dropoff 
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100" 
                      : focusedField === 'dropoff'
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

            {/* Duration with icon */}
            {isHourly && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Clock className="h-4 w-4" />
                </div>
                <Input
                  type="number"
                  placeholder={t('embeddable.duration-hours')}
                  min={1}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            )}

            {/* One-way / Round-trip Toggle with reduced padding */}
            {!isHourly && (
              <div className="flex rounded-xl border bg-slate-50 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tripType: "oneway" }))
                  }
                  className={`flex-1 rounded-lg px-2 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    formData.tripType === "oneway"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <ArrowRight className="h-3.5 w-3.5" /> {t('embeddable.one-way')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tripType: "roundtrip" }))
                  }
                  className={`flex-1 rounded-lg px-2 py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    formData.tripType === "roundtrip"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> {t('embeddable.round-trip')}
                </button>
              </div>
            )}

            {/* Date and Time with icons and reduced spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className={`rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm transition-all duration-200 ${
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
                  <Clock className="h-4 w-4" />
                </div>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, time: e.target.value }))
                  }
                  className={`rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm transition-all duration-200 ${
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

            {/* Passengers with icon */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Users className="h-4 w-4" />
              </div>
              <Input
                type="number"
                placeholder={t('embeddable.passengers')}
                min={1}
                max={8}
                value={formData.passengers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    passengers: Math.min(
                      8,
                      Math.max(1, Number(e.target.value) || 1)
                    ),
                  }))
                }
                className="rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit Button with reduced padding */}
          <Button
            type="submit"
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('embeddable.redirecting')}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {t('embeddable.search')}
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>

        {/* Footer with reduced margin */}
        {/* <footer className="mt-3 text-center text-xs leading-relaxed text-slate-400">
          {t('embeddable.by-submitting-my-data-i-agree-to-be-contacted')}
        </footer> */}
      </Card>
    </div>
  );
}