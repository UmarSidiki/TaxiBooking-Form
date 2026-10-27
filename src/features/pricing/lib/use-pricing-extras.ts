"use client";

import { useEffect, useState } from "react";
import { defaultExtras, type PricingExtras } from "@/features/pricing/lib/quote-fare";

let pending: Promise<PricingExtras> | null = null;

function fetchExtras() {
  pending ??= fetch("/api/pricing/extras")
    .then((response) => (response.ok ? response.json() : { extras: defaultExtras() }))
    .then((body: { extras?: PricingExtras }) => body.extras ?? defaultExtras())
    .catch(() => {
      pending = null;
      return defaultExtras();
    });
  return pending;
}

/** Operator extras for booking forms. Starts with everything off until loaded. */
export function usePricingExtras() {
  const [extras, setExtras] = useState<PricingExtras>(defaultExtras);
  useEffect(() => {
    let live = true;
    void fetchExtras().then((value) => live && setExtras(value));
    return () => {
      live = false;
    };
  }, []);
  return extras;
}

/** Seat prices for `calculateBookingPrice`; a disabled seat costs nothing. */
export function seatPrices(extras: PricingExtras) {
  return {
    childSeatPrice: extras.childSeat.enabled ? extras.childSeat.price : 0,
    babySeatPrice: extras.babySeat.enabled ? extras.babySeat.price : 0,
  };
}
