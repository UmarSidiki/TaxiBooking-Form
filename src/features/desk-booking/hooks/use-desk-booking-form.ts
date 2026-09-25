"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useBookingVehicles } from "@/features/booking/hooks/use-booking-vehicles";
import { useDeskBookingAutocomplete } from "@/features/desk-booking/hooks/use-desk-booking-autocomplete";
import type { DeskBookingOutcome } from "@/features/desk-booking/schema/desk-booking.schema";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import { useTheme } from "@/features/settings/context/theme-context";
import { ApiError, apiPost } from "@/shared/http/api";
import { apiErrorMessage } from "@/shared/lib/api-error-copy";

export type DeskPaymentMethod = "cash" | "card" | "bank_transfer";

export type DeskStop = { location: string; order: number; duration?: number };

export interface DeskBookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  locale: string;
  bookingType: "destination" | "hourly";
  pickup: string;
  dropoff: string;
  stops: DeskStop[];
  tripType: "oneway" | "roundtrip";
  date: string;
  time: string;
  returnDate: string;
  returnTime: string;
  passengers: number;
  duration: number;
  flightNumber: string;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
  outcome: DeskBookingOutcome;
  manualPrice: string;
  paymentMethod: DeskPaymentMethod;
  paymentCollected: boolean;
  notifyCustomer: boolean;
}

export const EMPTY_DESK_BOOKING: DeskBookingFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  whatsappOptIn: false,
  locale: "en",
  bookingType: "destination",
  pickup: "",
  dropoff: "",
  stops: [],
  tripType: "oneway",
  date: "",
  time: "",
  returnDate: "",
  returnTime: "",
  passengers: 1,
  duration: 2,
  flightNumber: "",
  selectedVehicle: "",
  childSeats: 0,
  babySeats: 0,
  notes: "",
  outcome: "confirmed",
  manualPrice: "",
  paymentMethod: "cash",
  paymentCollected: false,
  notifyCustomer: true,
};

