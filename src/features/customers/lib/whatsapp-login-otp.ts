import { connectDB } from "@/shared/db";
import { WhatsAppConfig } from "@/features/settings/model";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-send";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import {
  whatsappBudgetMs,
  WHATSAPP_OTP_MAX_DURATION_SECONDS,
} from "@/features/settings/lib/whatsapp-deadline";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { generateOtpCode, hashOtpCode, otpCodeMatches } from "@/features/customers/lib/otp-code";

const TTL_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_PHONE = 5;
const MAX_ATTEMPTS = 5;
const CODE_ROW_FILTER = { codeHash: { $type: "string" } } as const;

export type WhatsAppLoginSendResult =
  | { ok: true; delivery: () => Promise<void> }
  | { ok: false; code: "whatsapp_not_verified" }
  | { ok: false; error: "rate_limited"; retryAfter?: number };

export type WhatsAppLoginVerifyResult =
  | { ok: true; email: string }
  | { ok: false; error: "invalid_code" | "expired" | "rate_limited" };

/** Digits only, so a stored verified phone and a typed number compare exactly. */
async function resolveDigits(phone: string, callingCode?: string) {
  const config = callingCode
    ? null
    : await WhatsAppConfig.findOne()
        .select("defaultCallingCode")
        .lean<{ defaultCallingCode?: string }>();
  return toWhatsAppDigits(phone, callingCode ?? config?.defaultCallingCode ?? "");
}

/** Only a single profile whose verifiedPhone is exactly these digits may sign in. */
async function verifiedEmailForDigits(digits: string) {
  const profiles = await CustomerProfile.find({ verifiedPhone: digits })
    .select("email")
    .limit(2)
    .lean<{ email?: string }[]>();
  if (profiles.length !== 1) return null;
  const email = profiles[0]?.email?.trim().toLowerCase() ?? "";
  return email.includes("@") ? email : null;
}

async function deliverCode(code: string, digits: string, idempotencyKey: string) {
  try {
    await sendWhatsAppTexts(
      [
        {
          jid: toWhatsAppJid(digits),
          text: `Your sign-in code is ${code}. It expires in 10 minutes.`,
        },
      ],
      {
        deadlineMs: whatsappBudgetMs(WHATSAPP_OTP_MAX_DURATION_SECONDS),
        kind: "otp",
        idempotencyKeys: [idempotencyKey],
      },
    );
  } catch {
    // A failed WhatsApp send is silent: this flow never falls back to email.
  }
}

export async function sendWhatsAppLoginOtp(
  phone: string,
  callingCode?: string,
): Promise<WhatsAppLoginSendResult> {
  await connectDB();
  const digits = await resolveDigits(phone, callingCode);
  if (!digits) return { ok: false, code: "whatsapp_not_verified" };

  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const sends = await CustomerOtp.countDocuments({ phone: digits, sentAt: { $gte: since } });
  if (sends >= MAX_SENDS_PER_PHONE) {
    return { ok: false, error: "rate_limited", retryAfter: 3600 };
  }

  const email = await verifiedEmailForDigits(digits);
  if (!email) return { ok: false, code: "whatsapp_not_verified" };

  const live = await CustomerOtp.findOne({
    email,
    consumedAt: null,
    sentAt: { $gte: since },
    ...CODE_ROW_FILTER,
  })
    .sort({ sentAt: -1 })
    .lean<{ attempts?: number }>();
  const code = generateOtpCode();
  const row = await CustomerOtp.create({
    email,
    phone: digits,
    codeHash: hashOtpCode(email, code),
    expiresAt: new Date(Date.now() + TTL_MS),
    attempts: live?.attempts ?? 0,
    sentAt: new Date(),
  });

  return { ok: true, delivery: () => deliverCode(code, digits, String(row._id)) };
}

export async function verifyWhatsAppLoginOtp(
  phone: string,
  code: string,
  callingCode?: string,
): Promise<WhatsAppLoginVerifyResult> {
  await connectDB();
  const digits = await resolveDigits(phone, callingCode);
  if (!digits) return { ok: false, error: "invalid_code" };

  const email = await verifiedEmailForDigits(digits);
  if (!email) return { ok: false, error: "invalid_code" };

  const latest = await CustomerOtp.findOne({
    email,
    phone: digits,
    consumedAt: null,
    ...CODE_ROW_FILTER,
  })
    .sort({ sentAt: -1 })
    .select("_id expiresAt")
    .lean<{ _id: unknown; expiresAt: Date }>();
  if (!latest || latest.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "expired" };
  }

  const row = await CustomerOtp.findOneAndUpdate(
    { _id: latest._id, consumedAt: null, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!row || typeof row.codeHash !== "string") return { ok: false, error: "rate_limited" };
  if (!otpCodeMatches(email, code.trim(), row.codeHash)) {
    return { ok: false, error: "invalid_code" };
  }

  const consumed = await CustomerOtp.findOneAndUpdate(
    { _id: row._id, consumedAt: null },
    { $set: { consumedAt: new Date() } },
    { new: true },
  );
  if (!consumed) return { ok: false, error: "invalid_code" };

  return { ok: true, email };
}
