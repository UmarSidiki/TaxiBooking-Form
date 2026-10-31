import { connectDB } from "@/shared/db";
import { WhatsAppConfig } from "@/features/settings/model";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-send";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import {
  whatsappBudgetMs,
  WHATSAPP_PHONE_MAX_DURATION_SECONDS,
} from "@/features/settings/lib/whatsapp-deadline";
import CustomerPhoneOtp from "@/features/customers/model/CustomerPhoneOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { generateOtpCode, hashOtpCode, otpCodeMatches } from "@/features/customers/lib/otp-code";

const TTL_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS = 5;
const MAX_ATTEMPTS = 5;

export type PhoneVerificationResult =
  | { ok: true; phone: string }
  | { ok: false; error: "invalid_phone" | "rate_limited" | "whatsapp_failed" | "expired" | "invalid_code"; retryAfter?: number };

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

function scopeFor(email: string, phone: string) {
  return `phone:${email}:${phone}`;
}

async function resolveDigits(phone: string, callingCode?: string) {
  const config = callingCode
    ? null
    : await WhatsAppConfig.findOne().select("defaultCallingCode").lean<{ defaultCallingCode?: string }>();
  return toWhatsAppDigits(phone, callingCode ?? config?.defaultCallingCode ?? "");
}

async function deliverOnWhatsApp(digits: string, code: string) {
  const result = await sendWhatsAppTexts(
    [
      { jid: toWhatsAppJid(digits), text: `Your verification code is ${code}. It expires in 10 minutes.` },
    ],
    { deadlineMs: whatsappBudgetMs(WHATSAPP_PHONE_MAX_DURATION_SECONDS) },
  );
  if (!result.ok) return false;
  return result.results.length > 0 && result.results.every((row) => row.ok);
}

export async function requestPhoneVerification(
  emailRaw: string,
  phoneRaw: string,
  callingCode?: string,
): Promise<PhoneVerificationResult> {
  await connectDB();
  const email = emailKey(emailRaw);
  const digits = await resolveDigits(phoneRaw, callingCode);
  if (!digits) return { ok: false, error: "invalid_phone" };

  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const sends = await CustomerPhoneOtp.countDocuments({ email, sentAt: { $gte: since } });
  if (sends >= MAX_SENDS) return { ok: false, error: "rate_limited", retryAfter: 3600 };

  const code = generateOtpCode();
  const row = await CustomerPhoneOtp.create({
    email,
    phone: digits,
    codeHash: hashOtpCode(scopeFor(email, digits), code),
    expiresAt: new Date(Date.now() + TTL_MS),
    sentAt: new Date(),
  });

  if (!(await deliverOnWhatsApp(digits, code))) {
    await CustomerPhoneOtp.updateOne({ _id: row._id }, { $set: { consumedAt: new Date() } });
    return { ok: false, error: "whatsapp_failed" };
  }
  return { ok: true, phone: digits };
}

export async function confirmPhoneVerification(
  emailRaw: string,
  code: string,
): Promise<PhoneVerificationResult> {
  await connectDB();
  const email = emailKey(emailRaw);
  const row = await CustomerPhoneOtp.findOne({ email, consumedAt: null }).sort({ sentAt: -1 });
  if (!row || row.expiresAt.getTime() <= Date.now()) return { ok: false, error: "expired" };
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) return { ok: false, error: "rate_limited" };

  if (!otpCodeMatches(scopeFor(email, row.phone), code.trim(), row.codeHash)) {
    await CustomerPhoneOtp.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
    return { ok: false, error: "invalid_code" };
  }

  await CustomerPhoneOtp.updateOne({ _id: row._id }, { $set: { consumedAt: new Date() } });
  await CustomerProfile.findOneAndUpdate(
    { email },
    { $set: { email, verifiedPhone: row.phone } },
    { upsert: true, new: true },
  );
  return { ok: true, phone: row.phone };
}

export async function removeVerifiedPhone(emailRaw: string) {
  await connectDB();
  await CustomerProfile.updateOne({ email: emailKey(emailRaw) }, { $set: { verifiedPhone: "" } });
}
