import { createTranslator } from "next-intl";

import ar from "../../../../messages/ar.json";
import de from "../../../../messages/de.json";
import en from "../../../../messages/en.json";
import es from "../../../../messages/es.json";
import fr from "../../../../messages/fr.json";
import it from "../../../../messages/it.json";
import nl from "../../../../messages/nl.json";
import ru from "../../../../messages/ru.json";
import {
  emailLocale,
  type EmailLocale,
  type EmailTranslator,
} from "@/features/emails/types";

const MESSAGES = { en, fr, es, de, nl, it, ru, ar } as const;

export function emailTranslator(locale?: string | null): EmailTranslator {
  const resolved: EmailLocale = emailLocale(locale);
  return createTranslator({
    locale: resolved,
    messages: MESSAGES[resolved],
    namespace: "Emails",
  }) as EmailTranslator;
}

export function emailDir(locale?: string | null) {
  return emailLocale(locale) === "ar" ? "rtl" : "ltr";
}
