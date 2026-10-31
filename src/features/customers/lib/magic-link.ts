import { createHash, randomBytes } from "node:crypto";
import { connectDB } from "@/shared/db";
import { routing } from "@/shared/i18n/routing";
import CustomerLoginToken from "@/features/customers/model/CustomerLoginToken";

export type MagicLinkPurpose = "login" | "email";

/** Login links are short-lived; links sent in transactional email stay usable for a day. */
const TTL_MS: Record<MagicLinkPurpose, number> = {
  login: 15 * 60 * 1000,
  email: 24 * 60 * 60 * 1000,
};

export type MagicLinkOptions = {
  locale: string;
  baseUrl: string | null | undefined;
  purpose?: MagicLinkPurpose;
};

export function magicLinkTtlMs(purpose: MagicLinkPurpose = "login") {
  return TTL_MS[purpose];
}

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
  const purpose = options.purpose ?? "login";
  await connectDB();
  await CustomerLoginToken.create({
    tokenHash: hashToken(token),
    emailLower,
    purpose,
    expiresAt: new Date(now.getTime() + magicLinkTtlMs(purpose)),
    usedAt: null,
  });

  const locale = safeLocale(options.locale);
  return `${base}/${locale}/account/link#t=${encodeURIComponent(token)}`;
}

/** Atomically consumes a magic link token of either purpose. Returns the email only for the winning caller. */
export async function consumeMagicLink(token: string) {
  if (!token || token.length > 128) return null;
  await connectDB();
  const now = new Date();
  const row = await CustomerLoginToken.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      purpose: { $in: ["login", "email"] },
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
