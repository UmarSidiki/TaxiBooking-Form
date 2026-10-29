import { Setting, WhatsAppTemplate } from "@/features/settings/model";
import type { ISetting } from "@/features/settings/model";
import { NOTIFICATION_EVENTS, notificationEvent } from "@/features/notifications/notification-events";
import { getNotificationSetting } from "@/features/notifications/lib/notification-settings";
import {
  notificationLocale,
  type NotificationAudience,
  type NotificationChannel,
  type NotificationLocale,
  type NotificationTemplate,
} from "@/features/notifications/notification-types";

const LEGACY_TOGGLES: Partial<Record<string, keyof ISetting>> = {
  ride_assigned: "whatsappTplAssigned",
  ride_available: "whatsappTplAvailable",
  ride_changed: "whatsappTplChanged",
  ride_cancelled: "whatsappTplChanged",
  pickup_reminder: "whatsappTplReminder",
  partner_settlement: "whatsappTplSettlement",
};

/** Events that used to require an enabled WhatsAppTemplate row before anything was sent. */
const LEGACY_TEMPLATE_EVENTS = new Set([
  "booking_confirmed",
  "driver_assigned",
  "on_the_way",
  "arrived",
  "completed",
]);

export async function isNotificationEnabled(
  eventKey: string,
  channel: NotificationChannel,
  audience: NotificationAudience,
): Promise<boolean> {
  const definition = notificationEvent(eventKey);
  if (!definition) return false;

  const row = await getNotificationSetting(eventKey, channel, audience);
  if (row) return row.enabled;

  if (channel === "whatsapp" && (audience === "customer" || audience === "desk")) {
    if (LEGACY_TEMPLATE_EVENTS.has(eventKey)) {
      const legacy = await WhatsAppTemplate.exists({ event: eventKey, audience, enabled: true });
      return Boolean(legacy);
    }
    return definition.defaultEnabled?.whatsapp ?? false;
  }

  const legacyKey = channel === "whatsapp" ? LEGACY_TOGGLES[eventKey] : undefined;
  if (legacyKey) {
    const settings = await Setting.findOne().select(String(legacyKey)).lean<Partial<ISetting>>();
    return Boolean(settings?.[legacyKey]);
  }

  return definition.defaultEnabled?.[channel] ?? true;
}

async function legacyTemplate(
  eventKey: string,
  channel: NotificationChannel,
  audience: NotificationAudience,
  locale: NotificationLocale,
): Promise<NotificationTemplate | null> {
  if (channel !== "whatsapp" || (audience !== "customer" && audience !== "desk")) {
    return null;
  }
  const rows = await WhatsAppTemplate.find({ event: eventKey, audience, enabled: true }).lean();
  const chosen = rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "en");
  return chosen ? { body: chosen.body } : null;
}

export async function resolveNotificationTemplate(
  eventKey: string,
  channel: NotificationChannel,
  audience: NotificationAudience,
  localeValue?: string | null,
): Promise<NotificationTemplate | null> {
  const definition = notificationEvent(eventKey);
  if (!definition) return null;
  const locale = notificationLocale(localeValue);

  const row = await getNotificationSetting(eventKey, channel, audience);
  const stored = row?.templates[locale] ?? row?.templates.en;
  if (stored) return stored;

  const legacy = await legacyTemplate(eventKey, channel, audience, locale);
  if (legacy) return legacy;

  return definition.templates[locale] ?? definition.templates.en;
}

export async function notificationTiming(eventKey: string): Promise<{ hoursBefore: number }> {
  const definition = notificationEvent(eventKey);
  const fallback = definition?.timing?.hoursBefore ?? 24;
  const rows = await Promise.all(
    definition?.audiences.map((audience) =>
      getNotificationSetting(eventKey, "whatsapp", audience),
    ) ?? [],
  );
  const configured = rows.find((row) => typeof row?.timing?.hoursBefore === "number");
  return { hoursBefore: configured?.timing?.hoursBefore ?? fallback };
}

export function eventTemplate(
  eventKey: string,
  locale: string,
): NotificationTemplate | null {
  const definition = NOTIFICATION_EVENTS[eventKey as keyof typeof NOTIFICATION_EVENTS];
  if (!definition) return null;
  return definition.templates[notificationLocale(locale)] ?? definition.templates.en;
}
