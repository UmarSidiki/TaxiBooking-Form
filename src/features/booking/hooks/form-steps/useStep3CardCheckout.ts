"use client";

import { resolvePostBookingRedirect } from "@/features/payments/lib/resolve-post-booking-redirect";
import { clearDraftId } from "@/features/booking/lib/draft-id";
import { shouldOpenCardSession } from "@/features/payments/lib/checkout/should-open-card-session";
import { apiErrorMessage } from "@/shared/lib/api-error-copy";
import { ApiError } from "@/shared/http/api";
import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { FormData } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { useTranslations } from "next-intl";

type CardCheckoutOptions = {
  formData: FormData;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  settings: Partial<ISetting> | null | undefined;
  router: AppRouterInstance;
  resetForm: () => void;
  setIsLoading: (loading: boolean) => void;
  stripeConfig: { enabled: boolean; publishableKey: string | null };
  selectedPaymentMethod: string;
  clientSecret: string | null;
  setClientSecret: Dispatch<SetStateAction<string | null>>;
  stripeOrderId: string | null;
  setStripeOrderId: Dispatch<SetStateAction<string | null>>;
  creatingPaymentIntent: boolean;
  setCreatingPaymentIntent: Dispatch<SetStateAction<boolean>>;
  setPaymentError: Dispatch<SetStateAction<string | null>>;
  paymentInitialized: boolean;
  setPaymentInitialized: Dispatch<SetStateAction<boolean>>;
  draftId: string;
  dueNow: number;
  quoteReady: boolean;
};

export function useStep3CardCheckout({
  formData,
  t,
  locale,
  settings,
  router,
  resetForm,
  setIsLoading,
  stripeConfig,
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
  draftId,
  dueNow,
  quoteReady,
}: CardCheckoutOptions) {
  /** Total baked into the current PaymentIntent — used to detect stale intents. */
  const intentTotalRef = useRef<number | null>(null);

  const createPaymentIntent = useCallback(async () => {
    if (!stripeConfig.publishableKey || creatingPaymentIntent || !quoteReady || dueNow <= 0) {
      return;
    }

    setCreatingPaymentIntent(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          description: `Booking from ${formData.pickup || "pickup"} to ${formData.dropoff || "dropoff"}`,
          bookingData: {
            pickup: formData.pickup,
            pickupLatLng: formData.pickupLatLng,
            dropoff: formData.dropoff,
            dropoffLatLng: formData.dropoffLatLng,
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
            meetAndGreet: formData.meetAndGreet,
            promoCode: formData.promoCode,
            notes: formData.notes,
            flightNumber: formData.flightNumber,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            whatsappOptIn: formData.whatsappOptIn,
            locale,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.clientSecret) {
        intentTotalRef.current = dueNow;
        setClientSecret(data.clientSecret);
        setStripeOrderId(data.orderId || null);
        setPaymentError(null);
        setPaymentInitialized(true);
      } else {
        const code = typeof data.error === "string" ? data.error : "payment_init_failed";
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
    dueNow,
    quoteReady,
    formData,
    locale,
    t,
    draftId,
    setClientSecret,
    setStripeOrderId,
    setPaymentError,
    setPaymentInitialized,
    setCreatingPaymentIntent,
  ]);

  // A changed total updates the same open PaymentIntent instead of orphaning it.
  useEffect(() => {
    if (intentTotalRef.current === null) return;
    if (intentTotalRef.current === dueNow) return;
    if (creatingPaymentIntent) return;
    intentTotalRef.current = dueNow;
    void createPaymentIntent();
  }, [dueNow, creatingPaymentIntent, createPaymentIntent]);

  // No PaymentIntent exists until the visitor explicitly picks the card method.
  useEffect(() => {
    const open = shouldOpenCardSession({
      method: selectedPaymentMethod,
      appointmentOnly: Boolean(settings?.enableAppointmentRequest),
      enabled: stripeConfig.enabled,
      quoteReady,
      dueNow,
      hasSecret: Boolean(clientSecret),
      creating: creatingPaymentIntent,
      initialized: paymentInitialized,
    });
    if (!open) return;
    void createPaymentIntent();
  }, [
    settings?.enableAppointmentRequest,
    selectedPaymentMethod,
    stripeConfig.enabled,
    dueNow,
    quoteReady,
    clientSecret,
    creatingPaymentIntent,
    paymentInitialized,
    createPaymentIntent,
  ]);

  // Switching away from card abandons the server-side PaymentIntent.
  useEffect(() => {
    if (selectedPaymentMethod === "card") return;
    if (!clientSecret && !paymentInitialized) return;
    intentTotalRef.current = null;
    setPaymentInitialized(false);
    setClientSecret(null);
    setStripeOrderId(null);
    void fetch("/api/checkout/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [
    selectedPaymentMethod,
    clientSecret,
    paymentInitialized,
    draftId,
    setPaymentInitialized,
    setClientSecret,
    setStripeOrderId,
  ]);

  // Closing the tab is an abandon too; the cron sweep is the final safety net.
  useEffect(() => {
    const abandon = () => {
      if (!paymentInitialized) return;
      const body = new Blob([JSON.stringify({ draftId })], {
        type: "application/json",
      });
      navigator.sendBeacon?.("/api/checkout/cancel", body);
    };
    window.addEventListener("pagehide", abandon);
    return () => window.removeEventListener("pagehide", abandon);
  }, [draftId, paymentInitialized]);

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    setIsLoading(true);
    try {
      const { ensurePaymentFinalized } = await import("@/features/payments/lib/complete-payment");
      await ensurePaymentFinalized({
        provider: "stripe",
        paymentIntentId,
        orderId: stripeOrderId || undefined,
      });

      const query = new URLSearchParams({ method: "stripe", draftId });
      if (stripeOrderId) query.set("tripId", stripeOrderId);
      const target = resolvePostBookingRedirect(
        settings,
        `/${locale}/thank-you?${query.toString()}`
      );

      await router.push(target);
      resetForm();
      clearDraftId();
    } catch (error) {
      console.error("Post-payment error:", error);
      const query = new URLSearchParams({ method: "stripe", draftId });
      const fallback = resolvePostBookingRedirect(
        settings,
        `/${locale}/thank-you?${query.toString()}`
      );
      await router.push(fallback);
      resetForm();
      clearDraftId();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePaymentError = (error: string) => {
    setPaymentError(t("Step3.payment-failed-error", { 0: error }));
  };

  const retryStripePayment = () => {
    intentTotalRef.current = null;
    setPaymentError(null);
    setPaymentInitialized(false);
    setClientSecret(null);
    setStripeOrderId(null);
  };

  return {
    createPaymentIntent,
    handleStripePaymentSuccess,
    handleStripePaymentError,
    retryStripePayment,
  };
}
