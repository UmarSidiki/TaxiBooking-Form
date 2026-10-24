"use client";

import { useEffect, useState } from "react";
import type { FormData } from "@/features/booking/context/booking-form-context";

export function useQuotedTotal(formData: FormData, distanceKm: number | undefined, fallback: number) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!formData.selectedVehicle) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, distanceKm }),
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data: { total?: number }) => {
          if (typeof data.total === "number") setTotal(data.total);
        })
        .catch(() => undefined);
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    formData.selectedVehicle,
    formData.pickup,
    formData.dropoff,
    formData.date,
    formData.time,
    formData.tripType,
    formData.bookingType,
    formData.childSeats,
    formData.babySeats,
    formData.meetAndGreet,
    formData.promoCode,
    formData.passengers,
    formData.duration,
    distanceKm,
  ]);

  return total ?? fallback;
}
