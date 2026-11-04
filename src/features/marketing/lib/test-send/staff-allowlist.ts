export type RecipientKind = "email" | "phone";

export type NormalisedRecipient = {
  kind: RecipientKind;
  key: string;
};

const MIN_PHONE_DIGITS = 6;

/** Emails compare lowercased; phone numbers compare as digits only. */
export function normaliseRecipient(
  value: string,
): NormalisedRecipient | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    return email.length >= 5 ? { kind: "email", key: email } : null;
  }

  const digits = trimmed.replace(/[^0-9]/g, "");
  return digits.length >= MIN_PHONE_DIGITS ? { kind: "phone", key: digits } : null;
}

export function parseTestRecipients(values: string[] | undefined): NormalisedRecipient[] {
  const seen = new Set<string>();
  const recipients: NormalisedRecipient[] = [];
  for (const value of values ?? []) {
    const normalised = normaliseRecipient(value);
    if (!normalised) continue;
    const id = `${normalised.kind}:${normalised.key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    recipients.push(normalised);
  }
  return recipients;
}

/** Test sends may only reach the operator's own staff allowlist. */
export function isAllowedTestRecipient(
  recipient: string,
  allowlist: string[] | undefined,
): NormalisedRecipient | null {
  const wanted = normaliseRecipient(recipient);
  if (!wanted) return null;
  const allowed = parseTestRecipients(allowlist);
  return allowed.some(
    (entry) => entry.kind === wanted.kind && entry.key === wanted.key,
  )
    ? wanted
    : null;
}
