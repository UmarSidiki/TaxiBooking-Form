export interface CompletePaymentPayload {
  provider: 'stripe' | 'multisafepay';
  paymentIntentId?: string;
  transactionId?: string;
  orderId?: string;
}

export interface CompletePaymentResponse {
  success: boolean;
  retryable?: boolean;
  message?: string;
  tripId?: string;
}

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 2500;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storageKey(payload: CompletePaymentPayload): string {
  return (
    payload.orderId ||
    payload.paymentIntentId ||
    payload.transactionId ||
    'unknown'
  );
}

export function markPaymentFinalizedLocally(payload: CompletePaymentPayload) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`payment_finalized_${storageKey(payload)}`, '1');
}

function isPaymentFinalizedLocally(payload: CompletePaymentPayload): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(`payment_finalized_${storageKey(payload)}`) === '1';
}

async function checkPaymentFinalizedOnServer(
  payload: CompletePaymentPayload
): Promise<boolean> {
  const params = new URLSearchParams();
  if (payload.orderId) params.set('tripId', payload.orderId);
  if (payload.paymentIntentId) params.set('paymentIntentId', payload.paymentIntentId);
  if (payload.transactionId) params.set('transactionId', payload.transactionId);

  try {
    const response = await fetch(`/api/payment-status?${params.toString()}`);
    if (!response.ok) return false;
    const data = (await response.json()) as {
      finalized?: boolean;
      emailsComplete?: boolean;
    };
    return Boolean(data.finalized && data.emailsComplete);
  } catch {
    return false;
  }
}

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

    await delay(RETRY_DELAY_MS);
  }

  return lastResult;
}

/**
 * Skips work when payment is already finalized (local cache + lightweight API check).
 * Use this instead of calling completePaymentWithRetry from multiple pages.
 */
export async function ensurePaymentFinalized(
  payload: CompletePaymentPayload
): Promise<CompletePaymentResponse> {
  if (isPaymentFinalizedLocally(payload)) {
    return { success: true, tripId: payload.orderId };
  }

  const alreadyDone = await checkPaymentFinalizedOnServer(payload);
  if (alreadyDone) {
    markPaymentFinalizedLocally(payload);
    return { success: true, tripId: payload.orderId };
  }

  const result = await completePaymentWithRetry(payload);
  if (result.success) {
    markPaymentFinalizedLocally(payload);
  }
  return result;
}
