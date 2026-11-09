import type { CustomerProfile } from "./account-types";

export function displayName(profileName: string | undefined, email: string): string {
  const name = profileName?.trim();
  if (name) return name;
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

/**
 * Two words at most, so a nav plate never runs long or ends in an ellipsis:
 * "Muhammad Umar Siddiqui" → "Muhammad Umar", "Muhammad Umar" stays as is.
 */
export function compactName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ");
}

export function firstName(name: string, fallback: string): string {
  return name.trim().split(/\s+/)[0] || fallback;
}

export function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]!.charAt(0)}${words[words.length - 1]!.charAt(0)}`.toUpperCase();
  }
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (email.trim().slice(0, 2) || "?").toUpperCase();
}

export function savedPlaceCount(profile: CustomerProfile | null): number {
  const addresses = profile?.savedAddresses;
  if (!addresses) return 0;
  return [addresses.home, addresses.work, addresses.airport].filter(
    (place) => Boolean(place?.trim()),
  ).length;
}

/** English reads like the operator's Swiss copy ("Sat, 7 November"), not US order. */
export function dateLocale(locale: string): string {
  return locale === "en" ? "en-GB" : locale;
}
