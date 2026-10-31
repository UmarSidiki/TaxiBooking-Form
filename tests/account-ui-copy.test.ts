import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const LOCALES = ["en", "fr", "es", "de", "nl", "it", "ru", "ar"] as const;
const UI_DIR = "src/features/customers/ui";
const PROFILE_KEYS = [
  "name",
  "addr-home",
  "addr-work",
  "addr-airport",
  "language",
  "save-profile",
  "whatsapp-opt-in",
  "saving",
] as const;

type AccountMessages = Record<string, string>;

function accountMessages(locale: string): AccountMessages {
  const json = JSON.parse(
    readFileSync(`messages/${locale}.json`, "utf8"),
  ) as { Account?: AccountMessages };
  return json.Account ?? {};
}

function keysUsedByAccountUi(): string[] {
  const keys = new Set<string>();

  for (const file of readdirSync(UI_DIR).filter((name) => /\.(ts|tsx)$/.test(name))) {
    const source = readFileSync(path.join(UI_DIR, file), "utf8");
    for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
      keys.add(match[1]);
    }
  }

  return [...keys].sort();
}

describe("account UI copy", () => {
  const keys = keysUsedByAccountUi();

  it("finds translation keys in the account UI", () => {
    expect(keys.length).toBeGreaterThan(0);
  });

  for (const locale of LOCALES) {
    it(`${locale} has every key used by account UI files`, () => {
      const account = accountMessages(locale);
      const missing = keys.filter(
        (key) => typeof account[key] !== "string" || account[key].trim() === "",
      );

      expect(missing).toEqual([]);
    });
  }

  it("translates the profile labels in Arabic", () => {
    const en = accountMessages("en");
    const ar = accountMessages("ar");
    const untranslated = PROFILE_KEYS.filter((key) => ar[key] === en[key]);

    expect(untranslated).toEqual([]);
  });
});
