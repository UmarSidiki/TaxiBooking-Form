"use client";

import { getOrCreateDraftId } from "@/features/booking/lib/draft-id";
import { useStep3CardCheckout } from "@/features/booking/hooks/form-steps/useStep3CardCheckout";
import { useStep3OfflineBooking } from "@/features/booking/hooks/form-steps/useStep3OfflineBooking";
import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import type { ISetting } from "@/features/settings/model";
import type { DepositConfig } from "@/features/pricing/lib/deposit-percent";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { useTranslations } from "next-intl";
import { useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

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
  chargeAmount,
  quoteReady,
  depositConfig,
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
  setPaymentError: Dispatch<SetStateAction<string | null>>;
  paymentInitialized: boolean;
  setPaymentInitialized: Dispatch<SetStateAction<boolean>>;
  isSubmittingRef: MutableRefObject<boolean>;
  totalPrice: number;
  chargeAmount: number;
  quoteReady: boolean;
  depositConfig: DepositConfig;
}) {
  const [draftId] = useState(() => getOrCreateDraftId());
  const dueNow = chargeAmount > 0 ? chargeAmount : totalPrice;
  const appointmentOnly = Boolean(settings?.enableAppointmentRequest);
  const sessionPaymentMethod = appointmentOnly
    ? "appointment"
    : selectedPaymentMethod === "cash"
      ? "cash"
      : "card";
  const openSession = appointmentOnly
    ? depositConfig.appointment.enabled && depositConfig.appointment.percent > 0
    : selectedPaymentMethod === "card"
      ? stripeConfig.enabled
      : selectedPaymentMethod === "cash"
        ? depositConfig.cash.enabled && depositConfig.cash.percent > 0
        : false;

  const card = useStep3CardCheckout({
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
  });

  const offline = useStep3OfflineBooking({
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
  });

  return { ...card, ...offline };
}
