import { timingSafeEqual } from "node:crypto";

/** Fail closed: a missing secret never authorizes the cron route. */
export function cronSecretMatches(
  presented: string | null | undefined,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  const given = Buffer.from(presented ?? "");
  const expected = Buffer.from(secret);
  if (given.length !== expected.length) {
    timingSafeEqual(given, given);
    return false;
  }
  return timingSafeEqual(given, expected);
}

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

export function isCronAuthorized(
  req: Request,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  const presented = [
    bearerToken(req.headers.get("authorization")),
    req.headers.get("x-cron-secret"),
    new URL(req.url).searchParams.get("key"),
  ];
  let allowed = false;
  for (const value of presented) {
    if (cronSecretMatches(value, secret)) allowed = true;
  }
  return allowed;
}
