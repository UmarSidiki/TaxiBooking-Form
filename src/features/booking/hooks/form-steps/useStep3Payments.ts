"use client";

import { resolvePostBookingRedirect } from "@/features/payments/lib/resolve-post-booking-redirect";
import { DEFAULT_STRIPE_CURRENCY } from "@/features/payments/lib/stripe-currency";
import { validateStep3Contact } from "@/features/payments/lib/validate-step3-contact";
import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { useTranslations } from "next-intl";
import { apiErrorMessage } from "@/shared/lib/api-error-copy";
import { ApiError } from "@/shared/http/api";
import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

export function useStep3Payments({
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
  setPaymentError,
  paymentInitialized,
  setPaymentInitialized,
  isSubmittingRef,
  totalPrice,
  displaySubtotalAmount,
  taxAmount,
  enableTax,
  taxPercentage,
  taxIncluded,
}: {
  formData: FormData;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  settings: Partial<ISetting> | null | undefined;
  router: AppRouterInstance;
  resetForm: () => void;
  setIsLoading: (loading: boolean) => void;
  stripeConfig: { enabled: boolean; publishableKey: string | null };
  paymentSettings: ISetting | null;
  selectedPaymentMethod: string;
  clientSecret: string | null;
  setClientSecret: Dispatch<SetStateAction<string | null>>;
  stripeOrderId: string | null;
  setStripeOrderId: Dispatch<SetStateAction<string | null>>;
  creatingPaymentIntent: boolean;
  setCreatingPaymentIntent: Dispatch<SetStateAction<boolean>>;
  paymentError: string | null;
  setPaymentError: Dispatch<SetStateAction<string | null>>;
  paymentInitialized: boolean;
  setPaymentInitialized: Dispatch<SetStateAction<boolean>>;
  isSubmittingRef: MutableRefObject<boolean>;
  totalPrice: number;
  displaySubtotalAmount: number;
  taxAmount: number;
  enableTax: boolean;
  taxPercentage: number;
  taxIncluded: boolean;
}) {
  // Create payment intent function
  const createPaymentIntent = useCallback(async () => {
    if (!stripeConfig.publishableKey || creatingPaymentIntent || totalPrice <= 0) return;
    
    setCreatingPaymentIntent(true);
    setPaymentError(null);

    console.log("Creating payment intent");

    try {
      // Prepare booking data for webhook fallback processing
      const bookingDataForWebhook = {
        pickup: formData.pickup,
        dropoff: formData.dropoff,
        stops: formData.stops,
        tripType: formData.tripType,
        bookingType: formData.bookingType,
        duration: formData.duration,
        date: formData.date,
        time: formData.time,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime,
        passengers: formData.passengers,
        selectedVehicle: formData.selectedVehicle,
        childSeats: Number(formData.childSeats) || 0,
        babySeats: Number(formData.babySeats) || 0,
        notes: formData.notes,
        flightNumber: formData.flightNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        whatsappOptIn: formData.whatsappOptIn,
        locale,
        totalAmount: totalPrice,
        subtotalAmount: displaySubtotalAmount,
        taxAmount: taxAmount,
        taxPercentage: enableTax ? taxPercentage : 0,
      };

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          currency: paymentSettings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          description: `Booking from ${formData.pickup || "pickup"} to ${formData.dropoff || "dropoff"}`,
          bookingData: bookingDataForWebhook, // Include booking data for webhook processing
        }),
      });

      const data = await response.json();

      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStripeOrderId(data.orderId || null);
        setPaymentError(null);
        setPaymentInitialized(true);
      } else {
        const code =
          typeof data.error === "string" ? data.error : "payment_init_failed";
        setPaymentError(apiErrorMessage((key) => t(`ApiErrors.${key}`), code));
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "request_failed";
      setPaymentError(apiErrorMessage((key) => t(`ApiErrors.${key}`), code));
    } finally {
      setCreatingPaymentIntent(false);
    }
  }, [
    stripeConfig.publishableKey,
    creatingPaymentIntent,
    totalPrice,
    displaySubtotalAmount,
    taxAmount,
    enableTax,
    taxPercentage,
    paymentSettings?.stripeCurrency,
    formData,
    locale,
    t,
  ]);

  // Auto-initiate Stripe payment intent when 'card' is selected
  useEffect(() => {
    if (settings?.enableAppointmentRequest) return;
    if (
      selectedPaymentMethod === "card" &&
      stripeConfig.enabled &&
      totalPrice > 0 &&
      !clientSecret &&
      !creatingPaymentIntent &&
      !paymentInitialized
    ) {
      createPaymentIntent();
    }
  }, [
    settings?.enableAppointmentRequest,
    selectedPaymentMethod,
    stripeConfig.enabled,
    totalPrice,
    clientSecret,
    creatingPaymentIntent,
    paymentInitialized,
    createPaymentIntent
  ]);

  // Reset payment initialization when payment method changes
  useEffect(() => {
    if (selectedPaymentMethod !== "card") {
      setPaymentInitialized(false);
      setClientSecret(null);
    }
  }, [selectedPaymentMethod]);

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    setIsLoading(true);
    try {
      // Single fallback finalize (webhook is primary; skips if already done)
      const { ensurePaymentFinalized } = await import('@/features/payments/lib/complete-payment');
      await ensurePaymentFinalized({
        provider: 'stripe',
        paymentIntentId,
        orderId: stripeOrderId || undefined,
      });

      const finalTripId = stripeOrderId || "PENDING";
      const target = resolvePostBookingRedirect(
        settings,
        `/${locale}/thank-you?tripId=${finalTripId}&amount=${totalPrice.toFixed(2)}&method=stripe`
      );

      await router.push(target);
      resetForm();
    } catch (error) {
      console.error("Post-payment error:", error);
      // Payment succeeded even if redirection fails — attempt redirect and then reset form
      const fallback = resolvePostBookingRedirect(
        settings,
        `/${locale}/thank-you?method=stripe`
      );
      await router.push(fallback);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePaymentError = (error: string) => {
    setPaymentError(t('Step3.payment-failed-error', { 0: error }));
  };

  const retryStripePayment = () => {
    setPaymentError(null);
    setPaymentInitialized(false);
    setClientSecret(null);
    setStripeOrderId(null);
  };

  const submitOfflineBooking = async (paymentMethod: "cash" | "bank_transfer") => {
    // Prevent double-click submissions
    if (isSubmittingRef.current) return;

    if (!validateStep3Contact(formData, t, setErrors)) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          childSeats: Number(formData.childSeats) || 0,
          babySeats: Number(formData.babySeats) || 0,
          paymentMethod,
          paymentStatus: "pending",
          locale,
          totalAmount: totalPrice,
          subtotalAmount: displaySubtotalAmount,
          taxAmount: taxAmount,
          taxPercentage: enableTax ? taxPercentage : 0,
          taxIncluded: enableTax ? taxIncluded : false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const target = resolvePostBookingRedirect(
          settings,
          `/${locale}/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(2)}&method=${paymentMethod}`
        );
        await router.push(target);
        resetForm();
      } else {
        alert(`Booking failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleCashBooking = async () => {
    await submitOfflineBooking("cash");
  };

  const handleBankTransferBooking = async () => {
    await submitOfflineBooking("bank_transfer");
  };

  const handleMultisafepayBooking = async () => {
    // Prevent double-click submissions
    if (isSubmittingRef.current) return;

    if (!validateStep3Contact(formData, t, setErrors)) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      // Create MultiSafepay order directly without creating booking
      const paymentResponse = await fetch("/api/create-multisafepay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          currency: paymentSettings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          description: `Booking from ${formData.pickup} to ${formData.dropoff || 'destination'}`,
          bookingData: {
            ...formData,
            childSeats: Number(formData.childSeats) || 0,
            babySeats: Number(formData.babySeats) || 0,
            subtotalAmount: displaySubtotalAmount,
            taxAmount: taxAmount,
            taxPercentage: enableTax ? taxPercentage : 0,
            taxIncluded: enableTax ? taxIncluded : false,
          },
          totalAmount: totalPrice,
          subtotalAmount: displaySubtotalAmount,
          taxAmount: taxAmount,
          taxPercentage: enableTax ? taxPercentage : 0,
          taxIncluded: enableTax ? taxIncluded : false,
          locale: locale,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.paymentUrl) {
        const merchantOrderId = paymentData.merchantOrderId || paymentData.orderId;
        if (merchantOrderId && typeof window !== 'undefined') {
          sessionStorage.setItem('msp_order_id', merchantOrderId);
        }
        window.location.href = paymentData.paymentUrl;
      } else {
        alert(`Payment initialization failed: ${paymentData.message}`);
        isSubmittingRef.current = false;
        setIsLoading(false);
      }
    } catch (error) {
      console.error("MultiSafepay booking error:", error);
      alert("Booking failed. Please try again.");
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleAppointmentRequest = async () => {
    if (isSubmittingRef.current) return;
    if (!validateStep3Contact(formData, t, setErrors)) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          childSeats: Number(formData.childSeats) || 0,
          babySeats: Number(formData.babySeats) || 0,
          paymentStatus: "pending",
          locale,
          totalAmount: totalPrice,
          subtotalAmount: displaySubtotalAmount,
          taxAmount: taxAmount,
          taxPercentage: enableTax ? taxPercentage : 0,
          taxIncluded: enableTax ? taxIncluded : false,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const target = resolvePostBookingRedirect(
          settings,
          `/${locale}/thank-you?tripId=${data.tripId}&amount=${totalPrice.toFixed(2)}&method=request`
        );
        await router.push(target);
        resetForm();
      } else {
        setPaymentError(
          apiErrorMessage(
            (key) => t(`ApiErrors.${key}`),
            typeof data.error === "string" ? data.error : "request_failed"
          )
        );
      }
    } catch (error) {
      console.error("Appointment request error:", error);
      setPaymentError(apiErrorMessage((key) => t(`ApiErrors.${key}`), "request_failed"));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return {
    createPaymentIntent,
    handleStripePaymentSuccess,
    handleStripePaymentError,
    retryStripePayment,
    handleCashBooking,
    handleBankTransferBooking,
    handleMultisafepayBooking,
    handleAppointmentRequest,
  };
}
