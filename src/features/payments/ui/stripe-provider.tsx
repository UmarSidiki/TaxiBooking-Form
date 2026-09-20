"use client";

import React, { useMemo } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions, Stripe } from "@stripe/stripe-js";

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
  let promise = stripePromiseCache.get(publishableKey);
  if (!promise) {
    promise = loadStripe(publishableKey);
    stripePromiseCache.set(publishableKey, promise);
  }
  return promise;
}

interface StripeProviderProps {
  publishableKey: string;
  clientSecret: string;
  children: React.ReactNode;
  appearance?: "stripe" | "night" | "flat";
}

export default function StripeProvider({
  publishableKey,
  clientSecret,
  children,
  appearance = "stripe",
}: StripeProviderProps) {
  const stripePromise = useMemo(
    () => (publishableKey ? getStripePromise(publishableKey) : null),
    [publishableKey]
  );

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: appearance,
      variables: {
        colorPrimary: "#0070f3",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        colorDanger: "#df1b41",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
      rules: {
        ".Input": {
          border: "1px solid #e0e0e0",
          boxShadow: "none",
        },
        ".Input:focus": {
          border: "1px solid #0070f3",
          boxShadow: "0 0 0 1px #0070f3",
        },
        ".Label": {
          fontSize: "14px",
          fontWeight: "500",
          marginBottom: "8px",
        },
      },
    },
    loader: "auto",
  };

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading secure payment...</div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
