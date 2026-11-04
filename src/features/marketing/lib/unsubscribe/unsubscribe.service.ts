import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import {
  readUnsubscribeToken,
  type UnsubscribeTokenClaims,
} from "@/features/marketing/lib/unsubscribe/unsubscribe-token";
import type { MarketingChannel } from "@/features/marketing/lib/marketing.constants";

export type UnsubscribeOptions = {
  resubscribe?: boolean;
  ipPrefix?: string;
  nowMs?: number;
};

export type UnsubscribeResult =
  | {
      ok: true;
      email: string;
      channel: MarketingChannel;
      locale: string;
      status: "granted" | "withdrawn";
    }
  | { ok: false; error: "invalid_token" };

/**
 * Public, login-free unsubscribe/resubscribe. The signed token carries both the
 * email and the channel, and is purpose-bound so no other link can drive it.
 */
export async function unsubscribeWithToken(
  token: string | null | undefined,
  options: UnsubscribeOptions = {},
): Promise<UnsubscribeResult> {
  const claims: UnsubscribeTokenClaims | null = readUnsubscribeToken(
    token,
    options.nowMs,
  );
  if (!claims) return { ok: false, error: "invalid_token" };

  const status = options.resubscribe ? "granted" : "withdrawn";
  await applyMarketingConsent({
    email: claims.email,
    channel: claims.channel,
    status,
    source: "unsubscribe_link",
    ipPrefix: options.ipPrefix ?? "",
    reason: options.resubscribe ? "Link opt-in" : "Unsubscribe link",
    campaignId: options.resubscribe ? undefined : claims.campaignId,
  });

  return {
    ok: true,
    email: claims.email,
    channel: claims.channel,
    locale: claims.locale,
    status,
  };
}
