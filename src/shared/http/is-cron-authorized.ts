/** Fail closed: a missing secret never authorizes the cron route. */
export function isCronAuthorized(
  authHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
