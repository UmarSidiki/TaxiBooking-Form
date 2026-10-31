import { createHash, randomBytes } from "node:crypto";
import { connectDB } from "@/shared/db";
import { routing } from "@/shared/i18n/routing";
import CustomerLoginToken from "@/features/customers/model/CustomerLoginToken";

const TTL_MS = 15 * 60 * 1000;

export type MagicLinkOptions = {
  locale: string;
  baseUrl: string | null | undefined;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeLocale(locale: string) {
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
}

export async function createMagicLink(email: string, options: MagicLinkOptions) {
  const emailLower = email.trim().toLowerCase();
  const base = options.baseUrl?.replace(/\/$/, "");
  if (!base || !emailLower) return null;

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await connectDB();
  await CustomerLoginToken.create({
    tokenHash: hashToken(token),
    emailLower,
    purpose: "login",
    expiresAt: new Date(now.getTime() + TTL_MS),
    usedAt: null,
  });

  const locale = safeLocale(options.locale);
  return `${base}/api/account/link?t=${encodeURIComponent(token)}&l=${locale}`;
}

/** Atomically consumes a login token. Returns the email only for the winning caller. */
export async function consumeMagicLink(token: string) {
  if (!token || token.length > 128) return null;
  await connectDB();
  const now = new Date();
  const row = await CustomerLoginToken.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      purpose: "login",
      usedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now } },
    { new: true },
  ).lean<{ emailLower: string } | null>();
  return row ? { emailLower: row.emailLower } : null;
}

export function magicLinkLocale(value: string | null) {
  return value ? safeLocale(value) : routing.defaultLocale;
}
