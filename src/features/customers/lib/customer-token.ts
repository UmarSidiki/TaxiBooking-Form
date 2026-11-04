import { createHmac, timingSafeEqual } from "node:crypto";

export type CustomerTokenClaims = {
  /** Locale the link was issued for. */
  l: string;
  /** Subject id (for ride links, the trip id). */
  t: string;
};

export type CustomerTokenPayload = CustomerTokenClaims & {
  /** Purpose tag, e.g. "ride_status". */
  p: string;
  /** Expiry, unix seconds. */
  exp: number;
};

function secret() {
  return process.env.NEXTAUTH_SECRET || "";
}

/** Each purpose gets its own signing key, so tokens cannot be reused across flows. */
function purposeKey(purpose: string) {
  return createHmac("sha256", secret()).update(`purpose:${purpose}`).digest();
}

function signature(purpose: string, body: string) {
  return createHmac("sha256", purposeKey(purpose)).update(body).digest("base64url");
}

export function signCustomerToken(
  purpose: string,
  claims: CustomerTokenClaims,
  ttlSeconds: number,
  nowMs = Date.now(),
): string | null {
  if (!secret()) return null;
  const payload: CustomerTokenPayload = {
    p: purpose,
    l: claims.l,
    t: claims.t,
    exp: Math.floor(nowMs / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(purpose, body)}`;
}

export function readCustomerToken(
  token: string | null | undefined,
  purpose: string,
  nowMs = Date.now(),
): CustomerTokenPayload | null {
  if (!token || !secret()) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;

  const given = Buffer.from(sig);
  const wanted = Buffer.from(signature(purpose, body));
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const { p, l, t, exp } = parsed as Partial<CustomerTokenPayload>;
  if (typeof p !== "string" || p !== purpose) return null;
  if (typeof l !== "string" || !l || typeof t !== "string" || !t) return null;
  if (typeof exp !== "number" || !Number.isInteger(exp) || exp <= Math.floor(nowMs / 1000)) {
    return null;
  }
  return { p, l, t, exp };
}
