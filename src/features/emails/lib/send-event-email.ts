import type { ReactElement } from "react";
import { Setting } from "@/features/settings/model";
import type { ISetting } from "@/features/settings/model";
import type { NotificationAudience } from "@/features/notifications/notification-types";
import { loadEmailBrand } from "@/features/emails/lib/brand";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import { resolveEventEmail } from "@/features/emails/lib/event-email";
import { renderEmail } from "@/features/emails/lib/render-email";
import { emailFrom, sendRenderedEmail } from "@/features/emails/lib/send-email";
import {
  emailLocale,
  type EmailBrand,
  type EmailCopy,
  type EmailEventKey,
  type EmailLocale,
  type EmailTranslator,
} from "@/features/emails/types";

export type PreparedEmail = {
  brand: EmailBrand;
  settings: Partial<ISetting> | null;
  t: EmailTranslator;
  locale: EmailLocale;
  copy: EmailCopy;
};

export async function prepareEventEmail(input: {
  event: EmailEventKey;
  audience: NotificationAudience;
  locale?: string | null;
  values?: Record<string, string | number | null | undefined>;
}): Promise<PreparedEmail | null> {
  const copy = await resolveEventEmail(
    input.event,
    input.audience,
    input.locale ?? "en",
    input.values ?? {},
  );
  if (!copy) return null;
  const [brand, settings] = await Promise.all([
    loadEmailBrand(),
    Setting.findOne().lean<ISetting>(),
  ]);
  return {
    brand,
    settings,
    t: emailTranslator(input.locale),
    locale: emailLocale(input.locale),
    copy,
  };
}

export async function sendPreparedEmail(input: {
  prepared: PreparedEmail;
  to: string | string[];
  element: ReactElement;
  links?: Array<string | null | undefined>;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}) {
  const rendered = await renderEmail(input.element, input.links);
  return sendRenderedEmail({
    to: input.to,
    subject: input.prepared.copy.subject,
    rendered,
    from: emailFrom(input.prepared.settings),
    attachments: input.attachments,
  });
}

/** For security mail that must ignore the notification toggles. */
export async function prepareDirectEmail(locale?: string | null) {
  const [brand, settings] = await Promise.all([
    loadEmailBrand(),
    Setting.findOne().lean<ISetting>(),
  ]);
  return {
    brand,
    settings,
    t: emailTranslator(locale),
    locale: emailLocale(locale),
  };
}
