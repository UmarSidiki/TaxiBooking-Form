"use client";

import type { FormData } from "@/contexts/BookingFormContext";
import type { Dispatch, SetStateAction } from "react";

export function useBookingStops(
  formData: FormData,
  setFormData: Dispatch<SetStateAction<FormData>>
) {
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

  return {
    handleAddStop,
    handleRemoveStop,
    handleStopChange,
    handleStopDurationChange,
  };
}
