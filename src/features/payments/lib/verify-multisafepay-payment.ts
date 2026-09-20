import type {
  UnverifiedPayment,
  VerifiedPayment,
} from '@/lib/payments/finalize-paid-booking.types';
import { loadPaymentSettings } from '@/lib/payments/load-payment-settings';
import { fetchMultisafepayOrder } from '@/lib/payments/multisafepay-api';
import type { MultisafepayOrderResponse } from '@/lib/payments/multisafepay-api';

const DEFAULT_CURRENCY = 'EUR';
const CENTS_PER_UNIT = 100;

export async function verifyMultisafepayPayment(
  transactionId?: string,
  orderIdHint?: string
): Promise<VerifiedPayment | UnverifiedPayment> {
  const { settings } = await loadPaymentSettings();
  const multisafepayApiKey = settings?.multisafepayApiKey;

  if (!multisafepayApiKey) {
    return { ok: false, message: 'MultiSafepay is not configured' };
  }

  if (!transactionId && !orderIdHint) {
    return { ok: false, message: 'Missing transaction or order ID' };
  }

  const multisafepayTestMode = settings?.multisafepayTestMode ?? true;

  const lookupCandidates = [
    ...(orderIdHint ? [orderIdHint] : []),
    ...(transactionId && transactionId !== orderIdHint ? [transactionId] : []),
  ];

  let orderData: NonNullable<MultisafepayOrderResponse['data']> | undefined;

  for (const lookupId of lookupCandidates) {
    const result = await fetchMultisafepayOrder(
      multisafepayApiKey,
      multisafepayTestMode,
      lookupId
    );
    if (result.ok) {
      orderData = result.data;
      break;
    }
  }

  if (!orderData) {
    return {
      ok: false,
      message: 'Could not verify MultiSafepay order',
      retryable: true,
    };
  }

  if (orderData.status !== 'completed') {
    return {
      ok: false,
      message: `Payment not completed (status: ${orderData.status})`,
      retryable: true,
    };
  }

  const merchantOrderId = orderData.order_id;
  if (!merchantOrderId) {
    return { ok: false, message: 'MultiSafepay response missing order_id' };
  }

  return {
    ok: true,
    orderId: merchantOrderId,
    transactionId:
      orderData.transaction_id ||
      transactionId ||
      orderIdHint ||
      merchantOrderId,
    paidAmount: orderData.amount ? orderData.amount / CENTS_PER_UNIT : 0,
    currency:
      orderData.currency?.toUpperCase() ||
      settings?.stripeCurrency?.toUpperCase() ||
      DEFAULT_CURRENCY,
  };
}
