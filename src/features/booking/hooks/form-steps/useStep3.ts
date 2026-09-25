"use client";

import { useState, useEffect, useRef } from "react";
import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/features/settings/context/theme-context";
import { ISetting } from "@/features/settings/model";
import { useStep3Map } from "@/features/booking/hooks/form-steps/useStep3Map";
import { useStep3Payments } from "@/features/booking/hooks/form-steps/useStep3Payments";
import { useStep3Pricing } from "@/features/booking/hooks/form-steps/useStep3Pricing";

export function useStep3() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { settings } = useTheme();
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    vehicles,
    distanceData,
    setCurrentStep,
    isLoading,
    setIsLoading,
    resetForm,
  } = useBookingForm();

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [stripeConfig, setStripeConfig] = useState<{
    enabled: boolean;
    publishableKey: string | null;
  }>({
    enabled: false,
    publishableKey: null,
  });
  const [paymentSettings, setPaymentSettings] = useState<ISetting | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeOrderId, setStripeOrderId] = useState<string | null>(null);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const isSubmittingRef = useRef(false); // Synchronous guard against double-clicks

  useStep3Map({
    mapRef,
    googleMapRef,
    directionsRendererRef,
    settings,
    formData,
    setMapLoaded,
  });

  // Payment config from ThemeProvider (avoids duplicate /api/settings call)
  useEffect(() => {
    if (!settings) return;

    setPaymentSettings(settings as ISetting);

    if (settings.stripePublishableKey) {
      setStripeConfig({
        enabled: true,
        publishableKey: settings.stripePublishableKey,
      });
    }

    if (settings.acceptedPaymentMethods && settings.acceptedPaymentMethods.length > 0) {
      setSelectedPaymentMethod((current) => {
        if (current) return current;
        return settings.acceptedPaymentMethods!.includes("card")
          ? "card"
          : settings.acceptedPaymentMethods![0];
      });
    }
  }, [settings]);

  const selectedVehicle = vehicles.find(
    (v) => v._id === formData.selectedVehicle
  );

  const pricing = useStep3Pricing({
    selectedVehicle,
    formData,
    distanceData,
    paymentSettings,
  });

  const payments = useStep3Payments({
    formData,
    setErrors,
    t,
    locale,
    settings,
    router,
    resetForm,
    setIsLoading,
    stripeConfig,
    paymentSettings,
    selectedPaymentMethod,
    clientSecret,
    setClientSecret,
    stripeOrderId,
    setStripeOrderId,
    creatingPaymentIntent,
    setCreatingPaymentIntent,
    paymentError,
    setPaymentError,
    paymentInitialized,
    setPaymentInitialized,
    isSubmittingRef,
    totalPrice: pricing.totalPrice,
    displaySubtotalAmount: pricing.displaySubtotalAmount,
    taxAmount: pricing.taxAmount,
    enableTax: pricing.enableTax,
    taxPercentage: pricing.taxPercentage,
    taxIncluded: pricing.taxIncluded,
  });

  const handleBack = () => {
    setCurrentStep(2);
  };

  return {
    // State
    stripeConfig,
    paymentSettings,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    clientSecret,
    stripeOrderId,
    creatingPaymentIntent,
    paymentError,
    retryStripePayment: payments.retryStripePayment,

    // Map state
    mapLoaded,
    mapRef,

    // Context values
    formData,
    setFormData,
    errors,
    selectedVehicle,
    distanceData,
    isLoading,

    // Calculated values
    ...pricing,

    // Functions
    handleStripePaymentSuccess: payments.handleStripePaymentSuccess,
    handleStripePaymentError: payments.handleStripePaymentError,
    handleCashBooking: payments.handleCashBooking,
    handleBankTransferBooking: payments.handleBankTransferBooking,
    handleMultisafepayBooking: payments.handleMultisafepayBooking,
    handleAppointmentRequest: payments.handleAppointmentRequest,
    handleBack,
  };
}
