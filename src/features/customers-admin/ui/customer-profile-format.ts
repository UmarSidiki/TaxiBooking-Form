const PROFILE_STATUS_KEYS = new Set([
  "pending",
  "completed",
  "failed",
  "refunded",
  "requested",
  "awaiting-payment",
  "upcoming",
  "canceled",
]);

export function profileStatusKey(value: string): string | null {
  if (value === "awaiting_payment") return "status-awaiting-payment";
  return PROFILE_STATUS_KEYS.has(value) ? `status-${value}` : null;
}

export function profileConsentKey(value: string): string {
  return value === "granted" || value === "withdrawn" ? value : "none";
}

export function formatProfileDateTime(
  value: string | null,
  locale: string,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatProfileDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

/** Ride dates are operator wall-clock stored as UTC. */
export function formatProfileRide(date: string, time: string, locale: string): string {
  const value = new Date(`${date}T${time || "00:00"}:00Z`);
  if (Number.isNaN(value.getTime())) return `${date} ${time}`.trim();
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

export function profileDisplayName(name: string, email: string): string {
  return name.trim() || email.split("@")[0] || email;
}

export function profileInitials(name: string, email: string): string {
  const source = profileDisplayName(name, email);
  return source.slice(0, 2).toUpperCase();
}

export function formatProfilePhone(digits: string): string {
  const clean = digits.trim();
  if (!clean) return "";
  return clean.startsWith("+") ? clean : `+${clean}`;
}
