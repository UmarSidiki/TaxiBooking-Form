import { timingSafeEqual } from "node:crypto";

/** Fail closed: a missing secret never authorizes the cron route. */
export function cronSecretMatches(
  presented: string | null | undefined,
  secret: string | undefined,
): boolean {
  const configured = secret?.trim();
  if (!configured) return false;
  const given = Buffer.from(presented?.trim() ?? "");
  const expected = Buffer.from(configured);
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

/** Query fallbacks for schedulers that cannot send headers. */
const CRON_QUERY_PARAMS = ["key", "secret"] as const;

export function isCronAuthorized(
  req: Request,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  const { searchParams } = new URL(req.url);
  const presented = [
    bearerToken(req.headers.get("authorization")),
    req.headers.get("x-cron-secret"),
    ...CRON_QUERY_PARAMS.map((name) => searchParams.get(name)),
  ];
  let allowed = false;
  for (const value of presented) {
    if (cronSecretMatches(value, secret)) allowed = true;
  }
  return allowed;
}
