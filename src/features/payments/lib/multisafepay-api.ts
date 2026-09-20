export interface MultisafepayOrderResponse {
  success: boolean;
  data?: {
    order_id?: string;
    transaction_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
  error_info?: string;
}

export function getMultisafepayOrdersApiUrl(testMode: boolean, orderId: string): string {
  const host = testMode ? 'testapi.multisafepay.com' : 'api.multisafepay.com';
  return `https://${host}/v1/json/orders/${encodeURIComponent(orderId)}`;
}

export async function fetchMultisafepayOrder(
  apiKey: string,
  testMode: boolean,
  lookupId: string
): Promise<{ ok: true; data: NonNullable<MultisafepayOrderResponse['data']> } | { ok: false; status?: number; message: string }> {
  const apiUrl = getMultisafepayOrdersApiUrl(testMode, lookupId);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      api_key: apiKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: `Could not verify MultiSafepay order (HTTP ${response.status})`,
    };
  }

  const body = (await response.json()) as MultisafepayOrderResponse;

  if (!body.success || !body.data) {
    return { ok: false, message: body.error_info || 'MultiSafepay API error' };
  }

  return { ok: true, data: body.data };
}
