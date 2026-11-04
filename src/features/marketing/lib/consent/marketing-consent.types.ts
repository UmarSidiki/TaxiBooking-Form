import type {
  MarketingChannel,
  MarketingEventStatus,
  MarketingStatus,
} from "@/features/marketing/lib/marketing.constants";

/** Cached per-channel consent on CustomerProfile.marketing. */
export type MarketingConsentCache = {
  status?: MarketingStatus | null;
  at?: Date | null;
  source?: string | null;
  textVersion?: string | null;
};

export type MarketingProfileDoc = {
  email?: string;
  verifiedPhone?: string | null;
  marketing?: {
    email?: MarketingConsentCache | null;
    whatsapp?: MarketingConsentCache | null;
  } | null;
};

/** API-shaped consent state with ISO dates. */
export type MarketingConsentState = {
  status: MarketingStatus;
  at: string | null;
  source: string;
  textVersion: string;
};

export type MarketingConsentEventRow = {
  id: string;
  channel: MarketingChannel;
  status: MarketingEventStatus;
  source: string;
  textVersion: string;
  at: string;
  reason: string;
};

export type MarketingSnapshot = {
  email: MarketingConsentState;
  whatsapp: MarketingConsentState;
  /** WhatsApp marketing only becomes sendable once the number is verified. */
  whatsappVerified: boolean;
  history: MarketingConsentEventRow[];
};

export function marketingCacheFor(
  profile: MarketingProfileDoc | null | undefined,
  channel: MarketingChannel,
): MarketingConsentCache {
  return profile?.marketing?.[channel] ?? {};
}

export function marketingStatusFromProfile(
  profile: MarketingProfileDoc | null | undefined,
  channel: MarketingChannel,
): MarketingStatus {
  return marketingCacheFor(profile, channel).status ?? "none";
}

export function marketingStateFromCache(
  cache: MarketingConsentCache,
): MarketingConsentState {
  return {
    status: cache.status ?? "none",
    at: cache.at ? new Date(cache.at).toISOString() : null,
    source: cache.source ?? "",
    textVersion: cache.textVersion ?? "",
  };
}
