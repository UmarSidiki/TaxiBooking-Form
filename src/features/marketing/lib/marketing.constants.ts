/** Marketing consent vocabulary shared by checkout, account, admin and sends. */

export const MARKETING_CHANNELS = ["email", "whatsapp"] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

/** Cached state on CustomerProfile.marketing. Past customers default to "none". */
export const MARKETING_STATUSES = ["none", "granted", "withdrawn"] as const;
export type MarketingStatus = (typeof MARKETING_STATUSES)[number];

export const MARKETING_EVENT_STATUSES = ["granted", "withdrawn"] as const;
export type MarketingEventStatus = (typeof MARKETING_EVENT_STATUSES)[number];

export const MARKETING_SOURCES = [
  "booking_checkbox",
  "checkout_auto",
  "account",
  "admin_offline",
  "unsubscribe_link",
  "whatsapp_stop",
  "import",
] as const;
export type MarketingSource = (typeof MARKETING_SOURCES)[number];

/** Bump when the consent wording changes; every event stores the version. */
export const MARKETING_CONSENT_TEXT_VERSION = "2026-11-01";

/** WhatsApp marketing limits sit on top of the global sender limits. */
export const WHATSAPP_MARKETING_DAILY_CAP = 100;
export const WHATSAPP_MARKETING_PER_TICK = 20;

/** Local operator time. Marketing WhatsApp must never send inside this window. */
export const MARKETING_QUIET_HOURS = { startHour: 20, endHour: 9 } as const;

/** Privacy default: no open pixel, no click redirect until an operator opts in. */
export const MARKETING_OPEN_CLICK_TRACKING = false;

/** Campaigns above this many recipients need the typed confirmation word. */
export const CAMPAIGN_CONFIRM_THRESHOLD = 500;
export const CAMPAIGN_CONFIRM_WORD = "SEND";
