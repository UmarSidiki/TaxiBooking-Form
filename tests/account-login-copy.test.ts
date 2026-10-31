import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;

const REQUIRED_KEYS = [
  "sign-in",
  "sign-in-help",
  "sign-in-note",
  "brand-tagline",
  "brand-fallback",
  "email-address",
  "email-placeholder",
  "send-code",
  "code-title",
  "code-help",
  "code-group-label",
  "code-digit-label",
  "code-expiry",
  "verify-and-sign-in",
  "no-booking",
  "no-rides-kicker",
  "book-a-ride",
  "use-different-email",
  "link-expired",
  "copyright",
] as const;

type AccountMessages = Record<string, string>;

function accountMessages(locale: string): AccountMessages {
  const json = JSON.parse(
    readFileSync(`messages/${locale}.json`, "utf8"),
  ) as { Account?: AccountMessages };
  return json.Account ?? {};
}

describe("account login copy", () => {
  for (const locale of LOCALES) {
    it(`${locale} has every login string`, () => {
      const account = accountMessages(locale);
      const missing = REQUIRED_KEYS.filter(
        (key) => typeof account[key] !== "string" || account[key].trim() === "",
      );

      expect(missing).toEqual([]);
    });

    it(`${locale} keeps the interpolation placeholders`, () => {
      const account = accountMessages(locale);

      expect(account["code-help"]).toContain("{email}");
      expect(account["code-digit-label"]).toContain("{number}");
      expect(account["copyright"]).toContain("{year}");
      expect(account["copyright"]).toContain("{name}");
    });
  }
});
