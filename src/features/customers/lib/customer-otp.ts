import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { deliverCustomerCode } from "@/features/customers/lib/deliver-customer-code";
import { generateOtpCode, hashOtpCode, otpCodeMatches } from "@/features/customers/lib/otp-code";

export type CustomerOtpChannel = "email" | "whatsapp";

export type CustomerOtpDelivery = () => Promise<void>;

export type SendCustomerOtpResult =
  | { ok: true; delivery: CustomerOtpDelivery }
  | { ok: false; error: "invalid_body" | "rate_limited"; retryAfter?: number }
  | { ok: false; code: "no_booking" };

const TTL_MS = 10 * 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;
const CODE_ROW_FILTER = { codeHash: { $type: "string" } } as const;

async function verifiedPhoneFor(email: string) {
  const profile = await CustomerProfile.findOne({ email })
    .select("verifiedPhone")
    .lean<{ verifiedPhone?: string }>();
  return profile?.verifiedPhone?.trim() || null;
}

async function deliverCode(
  code: string,
  email: string,
  channel: CustomerOtpChannel,
  idempotencyKey: string,
) {
  const verifiedPhone = channel === "whatsapp" ? await verifiedPhoneFor(email) : null;
  await deliverCustomerCode({ email, code, verifiedPhone, idempotencyKey });
}

async function hasBooking(email: string) {
  const booking = await Booking.exists({ email }).collation({ locale: "en", strength: 2 });
  return Boolean(booking);
}

/** Count a no_booking probe as a send so one email cannot be probed across many IPs. */
async function recordProbe(email: string) {
  await CustomerOtp.create({
    email,
    expiresAt: new Date(Date.now() + TTL_MS),
    sentAt: new Date(),
  });
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

  if (!(await hasBooking(email))) {
    await recordProbe(email);
    return { ok: false, code: "no_booking" };
  }

  const live = await CustomerOtp.findOne({ email, consumedAt: null, sentAt: { $gte: since }, ...CODE_ROW_FILTER })
    .sort({ sentAt: -1 })
    .lean<{ attempts?: number }>();
  const code = generateOtpCode();
  const row = await CustomerOtp.create({
    email,
    codeHash: hashOtpCode(email, code),
    expiresAt: new Date(Date.now() + TTL_MS),
    attempts: live?.attempts ?? 0,
    sentAt: new Date(),
  });

  return {
    ok: true as const,
    delivery: () => deliverCode(code, email, channel, String(row._id)),
  };
}

export async function verifyCustomerOtp(emailRaw: string, code: string) {
  const email = emailRaw.trim().toLowerCase();
  await connectDB();

  const latest = await CustomerOtp.findOne({ email, consumedAt: null, ...CODE_ROW_FILTER })
    .sort({ sentAt: -1 })
    .select("_id expiresAt")
    .lean<{ _id: unknown; expiresAt: Date }>();
  if (!latest || latest.expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, error: "expired" };
  }

  const row = await CustomerOtp.findOneAndUpdate(
    { _id: latest._id, consumedAt: null, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!row || typeof row.codeHash !== "string") {
    return { ok: false as const, error: "rate_limited" };
  }
  if (!otpCodeMatches(email, code.trim(), row.codeHash)) {
    return { ok: false as const, error: "invalid_code" };
  }

  const consumed = await CustomerOtp.findOneAndUpdate(
    { _id: row._id, consumedAt: null },
    { $set: { consumedAt: new Date() } },
    { new: true },
  );
  if (!consumed) return { ok: false as const, error: "invalid_code" };

  return { ok: true as const, email };
}
