"use client";

import { useEffect, useState } from "react";
import type { FormData } from "@/features/booking/context/booking-form-context";
import type {
  DepositConfig,
  DepositMethod,
} from "@/features/pricing/lib/deposit-percent";

export type QuotedFare = {
  total: number;
  chargeAmount: number;
  depositDue: number;
  balanceDue: number;
  depositConfig: DepositConfig;
};

type QuoteResponse = Omit<QuotedFare, "depositConfig"> & {
  total?: number;
  chargeAmount?: number;
  depositConfig?: DepositConfig;
};

export function useQuotedTotal(
  formData: FormData,
  distanceKm: number | undefined,
  fallback: number,
  paymentMethod?: DepositMethod,
) {
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
        body: JSON.stringify({ ...formData, distanceKm, paymentMethod }),
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
            depositConfig: data.depositConfig ?? {
              cash: { enabled: false, percent: 0 },
              appointment: { enabled: false, percent: 0 },
            },
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
    paymentMethod,
  ]);

  return {
    total: quote?.total ?? fallback,
    chargeAmount: quote?.chargeAmount ?? fallback,
    depositDue: quote?.depositDue ?? 0,
    balanceDue: quote?.balanceDue ?? 0,
    depositConfig: quote?.depositConfig ?? {
      cash: { enabled: false, percent: 0 },
      appointment: { enabled: false, percent: 0 },
    },
    ready,
  };
}
