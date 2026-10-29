"use client";

import { resolvePostBookingRedirect } from "@/features/payments/lib/resolve-post-booking-redirect";
import { DEFAULT_STRIPE_CURRENCY } from "@/features/payments/lib/stripe-currency";
import { validateStep3Contact } from "@/features/payments/lib/validate-step3-contact";
import { clearDraftId } from "@/features/booking/lib/draft-id";
import { apiErrorMessage } from "@/shared/lib/api-error-copy";
import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { useTranslations } from "next-intl";

type OfflineBookingOptions = {
  formData: FormData;
  setErrors: Dispatch<SetStateAction<FormErrors>>;
  t: ReturnType<typeof useTranslations>;
  locale: string;
  settings: Partial<ISetting> | null | undefined;
  router: AppRouterInstance;
  resetForm: () => void;
  setIsLoading: (loading: boolean) => void;
  setPaymentError: Dispatch<SetStateAction<string | null>>;
  paymentSettings: ISetting | null;
  isSubmittingRef: MutableRefObject<boolean>;
  draftId: string;
};

export function useStep3OfflineBooking({
  formData,
  setErrors,
  t,
  locale,
  settings,
  router,
  resetForm,
  setIsLoading,
  setPaymentError,
  paymentSettings,
  isSubmittingRef,
  draftId,
}: OfflineBookingOptions) {
  const goToThankYou = async (tripId: string | undefined, method: string) => {
    const query = new URLSearchParams({ method, draftId });
    if (tripId) query.set("tripId", tripId);
    const target = resolvePostBookingRedirect(
      settings,
      `/${locale}/thank-you?${query.toString()}`
    );
    await router.push(target);
    resetForm();
    clearDraftId();
  };

  const postBooking = (paymentMethod: "cash" | "bank_transfer", request: "booking" | "request") =>
    fetch("/api/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": draftId,
      },
      body: JSON.stringify({
        ...formData,
        draftId,
        childSeats: Number(formData.childSeats) || 0,
        babySeats: Number(formData.babySeats) || 0,
        paymentMethod: request === "booking" ? paymentMethod : undefined,
        paymentStatus: "pending",
        locale,
      }),
    });

  const submitOfflineBooking = async (paymentMethod: "cash" | "bank_transfer") => {
    if (isSubmittingRef.current) return;
    if (!validateStep3Contact(formData, t, setErrors)) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const response = await postBooking(paymentMethod, "booking");
      const data = await response.json();

      if (response.ok) {
        await goToThankYou(data.tripId, paymentMethod);
      } else {
        alert(
          apiErrorMessage(
            (key) => t(`ApiErrors.${key}`),
            typeof data.error === "string" ? data.error : "request_failed"
          )
        );
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
    if (isSubmittingRef.current) return;
    if (!validateStep3Contact(formData, t, setErrors)) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch("/api/create-multisafepay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": draftId,
        },
        body: JSON.stringify({
          draftId,
          currency: paymentSettings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY,
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          description: `Booking from ${formData.pickup} to ${formData.dropoff || "destination"}`,
          bookingData: {
            ...formData,
            childSeats: Number(formData.childSeats) || 0,
            babySeats: Number(formData.babySeats) || 0,
          },
          locale,
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        const merchantOrderId = data.merchantOrderId || data.orderId;
        if (merchantOrderId && typeof window !== "undefined") {
          sessionStorage.setItem("msp_order_id", merchantOrderId);
        }
        window.location.href = data.paymentUrl;
      } else {
        alert(
          apiErrorMessage(
            (key) => t(`ApiErrors.${key}`),
            typeof data.error === "string" ? data.error : "payment_init_failed"
          )
        );
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
      const response = await postBooking("cash", "request");
      const data = await response.json();
      if (response.ok) {
        await goToThankYou(data.tripId, "request");
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
    handleCashBooking,
    handleBankTransferBooking,
    handleMultisafepayBooking,
    handleAppointmentRequest,
  };
}
