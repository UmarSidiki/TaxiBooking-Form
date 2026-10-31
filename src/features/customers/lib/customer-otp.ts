import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { notify } from "@/features/notifications/notify";
import { generateOtpCode, hashOtpCode, otpCodeMatches } from "@/features/customers/lib/otp-code";

export type CustomerOtpChannel = "email" | "whatsapp";

export type SendCustomerOtpResult =
  | { ok: true }
  | { ok: false; error: "invalid_body" | "rate_limited"; retryAfter?: number }
  | { ok: false; code: "no_booking" };

const TTL_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;

async function verifiedPhoneFor(email: string) {
  const profile = await CustomerProfile.findOne({ email })
    .select("verifiedPhone")
    .lean<{ verifiedPhone?: string }>();
  return profile?.verifiedPhone?.trim() || null;
}

async function deliverCode(code: string, email: string, channel: CustomerOtpChannel) {
  const variables = { code, ttlMinutes: String(TTL_MS / 60000) };
  if (channel === "whatsapp") {
    const verifiedPhone = await verifiedPhoneFor(email);
    if (verifiedPhone) {
      const result = await notify("sign_in_otp", {
        variables,
        channels: ["whatsapp"],
        recipients: { customer: [{ phone: verifiedPhone, email, whatsappOptIn: true }] },
      });
      if (result.ok && result.deliveries.some((delivery) => delivery.channel === "whatsapp")) {
        return;
      }
    }
  }
  await notify("sign_in_otp", {
    variables,
    channels: ["email"],
    recipients: { customer: [{ email }] },
  });
}

async function hasBooking(email: string) {
  const booking = await Booking.exists({ email }).collation({ locale: "en", strength: 2 });
  return Boolean(booking);
}

export async function sendCustomerOtp(
  emailRaw: string,
  channel: CustomerOtpChannel = "email",
): Promise<SendCustomerOtpResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, error: "invalid_body" };
  await connectDB();

  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const sends = await CustomerOtp.countDocuments({ email, sentAt: { $gte: since } });
  if (sends >= MAX_SENDS_PER_WINDOW) {
    return { ok: false, error: "rate_limited", retryAfter: 3600 };
  }

  if (!(await hasBooking(email))) return { ok: false, code: "no_booking" };

  const live = await CustomerOtp.findOne({ email, consumedAt: null, sentAt: { $gte: since } })
    .sort({ sentAt: -1 })
    .lean<{ attempts?: number }>();
  const code = generateOtpCode();
  await CustomerOtp.create({
    email,
    codeHash: hashOtpCode(email, code),
    expiresAt: new Date(Date.now() + TTL_MS),
    attempts: live?.attempts ?? 0,
    sentAt: new Date(),
  });

  await deliverCode(code, email, channel);
  return { ok: true as const };
}

export async function verifyCustomerOtp(emailRaw: string, code: string) {
  const email = emailRaw.trim().toLowerCase();
  await connectDB();

  const row = await CustomerOtp.findOne({ email, consumedAt: null }).sort({ sentAt: -1 });
  if (!row || row.expiresAt.getTime() <= Date.now()) return { ok: false as const, error: "expired" };
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) return { ok: false as const, error: "rate_limited" };
  if (!otpCodeMatches(email, code.trim(), row.codeHash)) {
    await CustomerOtp.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
    return { ok: false as const, error: "invalid_code" };
  }

  await CustomerOtp.updateOne({ _id: row._id }, { $set: { consumedAt: new Date() } });
  return { ok: true as const, email };
}
