"use client";

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';

interface StripeProviderProps {
  publishableKey: string;
  clientSecret: string;
  children: React.ReactNode;
}

export default function StripeProvider({ publishableKey, clientSecret, children }: StripeProviderProps) {
  const stripePromise = React.useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0070f3',
      },
    },
  };

  if (!stripePromise || !clientSecret) {
    return <div>Loading payment...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
