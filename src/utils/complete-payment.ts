export interface CompletePaymentPayload {
  provider: 'stripe' | 'multisafepay';
  /** Required for Stripe */
  paymentIntentId?: string;
  /** MultiSafepay notification / redirect transaction id */
  transactionId?: string;
  /** Merchant order_id from create-multisafepay-order (preferred for MSP API lookup) */
  orderId?: string;
}

export interface CompletePaymentResponse {
  success: boolean;
  retryable?: boolean;
  message?: string;
  tripId?: string;
}

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 2000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls the complete-payment API with retries (handles Vercel/MongoDB cold starts).
 */
export async function completePaymentWithRetry(
  payload: CompletePaymentPayload
): Promise<CompletePaymentResponse> {
  let lastResult: CompletePaymentResponse = {
    success: false,
    message: 'Payment completion failed',
  };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('/api/complete-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CompletePaymentResponse;
      lastResult = data;

      if (data.success) {
        return data;
      }

      if (!data.retryable || attempt === MAX_ATTEMPTS - 1) {
        return data;
      }
    } catch (error) {
      lastResult = {
        success: false,
        retryable: true,
        message: error instanceof Error ? error.message : 'Network error',
      };

      if (attempt === MAX_ATTEMPTS - 1) {
        return lastResult;
      }
    }

    await delay(RETRY_DELAY_MS * (attempt + 1));
  }

  return lastResult;
}
