import { fetchMultisafepayOrder } from "@/features/payments/lib/multisafepay-api";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";

export type MspPaymentStateResult = { ok: true } | { ok: false; message: string };

/**
 * Refuses to overwrite a ride whose existing MultiSafepay order is already
 * paid - the Stripe equivalent is `detachIncompleteQuoteIntent`. Fails open when
 * the order is unknown or MultiSafepay is not configured, matching that helper.
 */
export async function assertMultisafepayNotPaid(
  multisafepayOrderId?: string | null
): Promise<MspPaymentStateResult> {
  if (!multisafepayOrderId) return { ok: true };

  const { settings } = await loadPaymentSettings();
  const apiKey = settings?.multisafepayApiKey;
  if (!apiKey) return { ok: true };

  const result = await fetchMultisafepayOrder(
    apiKey,
    settings?.multisafepayTestMode ?? true,
    multisafepayOrderId
  );
  if (!result.ok) return { ok: true };

  if (result.data.status === "completed") {
    return {
      ok: false,
      message:
        "A MultiSafepay payment has already been completed for this request",
    };
  }

  return { ok: true };
}
