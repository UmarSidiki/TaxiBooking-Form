import { connectDB } from "@/shared/db";
import {
  WhatsAppConfig,
  WhatsAppDelivery,
  WhatsAppTemplate,
} from "@/features/settings/model";
import type { IWhatsAppConfig } from "@/features/settings/model";
import {
  NOTIFICATION_EVENTS,
  notificationEventKeys,
} from "@/features/notifications/notification-events";
import { isNotificationEnabled } from "@/features/notifications/lib/notification-resolution";
import { listNotificationSettings } from "@/features/notifications/lib/notification-settings";
import {
  notificationLocales,
  type NotificationAudience,
  type NotificationEventDefinition,
  type NotificationLocale,
} from "@/features/notifications/notification-types";
import type {
  RegistryConfig,
  RegistryEventRow,
  RegistryTemplateView,
  WhatsAppRegistryData,
} from "@/features/settings/lib/whatsapp-registry-types";

const CONFIG_FALLBACK: RegistryConfig = {
  enabled: false,
  defaultCallingCode: "",
  notifyNumbers: [],
  companyPhone: "",
  defaultLocale: "en",
  quietHours: { enabled: false, startHour: 22, endHour: 7 },
  requireOptIn: true,
  sendRateLimit: 0,
};

type LegacyTemplate = {
  event: string;
  audience: string;
  locale: string;
  body: string;
};

function configView(config: IWhatsAppConfig | null): RegistryConfig {
  if (!config) return CONFIG_FALLBACK;
  return {
    enabled: config.enabled ?? CONFIG_FALLBACK.enabled,
    defaultCallingCode: config.defaultCallingCode ?? CONFIG_FALLBACK.defaultCallingCode,
    notifyNumbers: config.notifyNumbers ?? [],
    companyPhone: config.companyPhone ?? "",
    defaultLocale: config.defaultLocale ?? CONFIG_FALLBACK.defaultLocale,
    quietHours: {
      enabled: config.quietHours?.enabled ?? false,
      startHour: config.quietHours?.startHour ?? 22,
      endHour: config.quietHours?.endHour ?? 7,
    },
    requireOptIn: config.requireOptIn ?? true,
    sendRateLimit: config.sendRateLimit ?? 0,
  };
}

function templateView(
  definition: NotificationEventDefinition,
  stored: Record<string, { body: string }> | undefined,
  legacy: LegacyTemplate[],
  locale: NotificationLocale,
): RegistryTemplateView {
  const storedExact = stored?.[locale];
  const storedFallback = stored?.en;
  const legacyExact = legacy.find((row) => row.locale === locale);
  const legacyFallback = legacy.find((row) => row.locale === "en");
  const fallback = definition.templates[locale] ?? definition.templates.en;
  return {
    body:
      storedExact?.body ??
      storedFallback?.body ??
      legacyExact?.body ??
      legacyFallback?.body ??
      fallback.body,
    custom: Boolean(storedExact),
  };
}

function emailView(
  definition: NotificationEventDefinition,
  stored: Record<string, { subject?: string; body: string }> | undefined,
  locale: NotificationLocale,
) {
  const fallback =
    definition.emailTemplates?.[locale] ?? definition.emailTemplates?.en;
  const storedExact = stored?.[locale];
  const storedFallback = stored?.en;
  return {
    subject: storedExact?.subject ?? storedFallback?.subject ?? fallback?.subject ?? "",
    body: storedExact?.body ?? storedFallback?.body ?? fallback?.body ?? "",
    custom: Boolean(storedExact),
  };
}

function rowFor(
  definition: NotificationEventDefinition,
  audience: NotificationAudience,
  stored: Record<string, { body: string }> | undefined,
  legacy: LegacyTemplate[],
  storedTiming: number | undefined,
  storedEmail: Record<string, { subject?: string; body: string }> | undefined,
): RegistryEventRow {
  const templates = Object.fromEntries(
    notificationLocales.map((locale) => [locale, templateView(definition, stored, legacy, locale)]),
  ) as RegistryEventRow["templates"];
  const defaults = Object.fromEntries(
    notificationLocales.map((locale) => [
      locale,
      (definition.templates[locale] ?? definition.templates.en).body,
    ]),
  ) as RegistryEventRow["defaults"];
  const fallbackTiming = definition.timing?.hoursBefore;
  const timing =
    fallbackTiming === undefined && storedTiming === undefined
      ? null
      : {
          hoursBefore: storedTiming ?? fallbackTiming ?? 24,
          custom: storedTiming !== undefined,
        };
  const emailTemplates = Object.fromEntries(
    notificationLocales.map((locale) => [locale, emailView(definition, storedEmail, locale)]),
  ) as RegistryEventRow["emailTemplates"];
  const emailDefaults = Object.fromEntries(
    notificationLocales.map((locale) => {
      const fallback =
        definition.emailTemplates?.[locale] ?? definition.emailTemplates?.en;
      return [
        locale,
        { subject: fallback?.subject ?? "", body: fallback?.body ?? "", custom: false },
      ];
    }),
  ) as RegistryEventRow["emailDefaults"];
  return {
    key: definition.key,
    audience,
    channels: definition.channels.map((channel) => ({ channel, enabled: false })),
    variables: [...definition.variables],
    templates,
    defaults,
    emailTemplates,
    emailDefaults,
    timing,
  };
}

export async function loadWhatsAppRegistry(): Promise<WhatsAppRegistryData> {
  await connectDB();
  const [config, settings, legacyRows, deliveries] = await Promise.all([
    WhatsAppConfig.findOne().lean<IWhatsAppConfig>(),
    listNotificationSettings(),
    WhatsAppTemplate.find({ enabled: true }).lean<
      Array<{ event: string; audience: string; locale: string; body: string }>
    >(),
    WhatsAppDelivery.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const events: RegistryEventRow[] = [];
  for (const key of notificationEventKeys) {
    const definition = NOTIFICATION_EVENTS[key];
    for (const audience of definition.audiences) {
      const rows = settings.filter((row) => row.event === key && row.audience === audience);
      const whatsapp = rows.find((row) => row.channel === "whatsapp");
      const email = rows.find((row) => row.channel === "email");
      const legacy = legacyRows.filter(
        (row) => row.event === key && row.audience === audience,
      );
      const entry = rowFor(
        definition,
        audience,
        whatsapp?.templates,
        legacy,
        whatsapp?.timing?.hoursBefore,
        email?.templates,
      );
      await Promise.all(
        definition.channels.map(async (channel) => {
          const enabled = await isNotificationEnabled(key, channel, audience);
          const view = entry.channels.find((item) => item.channel === channel);
          if (view) view.enabled = enabled;
        }),
      );
      events.push(entry);
    }
  }

  return {
    config: configView(config),
    events,
    deliveries: deliveries.map((row) => ({
      _id: String(row._id),
      event: row.event,
      audience: row.audience,
      to: row.to,
      status: row.status,
      createdAt: (row.createdAt ?? new Date()).toISOString(),
    })),
  };
}
