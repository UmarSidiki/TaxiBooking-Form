export const ACCOUNT_SECTIONS = [
  "overview",
  "rides",
  "profile",
  "notifications",
  "security",
] as const;

export type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

export function isAccountSubSection(value: string): value is Exclude<AccountSection, "overview"> {
  return value !== "overview" && (ACCOUNT_SECTIONS as readonly string[]).includes(value);
}

/** Locale-prefixed URL of an account sub-page; the overview lives at /account. */
export function accountHref(locale: string, section: AccountSection, hash = "") {
  const base = section === "overview" ? `/${locale}/account` : `/${locale}/account/${section}`;
  return hash ? `${base}#${hash}` : base;
}
