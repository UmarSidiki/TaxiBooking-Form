import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import { rideStatusUrl } from "@/features/customers/lib/ride-status-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

export type NotificationUrlInput = {
  baseUrl?: string | null;
  locale: string;
  tripId?: string | null;
  bookingId?: string | null;
  customerEmail?: string | null;
};

export async function notificationBaseUrl(explicit?: string | null): Promise<string | null> {
  return absoluteHttpBase(explicit ?? (await resolvePublicUrl()));
}

export async function notificationUrlVariables(
  input: NotificationUrlInput,
): Promise<Record<string, string>> {
  const base = await notificationBaseUrl(input.baseUrl);
  if (!base) return {};
  const portalUrl = `${base}/${input.locale}/account`;
  const portal =
    (input.customerEmail
      ? customerPortalUrl(base, input.locale, input.customerEmail)
      : null) ?? portalUrl;
  return {
    portal,
    portalUrl,
    statusUrl: input.tripId ? await rideStatusUrl(input.locale, input.tripId, base) : "",
    reviewUrl:
      input.bookingId
        ? `${base}/${input.locale}/review?bookingId=${encodeURIComponent(input.bookingId)}`
        : "",
  };
}
