export const notificationLocales = [
  "en",
  "fr",
  "es",
  "de",
  "nl",
  "it",
  "ru",
  "ar",
] as const;

export type NotificationLocale = (typeof notificationLocales)[number];

export function notificationLocale(value?: string | null): NotificationLocale {
  return notificationLocales.includes(value as NotificationLocale)
    ? (value as NotificationLocale)
    : "en";
}


export const notificationAudiences = [
  "customer",
  "desk",
  "driver",
  "partner",
] as const;

export type NotificationAudience = (typeof notificationAudiences)[number];

export const notificationChannels = ["whatsapp", "email"] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

export type NotificationTemplate = { subject?: string; body: string };

export type LocalizedTemplates = Record<NotificationLocale, NotificationTemplate>;

export type NotificationEventDefinition = {
  key: string;
  audiences: readonly NotificationAudience[];
  channels: readonly NotificationChannel[];
  variables: readonly string[];
  templates: LocalizedTemplates;
  /** Subject + intro defaults for the email body component. */
  emailTemplates?: LocalizedTemplates;
  /** Channel-level default when no NotificationSetting row exists. */
  defaultEnabled?: Partial<Record<NotificationChannel, boolean>>;
  timing?: { hoursBefore?: number };
};

export type NotificationRecipient = {
  phone?: string | null;
  email?: string | null;
  name?: string;
  whatsappOptIn?: boolean;
};

export type NotificationContext = {
  locale?: string | null;
  variables?: Record<string, string | number | null | undefined>;
  recipients?: Partial<Record<NotificationAudience, NotificationRecipient[]>>;
  /** Customer email, used to sign the portal link. */
  customerEmail?: string | null;
  baseUrl?: string | null;
  channels?: readonly NotificationChannel[];
  document?: { base64: string; fileName: string };
  /** Idempotency scope for WhatsApp deliveries (e.g. a booking id). */
  bookingId?: string;
};

export type NotificationDelivery = {
  channel: NotificationChannel;
  audience: NotificationAudience;
  to: string;
};

export type NotificationSkipReason =
  | "unknown_event"
  | "disabled"
  | "no_recipients"
  | "not_linked"
  | "quiet_hours";

export type NotificationResult = {
  ok: boolean;
  queued: number;
  skipped: NotificationSkipReason | null;
  deliveries: NotificationDelivery[];
};
