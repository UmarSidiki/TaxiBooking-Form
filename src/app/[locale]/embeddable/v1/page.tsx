"use client";

import { useState, useEffect, useRef } from "react";
import {
  Car,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

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

const progressSteps = [
  { label: "Trip", icon: MapPin },
  { label: "Vehicle", icon: Car },
  { label: "Payment", icon: CheckCircle },
];

export default function EmbeddableWidget() {
  const [isMounted, setIsMounted] = useState(false);

  // Animation effect
  useEffect(() => {
    // Set mounted to true after a short delay to trigger the animation
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer); // Cleanup timer on unmount
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
      nextErrors.pickup = "Pickup location is required";
    if (!isHourly && !formData.dropoff.trim())
      nextErrors.dropoff = "Destination is required";
    if (!formData.date) nextErrors.date = "Date is required";
    if (!formData.time) nextErrors.time = "Time is required";
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

    // Return absolute path without origin for same-site navigation
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
      {/* Progress Bar (on transparent background) */}
      <div className="flex justify-between gap-2 p-2">
        {progressSteps.map(({ icon: Icon }, index) => (
          <div key={index} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                index === 0
                  ? "border-primary bg-primary text-white"
                  : "border-slate-300 bg-white text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Form Card (with white background) */}
      <Card className="rounded-xl bg-white shadow-lg p-3">
        <header className="mb-3 text-center">
          <h1 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            <Car className="inline h-4 w-4 mr-1.5" />
            Trip Booking
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Booking Type Toggle */}
          <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
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
                className={`flex-1 rounded-full px-2 py-1.5 transition-all duration-300 ${
                  formData.bookingType === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  {type === "destination" ? (
                    <MapPin className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {type === "destination" ? "Destination" : "Hourly"}
                </span>
              </button>
            ))}
          </div>

          {/* Form Inputs */}
          <div className="space-y-2 pt-1">
            <Input
              ref={pickupInputRef}
              placeholder="Pickup Location"
              value={formData.pickup}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, pickup: e.target.value }))
              }
              className={`rounded-lg border bg-white px-3 py-2 text-sm ${
                errors.pickup ? "border-red-400" : "border-slate-200"
              }`}
            />
            {!isHourly && (
              <Input
                ref={dropoffInputRef}
                placeholder="Destination"
                value={formData.dropoff}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dropoff: e.target.value }))
                }
                className={`rounded-lg border bg-white px-3 py-2 text-sm ${
                  errors.dropoff ? "border-red-400" : "border-slate-200"
                }`}
              />
            )}
            {isHourly && (
              <Input
                type="number"
                placeholder="Duration (hours)"
                min={1}
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                className="rounded-lg border bg-white px-3 py-2 text-sm border-slate-200"
              />
            )}

            {/* One-way / Round-trip Toggle */}
            {!isHourly && (
              <div className="flex rounded-lg border bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tripType: "oneway" }))
                  }
                  className={`flex-1 rounded-md px-2 py-1.5 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    formData.tripType === "oneway"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  <ArrowRight className="h-3 w-3" /> One-way
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tripType: "roundtrip" }))
                  }
                  className={`flex-1 rounded-md px-2 py-1.5 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    formData.tripType === "roundtrip"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  <RefreshCw className="h-3 w-3" /> Round-trip
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className={`rounded-lg border bg-white px-3 py-2 text-sm ${
                  errors.date ? "border-red-400" : "border-slate-200"
                }`}
              />
              <Input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, time: e.target.value }))
                }
                className={`rounded-lg border bg-white px-3 py-2 text-sm ${
                  errors.time ? "border-red-400" : "border-slate-200"
                }`}
              />
            </div>

            <Input
              type="number"
              placeholder="Passengers"
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
              className="rounded-lg border bg-white px-3 py-2 text-sm border-slate-200"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Redirecting..." : "Search"}
          </Button>
        </form>

        <footer className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
          By submitting my data, I agree to be contacted.
        </footer>
      </Card>
    </div>
  );
}