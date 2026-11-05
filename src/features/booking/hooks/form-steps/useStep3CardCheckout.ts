"use client";

import { resolvePostBookingRedirect } from "@/features/payments/lib/resolve-post-booking-redirect";
import { clearDraftId } from "@/features/booking/lib/draft-id";
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
  /** True when this session should collect an online amount for the current method. */
  openSession: boolean;
  /** Which deposit rule the session endpoint should price with. */
  sessionPaymentMethod: "card" | "cash" | "appointment";
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
  openSession,
  sessionPaymentMethod,
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
  /** Latest success handler, kept in a ref to keep createPaymentIntent stable. */
  const handleSuccessRef = useRef<((id: string) => Promise<void>) | null>(null);
  /** Retry counter for in-flight (processing) intents. */
  const processingRetriesRef = useRef(0);
  const processingTimerRef = useRef<number | null>(null);
  /** Payment method the current session was created for. */
  const sessionMethodRef = useRef(sessionPaymentMethod);

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
          paymentMethod: sessionPaymentMethod,
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

      if (data.success && (data.status === "succeeded" || data.status === "processing")) {
        // Terminal / in-flight intent: never mount Elements against it.
        intentTotalRef.current = dueNow;
        setClientSecret(null);
        setStripeOrderId(data.orderId || null);
        setPaymentError(null);
        setPaymentInitialized(true);
        if (data.status === "succeeded" && data.paymentIntentId) {
          processingRetriesRef.current = 0;
          const run = handleSuccessRef.current;
          if (run) void run(data.paymentIntentId);
        } else if (data.status === "processing") {
          // Wait for the webhook/finalization to land, then re-check.
          if (processingRetriesRef.current < 5) {
            processingRetriesRef.current += 1;
            if (processingTimerRef.current) {
              window.clearTimeout(processingTimerRef.current);
            }
            processingTimerRef.current = window.setTimeout(() => {
              processingTimerRef.current = null;
              void createPaymentIntent();
            }, 3000);
          }
        }
      } else if (data.success && data.clientSecret) {
        processingRetriesRef.current = 0;
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
    sessionPaymentMethod,
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

  // Changing the method (card ↔ cash ↔ appointment) abandons the old session.
  useEffect(() => {
    if (sessionMethodRef.current === sessionPaymentMethod) return;
    sessionMethodRef.current = sessionPaymentMethod;
    const hadSession = Boolean(clientSecret) || paymentInitialized;
    intentTotalRef.current = null;
    processingRetriesRef.current = 0;
    setPaymentInitialized(false);
    setClientSecret(null);
    setStripeOrderId(null);
    // When the next method also needs a session, the new session overwrites the
    // pending draft; cancelling would race and could abandon it. Only cancel
    // when the switch leaves an online session unused.
    if (hadSession && !openSession) {
      void fetch("/api/checkout/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, [
    sessionPaymentMethod,
    openSession,
    clientSecret,
    paymentInitialized,
    draftId,
    setClientSecret,
    setStripeOrderId,
    setPaymentInitialized,
  ]);

  useEffect(
    () => () => {
      if (processingTimerRef.current) {
        window.clearTimeout(processingTimerRef.current);
      }
    },
    [],
  );

  // No PaymentIntent exists until the visitor picks a method that needs one.
  useEffect(() => {
    if (!openSession) return;
    if (clientSecret || creatingPaymentIntent || paymentInitialized) return;
    if (!stripeConfig.publishableKey || !quoteReady || dueNow <= 0) return;
    void createPaymentIntent();
  }, [
    openSession,
    stripeConfig.publishableKey,
    dueNow,
    quoteReady,
    clientSecret,
    creatingPaymentIntent,
    paymentInitialized,
    createPaymentIntent,
  ]);

  // Switching to a method that needs no online session abandons the PI.
  useEffect(() => {
    if (openSession) return;
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
    openSession,
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
    const thankYouMethod =
      sessionPaymentMethod === "cash"
        ? "cash"
        : sessionPaymentMethod === "appointment"
          ? "request"
          : "stripe";
    try {
      const { ensurePaymentFinalized } = await import("@/features/payments/lib/complete-payment");
      await ensurePaymentFinalized({
        provider: "stripe",
        paymentIntentId,
        orderId: stripeOrderId || undefined,
      });

      const query = new URLSearchParams({ method: thankYouMethod, draftId });
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
      const query = new URLSearchParams({ method: thankYouMethod, draftId });
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

  handleSuccessRef.current = handleStripePaymentSuccess;

  const handleStripePaymentError = (error: string) => {
    setPaymentError(t("Step3.payment-failed-error", { 0: error }));
  };

  const retryStripePayment = () => {
    intentTotalRef.current = null;
    processingRetriesRef.current = 0;
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
