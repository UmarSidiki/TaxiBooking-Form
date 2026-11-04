import { signCustomerToken, readCustomerToken } from "@/features/customers/lib/customer-token";

export const TRACKING_TOKEN_PURPOSE = "marketing_track";
export const TRACKING_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

export type TrackingTokenClaims = {
  campaignId: string;
  recipientId: string;
  type: "open" | "click";
  url?: string;
};

type TokenBody = { c: string; r: string; k: "open" | "click"; u?: string };

export function signTrackingToken(
  claims: TrackingTokenClaims,
  nowMs = Date.now(),
): string | null {
  const body: TokenBody = { c: claims.campaignId, r: claims.recipientId, k: claims.type };
  if (claims.url) body.u = claims.url;
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return signCustomerToken(
    TRACKING_TOKEN_PURPOSE,
    { l: claims.type, t: payload },
    TRACKING_TOKEN_TTL_SECONDS,
    nowMs,
  );
}

export function readTrackingToken(
  token: string | null | undefined,
  nowMs = Date.now(),
): TrackingTokenClaims | null {
  const payload = readCustomerToken(token, TRACKING_TOKEN_PURPOSE, nowMs);
  if (!payload) return null;
  let body: unknown;
  try {
    body = JSON.parse(Buffer.from(payload.t, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;
  const { c, r, k, u } = body as Partial<TokenBody>;
  if (typeof c !== "string" || !c) return null;
  if (typeof r !== "string") return null;
  if (k !== "open" && k !== "click") return null;
  return {
    campaignId: c,
    recipientId: r,
    type: k,
    url: typeof u === "string" ? u : undefined,
  };
}