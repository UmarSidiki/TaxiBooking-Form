"use client";

import { useEffect, useState } from "react";
import type { FormData } from "@/features/booking/context/booking-form-context";

export type QuotedFare = {
  total: number;
  chargeAmount: number;
  depositDue: number;
  balanceDue: number;
};

type QuoteResponse = QuotedFare & { total?: number; chargeAmount?: number };

export function useQuotedTotal(formData: FormData, distanceKm: number | undefined, fallback: number) {
  const [quote, setQuote] = useState<QuotedFare | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!formData.selectedVehicle) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setReady(false);
      void fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, distanceKm }),
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data: QuoteResponse) => {
          if (typeof data.total !== "number") {
            setQuote(null);
            return;
          }
          const chargeAmount = typeof data.chargeAmount === "number" ? data.chargeAmount : data.total;
          setQuote({
            total: data.total,
            chargeAmount,
            depositDue: data.depositDue ?? 0,
            balanceDue: data.balanceDue ?? 0,
          });
        })
        .catch(() => setQuote(null))
        .finally(() => {
          if (!controller.signal.aborted) setReady(true);
        });
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
    formData.returnDate,
    formData.returnTime,
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

  return {
    total: quote?.total ?? fallback,
    chargeAmount: quote?.chargeAmount ?? fallback,
    depositDue: quote?.depositDue ?? 0,
    balanceDue: quote?.balanceDue ?? 0,
    ready,
  };
}
