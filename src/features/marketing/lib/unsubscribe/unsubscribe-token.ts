import {
  readCustomerToken,
  signCustomerToken,
} from "@/features/customers/lib/customer-token";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

export const UNSUBSCRIBE_TOKEN_PURPOSE = "unsubscribe";
export const UNSUBSCRIBE_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

export type UnsubscribeTokenClaims = {
  email: string;
  channel: MarketingChannel;
  locale: string;
  /** Campaign the link was sent in, so the report can count it directly. */
  campaignId?: string;
};

type TokenBody = { e: string; c: MarketingChannel; k?: string };

export function signUnsubscribeToken(
  claims: UnsubscribeTokenClaims,
  nowMs = Date.now(),
): string | null {
  const email = claims.email.trim().toLowerCase();
  if (!email) return null;
  const body: TokenBody = { e: email, c: claims.channel };
  if (claims.campaignId && /^[a-f0-9]{24}$/i.test(claims.campaignId)) body.k = claims.campaignId;
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return signCustomerToken(
    UNSUBSCRIBE_TOKEN_PURPOSE,
    { l: claims.locale, t: payload },
    UNSUBSCRIBE_TOKEN_TTL_SECONDS,
    nowMs,
  );
}

export function readUnsubscribeToken(
  token: string | null | undefined,
  nowMs = Date.now(),
): UnsubscribeTokenClaims | null {
  const payload = readCustomerToken(token, UNSUBSCRIBE_TOKEN_PURPOSE, nowMs);
  if (!payload) return null;

  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(payload.t, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;

  const { e, c, k } = body as Partial<TokenBody>;
  if (typeof e !== "string" || !e.includes("@")) return null;
  if (c !== "email" && c !== "whatsapp") return null;

  const claims: UnsubscribeTokenClaims = { email: e.trim().toLowerCase(), channel: c, locale: payload.l };
  if (typeof k === "string" && /^[a-f0-9]{24}$/i.test(k)) claims.campaignId = k;
  return claims;
}
