export function resolvePostBookingRedirect(
  settings: { redirectUrl?: string; redirectImmediatelyAfterBooking?: boolean } | null | undefined,
  fallback: string
): string {
  const customRedirect = settings?.redirectUrl;
  const immediate = settings?.redirectImmediatelyAfterBooking;
  return customRedirect && immediate ? customRedirect : fallback;
}
