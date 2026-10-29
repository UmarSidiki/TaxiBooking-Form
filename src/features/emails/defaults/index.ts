import { emailCopyKeys } from "@/features/emails/defaults/event-copy";
import { emailTranslator } from "@/features/emails/lib/email-messages";
import ar from "../../../../messages/ar.json";
import de from "../../../../messages/de.json";
import en from "../../../../messages/en.json";
import es from "../../../../messages/es.json";
import fr from "../../../../messages/fr.json";
import it from "../../../../messages/it.json";
import nl from "../../../../messages/nl.json";
import ru from "../../../../messages/ru.json";
import {
  emailLocales,
  emailLocale,
  type EmailEventKey,
  type LocalizedEmailCopy,
} from "@/features/emails/types";

const MESSAGES = { en, fr, es, de, nl, it, ru, ar } as const;

function rawMessage(locale: string, key: string): string {
  const resolved = emailLocale(locale);
  const msgs = (MESSAGES as any)[resolved];
  const value = msgs?.Emails?.[key];
  return typeof value === "string" ? value : key;
}

export function emailDefaults(event: EmailEventKey): LocalizedEmailCopy {
  const keys = emailCopyKeys[event];
  return Object.fromEntries(
    emailLocales.map((locale) => {
      return [locale, { subject: rawMessage(locale, keys.subject), intro: rawMessage(locale, keys.intro) }];
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
