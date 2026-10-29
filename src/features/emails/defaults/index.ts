import { emailCopyKeys } from "@/features/emails/defaults/event-copy";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import {
  emailLocales,
  type EmailEventKey,
  type LocalizedEmailCopy,
} from "@/features/emails/types";

export function emailDefaults(event: EmailEventKey): LocalizedEmailCopy {
  const keys = emailCopyKeys[event];
  return Object.fromEntries(
    emailLocales.map((locale) => {
      const t = emailTranslator(locale);
      return [locale, { subject: t(keys.subject), intro: t(keys.intro) }];
    }),
  ) as LocalizedEmailCopy;
}

export function emailDefaultCopy(
  event: EmailEventKey,
  locale: string,
  values: Record<string, string | number> = {},
) {
  const keys = emailCopyKeys[event];
  const t = emailTranslator(locale);
  return { subject: t(keys.subject, values), intro: t(keys.intro, values) };
}
