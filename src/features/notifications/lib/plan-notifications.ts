import { Setting, WhatsAppConfig } from "@/features/settings/model";
import type { IWhatsAppConfig } from "@/features/settings/model";
import { renderWhatsAppTemplate } from "@/features/settings/lib/whatsapp-template-text";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import {
  isNotificationEnabled,
  resolveNotificationTemplate,
} from "@/features/notifications/lib/notification-resolution";
import { getNotificationSetting } from "@/features/notifications/lib/notification-settings";
import { resolveNotificationRecipients } from "@/features/notifications/lib/notification-recipients";
import { notificationUrlVariables } from "@/features/notifications/lib/notification-urls";
import {
  notificationLocale,
  type NotificationAudience,
  type NotificationContext,
  type NotificationEventDefinition,
} from "@/features/notifications/notification-types";
import { emailDefaultCopy } from "@/features/emails/defaults";
import { loadEmailBrand } from "@/features/emails/lib/brand";
import { renderEmail } from "@/features/emails/lib/render-email";
import { buildNotificationEmail } from "@/features/emails/templates/build-notification-email";
import type { EmailEventKey } from "@/features/emails/types";

export type PlannedWhatsApp = {
  audience: NotificationAudience;
  to: string;
  jid: string;
  text: string;
  document?: { base64: string; fileName: string };
};

export type PlannedEmail = {
  audience: NotificationAudience;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

export type NotificationPlan = {
  whatsapp: PlannedWhatsApp[];
  email: PlannedEmail[];
  disabled: boolean;
  quietHours: boolean;
};

function currentHour(timeZone: string) {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(new Date()),
  );
}

function inQuietHours(config: IWhatsAppConfig | null, timeZone: string) {
  const quiet = config?.quietHours;
  if (!quiet?.enabled) return false;
  const start = quiet.startHour ?? 22;
  const end = quiet.endHour ?? 7;
  const hour = currentHour(timeZone);
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

function stringVariables(input?: Record<string, string | number | null | undefined>) {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (value !== null && value !== undefined) values[key] = String(value);
  }
  return values;
}

export async function planNotifications(
  definition: NotificationEventDefinition,
  ctx: NotificationContext,
): Promise<NotificationPlan> {
  const [config, settings] = await Promise.all([
    WhatsAppConfig.findOne().lean<IWhatsAppConfig>(),
    Setting.findOne().select("timezone").lean<{ timezone?: string }>(),
  ]);
  const locale = notificationLocale(ctx.locale ?? config?.defaultLocale);

  const [urls, recipients] = await Promise.all([
    notificationUrlVariables({
      baseUrl: ctx.baseUrl,
      locale,
      tripId: stringVariables(ctx.variables).tripId,
      bookingId: ctx.bookingId,
      customerEmail: ctx.customerEmail,
    }),
    resolveNotificationRecipients(definition.audiences, ctx.recipients),
  ]);

  const variables = { ...urls, ...stringVariables(ctx.variables) };
  const channels = ctx.channels ?? definition.channels;
  const quiet = channels.includes("whatsapp") && inQuietHours(config, settings?.timezone ?? "Europe/Zurich");
  const plan: NotificationPlan = { whatsapp: [], email: [], disabled: true, quietHours: quiet };
  const brand = channels.includes("email") ? await loadEmailBrand() : null;

  for (const channel of channels) {
    for (const audience of definition.audiences) {
      const enabled = await isNotificationEnabled(definition.key, channel, audience);
      if (!enabled) continue;
      plan.disabled = false;
      const template = await resolveNotificationTemplate(definition.key, channel, audience, locale);
      if (!template) continue;
      for (const recipient of recipients[audience] ?? []) {
        const text = renderWhatsAppTemplate(template.body, variables);
        if (channel === "whatsapp") {
          if (quiet || !recipient.phone) continue;
          if (audience === "customer" && config?.requireOptIn !== false && recipient.whatsappOptIn !== true) {
            continue;
          }
          const digits = toWhatsAppDigits(recipient.phone, config?.defaultCallingCode ?? "");
          if (!digits) continue;
          plan.whatsapp.push({ audience, to: digits, jid: toWhatsAppJid(digits), text, document: ctx.document });
          continue;
        }
        if (!recipient.email || !brand) continue;

        const fallback = emailDefaultCopy(
          definition.key as EmailEventKey,
          locale,
          variables,
        );
        const stored = (await getNotificationSetting(definition.key, "email", audience))
          ?.templates;
        const storedTemplate = stored?.[locale] ?? stored?.en;
        const subject = storedTemplate?.subject
          ? renderWhatsAppTemplate(storedTemplate.subject, variables)
          : fallback.subject;
        const intro = storedTemplate?.body
          ? renderWhatsAppTemplate(storedTemplate.body, variables)
          : fallback.intro;
        const manageUrl = audience === "customer" ? variables.portal : null;
        const rendered = await renderEmail(
          buildNotificationEmail({
            event: definition.key as EmailEventKey,
            copy: { subject, intro },
            brand,
            locale,
            variables,
            manageUrl,
          }),
          [variables.payUrl, variables.reviewUrl, variables.statusUrl, manageUrl],
        );

        plan.email.push({
          audience,
          to: recipient.email,
          subject,
          text: rendered.text,
          html: rendered.html,
          attachments: ctx.document
            ? [{
                filename: ctx.document.fileName,
                content: Buffer.from(ctx.document.base64, "base64"),
                contentType: "application/pdf",
              }]
            : undefined,
        });
      }
    }
  }

  return plan;
}
