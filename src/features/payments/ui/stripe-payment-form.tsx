"use client";

import React, { useRef, useState } from "react";
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Shield,
  Lock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getCurrencySymbol } from "@/lib/utils";

interface BookingData {
  pickup: string;
  dropoff?: string;
  stops?: Array<{ location: string; order: number; duration?: number }>;
  tripType: string;
  bookingType?: string;
  duration?: number;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  selectedVehicle: string;
  childSeats: number;
  babySeats: number;
  notes: string;
  flightNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
}

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  orderId?: string;
  bookingData?: BookingData;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({
  amount,
  currency = "EUR",
  orderId,
  bookingData,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [walletsAvailable, setWalletsAvailable] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const t = useTranslations();

  const getReturnUrl = () => {
    const locale = window.location.pathname.split("/").filter(Boolean)[0] || "en";
    const url = new URL(`/${locale}/payment-success`, window.location.origin);
    if (orderId) {
      url.searchParams.set("orderId", orderId);
    }
    return url.toString();
  };

  const confirmPayment = async (
    walletEvent?: StripeExpressCheckoutElementConfirmEvent,
  ) => {
    if (!stripe || !elements) {
      setMessage({
        type: "error",
        text: t("Stripe.payment-system-not-ready-please-refresh-the-page"),
      });
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    if (
      !bookingData?.firstName?.trim() ||
      !bookingData?.lastName?.trim() ||
      !bookingData?.email?.trim() ||
      !bookingData?.phone?.trim()
    ) {
      const message = t("Stripe.complete-contact-details-before-paying");
      walletEvent?.paymentFailed({ reason: "fail" });
      setMessage({ type: "error", text: message });
      onError(message);
      return;
    }
    isProcessingRef.current = true;
    setIsProcessing(true);
    setMessage({ type: "info", text: t("Stripe.processing-your-payment") });

    const failWallet = (message: string) => {
      walletEvent?.paymentFailed({ reason: "fail" });
      setMessage({ type: "error", text: message });
      onError(message);
    };

    try {
      if (orderId && bookingData) {
        const updateResponse = await fetch("/api/update-pending-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, bookingData }),
        });

        if (updateResponse.status === 404) {
          failWallet(t("Stripe.payment-session-expired"));
          return;
        }
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        failWallet(submitError.message || t("Stripe.payment-failed"));
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: getReturnUrl(),
        },
        redirect: "if_required",
      });

      if (error) {
        const errorMessage =
          error.type === "card_error" || error.type === "validation_error"
            ? error.message
            : t("Stripe.an-unexpected-error-occurred-please-try-again");

        failWallet(errorMessage || t("Stripe.payment-failed"));
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage({
          type: "success",
          text: t("Stripe.payment-successful-processing-your-booking"),
        });
        setTimeout(() => onSuccess(paymentIntent.id), 1000);
      } else if (paymentIntent && paymentIntent.status === "processing") {
        setMessage({
          type: "info",
          text: t(
            "Stripe.payment-is-processing-you-will-receive-a-confirmation-shortly",
          ),
        });
        setTimeout(() => onSuccess(paymentIntent.id), 1500);
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        setMessage({
          type: "info",
          text: t(
            "Stripe.additional-authentication-required-please-follow-the-prompts",
          ),
        });
      } else {
        failWallet(t("Stripe.payment-status-unclear-please-contact-support"));
      }
    } catch (err) {
      console.error("Payment error:", err);
      failWallet(t("Stripe.an-unexpected-error-occurred-please-try-again"));
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await confirmPayment();
  };

  const handleExpressReady = ({
    availablePaymentMethods,
  }: StripeExpressCheckoutElementReadyEvent) => {
    setWalletsAvailable(!!availablePaymentMethods);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("Stripe.total-amount")}{" "}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {getCurrencySymbol(currency)}
              {amount.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <Shield className="h-4 w-4" />
              {t("Stripe.secure")}{" "}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("Stripe.256-bit-ssl")}
            </p>
          </div>
        </div>
      </div>

      <div className={walletsAvailable ? "block" : "hidden"}>
        <ExpressCheckoutElement
          onConfirm={confirmPayment}
          onReady={handleExpressReady}
          options={{
            emailRequired: true,
            buttonType: {
              applePay: "book",
              googlePay: "book",
            },
            paymentMethods: {
              applePay: "always",
              googlePay: "always",
              link: "auto",
            },
          }}
        />
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              {t("Stripe.or-pay-with-card")}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            {t("Stripe.payment-details")}
          </h3>
        </div>
        <PaymentElement
          onLoadError={(event) => {
            const blockedByClient =
              typeof event.error?.message === "string" &&
              /blocked|network|failed to fetch/i.test(event.error.message);

            const errorMessage = blockedByClient
              ? t("Stripe.payment-form-blocked-by-extension")
              : event.error?.message ||
                t("Stripe.payment-form-failed-to-load");

            setMessage({ type: "error", text: errorMessage });
            onError(errorMessage);
          }}
          options={{
            layout: {
              type: "accordion",
              defaultCollapsed: false,
              radios: true,
              spacedAccordionItems: true,
            },
            wallets: {
              applePay: "never",
              googlePay: "never",
              link: "auto",
            },
            defaultValues: {
              billingDetails: {
                name: bookingData
                  ? `${bookingData.firstName} ${bookingData.lastName}`.trim()
                  : undefined,
                email: bookingData?.email,
                phone: bookingData?.phone,
              },
            },
          }}
        />
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : message.type === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
          }`}
        >
          {message.type === "success" && (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          )}
          {message.type === "error" && (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          {message.type === "info" && (
            <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === "success"
                ? "text-green-800"
                : message.type === "error"
                  ? "text-red-800"
                  : "text-blue-800"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("Stripe.processing-payment")}{" "}
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            {t("Stripe.pay")} {getCurrencySymbol(currency)}
            {amount.toFixed(2)} {t("Stripe.securely")}
          </>
        )}
      </Button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-4 w-4" />
          <span>{t("Stripe.secured-by-stripe")}</span>
        </div>
        <div className="h-4 w-px bg-gray-300"></div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="h-4 w-4" />
          <span>{t("Stripe.pci-dss-compliant")}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {t(
          "Stripe.your-payment-information-is-encrypted-and-secure-we-never-store-your-card-details",
        )}{" "}
      </p>
    </form>
  );
}