export function useDeskBookingForm({
  open,
  onCreated,
}: {
  open: boolean;
  onCreated: (tripId: string) => void;
}) {
  const t = useTranslations();
  const deskLocale = useLocale();
  const { settings } = useTheme();
  const { vehicles, vehiclesLoading } = useBookingVehicles();

  const [formData, setFormData] = useState<DeskBookingFormValues>({
    ...EMPTY_DESK_BOOKING,
    locale: deskLocale,
  });
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickupRef = useRef<HTMLInputElement | null>(null);
  const dropoffRef = useRef<HTMLInputElement | null>(null);
  const stopRefs = useRef<Array<HTMLInputElement | null>>([]);

  const update = useCallback((patch: Partial<DeskBookingFormValues>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const setAddress = useCallback(
    (field: "pickup" | "dropoff", address: string) => {
      setFormData((prev) => ({ ...prev, [field]: address }));
      setError(null);
    },
    []
  );

  const setStopAddress = useCallback((index: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, location: address } : stop
      ),
    }));
    setError(null);
  }, []);

  const flagOutsideArea = useCallback(() => {
    setError(t("Step1.location-outside-service-area"));
  }, [t]);

  useDeskBookingAutocomplete({
    open,
    settings,
    pickupRef,
    dropoffRef,
    stopRefs,
    stopCount: formData.stops.length,
    onAddress: setAddress,
    onStopAddress: setStopAddress,
    onOutsideArea: flagOutsideArea,
  });

  useEffect(() => {
    if (
      formData.bookingType !== "destination" ||
      !formData.pickup ||
      !formData.dropoff
    ) {
      setDistanceKm(undefined);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/distance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: formData.pickup,
            destination: formData.dropoff,
            stops: formData.stops
              .map((stop) => stop.location)
              .filter((location) => location.trim()),
            isRoundTrip: formData.tripType === "roundtrip",
          }),
        });
        const data = await response.json();
        if (!cancelled && data.success) {
          setDistanceKm(data.data.distance.km);
        }
      } catch {
        if (!cancelled) setDistanceKm(undefined);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    formData.bookingType,
    formData.pickup,
    formData.dropoff,
    formData.stops,
    formData.tripType,
  ]);

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle._id === formData.selectedVehicle
  );

  const enableTax = settings?.enableTax ?? false;
  const taxPercentage = settings?.taxPercentage ?? 0;
  const taxIncluded = settings?.taxIncluded ?? false;

  const computedFare = useMemo(() => {
    if (!selectedVehicle) return null;

    return calculateBookingPrice(
      selectedVehicle,
      {
        bookingType: formData.bookingType,
        tripType: formData.tripType,
        duration: formData.duration,
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        stops: formData.stops,
        childSeats: formData.childSeats,
        babySeats: formData.babySeats,
      },
      { enableTax, taxPercentage, taxIncluded },
      distanceKm
    );
  }, [
    selectedVehicle,
    formData.bookingType,
    formData.tripType,
    formData.duration,
    formData.pickup,
    formData.dropoff,
    formData.stops,
    formData.childSeats,
    formData.babySeats,
    distanceKm,
    enableTax,
    taxPercentage,
    taxIncluded,
  ]);

  const manualPrice = formData.manualPrice.trim();
  const parsedManualPrice = manualPrice ? Number(manualPrice) : undefined;
  const manualPriceInvalid =
    manualPrice.length > 0 &&
    (parsedManualPrice === undefined ||
      !Number.isFinite(parsedManualPrice) ||
      parsedManualPrice <= 0);

  const effectiveTotal = manualPriceInvalid
    ? 0
    : parsedManualPrice ?? computedFare?.total ?? 0;

  const reset = useCallback(() => {
    setFormData({ ...EMPTY_DESK_BOOKING, locale: deskLocale });
    setDistanceKm(undefined);
    setError(null);
  }, [deskLocale]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (manualPriceInvalid) {
      setError(t("Dashboard.Rides.manual-price-invalid"));
      return false;
    }

    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        whatsappOptIn: formData.whatsappOptIn,
        locale: formData.locale,
        bookingType: formData.bookingType,
        pickup: formData.pickup,
        dropoff: formData.bookingType === "hourly" ? undefined : formData.dropoff,
        stops: formData.bookingType === "hourly" ? [] : formData.stops
          .filter((stop) => stop.location.trim())
          .map((stop, index) => ({ ...stop, order: index })),
        tripType: formData.tripType,
        date: formData.date,
        time: formData.time,
        returnDate: formData.tripType === "roundtrip" ? formData.returnDate || undefined : undefined,
        returnTime: formData.tripType === "roundtrip" ? formData.returnTime || undefined : undefined,
        passengers: formData.passengers,
        duration: formData.bookingType === "hourly" ? formData.duration : undefined,
        flightNumber: formData.flightNumber || undefined,
        selectedVehicle: formData.selectedVehicle,
        childSeats: formData.childSeats,
        babySeats: formData.babySeats,
        notes: formData.notes,
        outcome: formData.outcome,
        manualPrice: parsedManualPrice,
        paymentMethod: formData.paymentMethod,
        paymentCollected: formData.paymentCollected,
        notifyCustomer: formData.notifyCustomer,
      };

      const data = await apiPost<{
        success: boolean;
        data: { tripId: string };
      }>("/api/bookings", payload);

      onCreated(data.data.tripId);
      reset();
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.detail) {
        setError(err.detail);
      } else {
        const code = err instanceof ApiError ? err.code : "request_failed";
        setError(apiErrorMessage((key) => t(`ApiErrors.${key}`), code));
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, manualPriceInvalid, parsedManualPrice, onCreated, reset, t]);

  return {
    formData,
    update,
    vehicles,
    vehiclesLoading,
    selectedVehicle,
    computedFare,
    currency: settings?.stripeCurrency ?? "EUR",
    effectiveTotal,
    manualPriceInvalid,
    isSaving,
    error,
    submit,
    reset,
    pickupRef,
    dropoffRef,
    stopRefs,
  };
}
