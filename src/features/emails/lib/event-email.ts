import { isNotificationEnabled, resolveNotificationTemplate } from "@/features/notifications/lib/notification-resolution";
import { notificationEvent } from "@/features/notifications/notification-events";
import type { NotificationAudience } from "@/features/notifications/notification-types";
import { renderWhatsAppTemplate } from "@/features/settings/lib/whatsapp-template-text";
import { emailDefaultCopy } from "@/features/emails/defaults";
import type { EmailCopy, EmailEventKey } from "@/features/emails/types";

function stringValues(values: Record<string, string | number | null | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined) out[key] = String(value);
  }
  return out;
}

/**
 * Resolves the editable subject/intro for an email event. Returns null when the
 * operator has switched the email channel off for that audience.
 */
export async function resolveEventEmail(
  event: EmailEventKey,
  audience: NotificationAudience,
  locale: string,
  values: Record<string, string | number | null | undefined> = {},
): Promise<EmailCopy | null> {
  const definition = notificationEvent(event);
  if (!definition || !definition.channels.includes("email")) return null;
  if (!(await isNotificationEnabled(event, "email", audience))) return null;

  const placeholders = stringValues(values);
  const fallback = emailDefaultCopy(event, locale, placeholders);
  const stored = await resolveNotificationTemplate(event, "email", audience, locale);
  return {
    subject: stored?.subject
      ? renderWhatsAppTemplate(stored.subject, placeholders)
      : fallback.subject,
    intro: stored?.body
      ? renderWhatsAppTemplate(stored.body, placeholders)
      : fallback.intro,
  };
}

export function emailEnabledFor(
  event: EmailEventKey,
  audience: NotificationAudience,
): Promise<boolean> {
  return isNotificationEnabled(event, "email", audience);
}
