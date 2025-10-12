"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  Car,
  CheckCircle,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

interface EmbeddableWidgetProps {
  locale: string;
}

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
  { label: "Trajet", icon: MapPin },
  { label: "Véhicule", icon: Car },
  { label: "Payment", icon: CheckCircle },
];

export default function EmbeddableWidget({ locale }: EmbeddableWidgetProps) {
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
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });

        const places = await importLibrary("places");

        // Setup Autocomplete for pickup
        if (pickupInputRef.current) {
          const autocompletePickup = new places.Autocomplete(
            pickupInputRef.current,
            {
              componentRestrictions: { country: ["ch", "fr", "de", "it"] },
            }
          );
          autocompletePickup.addListener('place_changed', () => {
            const place = autocompletePickup.getPlace();
            const newPickup = place.formatted_address || place.name || '';
            setFormData(prev => ({ ...prev, pickup: newPickup }));
            if (errors.pickup) {
              setErrors(prev => ({ ...prev, pickup: undefined }));
            }
          });
        }

        // Setup Autocomplete for dropoff
        if (dropoffInputRef.current) {
          const autocompleteDropoff = new places.Autocomplete(
            dropoffInputRef.current,
            {
              componentRestrictions: { country: ["ch", "fr", "de", "it"] },
            }
          );
          autocompleteDropoff.addListener('place_changed', () => {
            const place = autocompleteDropoff.getPlace();
            const newDropoff = place.formatted_address || place.name || '';
            setFormData(prev => ({ ...prev, dropoff: newDropoff }));
            if (errors.dropoff) {
              setErrors(prev => ({ ...prev, dropoff: undefined }));
            }
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initAutocomplete();
  }, [errors.pickup, errors.dropoff]);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!formData.pickup.trim()) nextErrors.pickup = "Pickup is required";
    if (!isHourly && !formData.dropoff.trim())
      nextErrors.dropoff = "Dropoff is required";
    if (!formData.date) nextErrors.date = "Date is required";
    if (!formData.time) nextErrors.time = "Time is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createTargetUrl = () => {
    const params = new URLSearchParams();
    params.set("step", "2");
    params.set("bookingType", formData.bookingType);
    params.set("pickup", formData.pickup.trim());
    if (!isHourly) params.set("dropoff", formData.dropoff.trim());
    params.set("date", formData.date);
    params.set("time", formData.time);
    params.set("passengers", String(formData.passengers));
    params.set(
      "tripType",
      formData.tripType === "roundtrip" ? "return" : "oneway"
    );
    if (isHourly) params.set("duration", String(formData.duration));
    params.set("source", "embed_v1");
    // Use absolute URL with origin to avoid relative path issues
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/${locale}?${params.toString()}`;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    // Use window.location.href for reliable navigation from embedded context
    const targetUrl = createTargetUrl();
    window.location.href = targetUrl;
  };

  return (
    <>
      <div className="flex justify-between gap-3 rounded-3xl bg-transparent px-6 py-4">
        {progressSteps.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className="flex flex-col items-center text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                index === 0
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs">{label}</span>
          </div>
        ))}
      </div>

      <Card className="rounded-[32px] border border-slate-200 bg-white shadow-xl">
        <div className="p-8 space-y-6">
          <header className="space-y-2 text-center">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Réservation de trajet
            </span>
            <h1 className="text-2xl font-semibold text-slate-900">
              Planifiez votre transfert privé
            </h1>
            <p className="text-sm text-slate-500">
              Entrer vos informations pour accéder aux véhicules disponibles.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex rounded-full bg-slate-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    bookingType: "destination",
                    dropoff: prev.dropoff,
                  }));
                  setErrors((prev) => ({ ...prev, dropoff: undefined }));
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  formData.bookingType === "destination"
                    ? "bg-primary text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destination
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    bookingType: "hourly",
                    dropoff: "",
                  }));
                  setErrors((prev) => ({ ...prev, dropoff: undefined }));
                }}
                className={`flex-1 rounded-full px-4 py-2 transition ${
                  formData.bookingType === "hourly"
                    ? "bg-primary text-white shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure
                </span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Départ
                </label>
                <Input
                  ref={pickupInputRef}
                  placeholder="Adresse de prise en charge"
                  value={formData.pickup}
                  onChange={(event) => {
                    setFormData((prev) => ({
                      ...prev,
                      pickup: event.target.value,
                    }));
                    if (errors.pickup)
                      setErrors((prev) => ({ ...prev, pickup: undefined }));
                  }}
                  className={`rounded-2xl border-2 bg-white px-4 py-3 text-[15px] ${
                    errors.pickup
                      ? "border-red-400"
                      : "border-slate-200 focus:border-primary"
                  }`}
                />
                {errors.pickup && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.pickup}
                  </p>
                )}
              </div>

              {!isHourly && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Destination
                  </label>
                  <Input
                    ref={dropoffInputRef}
                    placeholder="Adresse de destination"
                    value={formData.dropoff}
                    onChange={(event) => {
                      setFormData((prev) => ({
                        ...prev,
                        dropoff: event.target.value,
                      }));
                      if (errors.dropoff)
                        setErrors((prev) => ({
                          ...prev,
                          dropoff: undefined,
                        }));
                    }}
                    className={`rounded-2xl border-2 bg-white px-4 py-3 text-[15px] ${
                      errors.dropoff
                        ? "border-red-400"
                        : "border-slate-200 focus:border-primary"
                    }`}
                  />
                  {errors.dropoff && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.dropoff}
                    </p>
                  )}
                </div>
              )}

              {isHourly && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Durée (heures)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.duration}
                    onChange={(event) => {
                      const value = Math.max(
                        1,
                        Number(event.target.value) || 1
                      );
                      setFormData((prev) => ({ ...prev, duration: value }));
                    }}
                    className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-primary"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(event) => {
                      setFormData((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }));
                      if (errors.date)
                        setErrors((prev) => ({ ...prev, date: undefined }));
                    }}
                    className={`rounded-2xl border-2 bg-white px-4 py-3 text-[15px] ${
                      errors.date
                        ? "border-red-400"
                        : "border-slate-200 focus:border-primary"
                    }`}
                  />
                  {errors.date && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Heure
                  </label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(event) => {
                      setFormData((prev) => ({
                        ...prev,
                        time: event.target.value,
                      }));
                      if (errors.time)
                        setErrors((prev) => ({ ...prev, time: undefined }));
                    }}
                    className={`rounded-2xl border-2 bg-white px-4 py-3 text-[15px] ${
                      errors.time
                        ? "border-red-400"
                        : "border-slate-200 focus:border-primary"
                    }`}
                  />
                  {errors.time && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.time}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Passagers
                </label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={formData.passengers}
                  onChange={(event) => {
                    const value = Math.min(
                      8,
                      Math.max(1, Number(event.target.value) || 1)
                    );
                    setFormData((prev) => ({ ...prev, passengers: value }));
                  }}
                  className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-primary"
                />
              </div>

              {!isHourly && (
                <div className="flex rounded-full bg-slate-100 p-1 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, tripType: "oneway" }))
                    }
                    className={`flex-1 rounded-full px-4 py-2 transition ${
                      formData.tripType === "oneway"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Aller simple
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tripType: "roundtrip",
                      }))
                    }
                    className={`flex-1 rounded-full px-4 py-2 transition ${
                      formData.tripType === "roundtrip"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Aller-retour
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-primary py-3 text-base font-semibold tracking-wide hover:bg-[#eda900]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redirection..." : "Rechercher"}
            </Button>
          </form>

          <footer className="text-center text-[11px] leading-relaxed text-slate-400">
            En envoyant mes données, j&apos;accepte d&apos;être contacté.
            <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>PayPal</span>
              <span>Twint</span>
              <span>Apple Pay</span>
            </div>
          </footer>
        </div>
      </Card>
      <div/>
    </>
  );
}
