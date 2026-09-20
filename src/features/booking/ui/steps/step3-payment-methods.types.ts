import type { useStep3 } from "@/features/booking/hooks/form-steps/useStep3";
import type { useTranslations } from "next-intl";

type Step = ReturnType<typeof useStep3>;

export type Step3PaymentMethodsProps = Pick<
  Step,
  | "stripeConfig"
  | "paymentSettings"
  | "selectedPaymentMethod"
  | "setSelectedPaymentMethod"
  | "clientSecret"
  | "stripeOrderId"
  | "creatingPaymentIntent"
  | "paymentError"
  | "retryStripePayment"
  | "totalPrice"
  | "handleStripePaymentSuccess"
  | "handleStripePaymentError"
  | "handleCashBooking"
  | "handleBankTransferBooking"
  | "handleMultisafepayBooking"
  | "isLoading"
  | "formData"
  | "displaySubtotalAmount"
  | "taxAmount"
  | "enableTax"
  | "taxPercentage"
> & {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
};
