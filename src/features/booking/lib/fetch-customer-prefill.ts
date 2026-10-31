import {
  customerPrefillSchema,
  type CustomerPrefill,
} from "@/features/booking/schema/customer-prefill.schema";

export const ACCOUNT_ME_ENDPOINT = "/api/account/me";

/**
 * Read the signed-in customer silently. A 401 (signed out) or any transport
 * error resolves to null so the booking form stays anonymous.
 */
export async function fetchCustomerPrefill(
  fetcher: typeof fetch = fetch,
): Promise<CustomerPrefill | null> {
  try {
    const response = await fetcher(ACCOUNT_ME_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return null;

    const parsed = customerPrefillSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
