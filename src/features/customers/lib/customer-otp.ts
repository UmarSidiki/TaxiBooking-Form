import { createHash, randomInt } from "node:crypto";
import { connectDB } from "@/shared/db";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import { notify } from "@/features/notifications/notify";

const TTL_MS = 10 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS = 3;
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${process.env.NEXTAUTH_SECRET || ""}:${email}:${code}`).digest("hex");
}

async function deliverCode(code: string, email: string, phone: string) {
  const recipients = { customer: [{ phone, email, whatsappOptIn: true }] };
  const variables = { code, ttlMinutes: String(TTL_MS / 60000) };

  const whatsapp = await notify("sign_in_otp", {
    variables,
    channels: ["whatsapp"],
    recipients,
  });
  if (whatsapp.deliveries.some((delivery) => delivery.channel === "whatsapp")) {
    return "whatsapp" as const;
  }

  await notify("sign_in_otp", {
    variables,
    channels: ["email"],
    recipients,
  });
  return "email" as const;
}

export async function sendCustomerOtp(emailRaw: string, phoneRaw?: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@")) return { ok: false as const, error: "invalid_body" };
  await connectDB();
  const since = new Date(Date.now() - WINDOW_MS);
  const phone = (phoneRaw || "").replace(/\D/g, "");
  const recent = await CustomerOtp.countDocuments({
    sentAt: { $gte: since },
    $or: [{ email }, ...(phone ? [{ phone }] : [])],
  });
  if (recent >= MAX_SENDS) return { ok: false as const, error: "rate_limited", retryAfter: 900 };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await CustomerOtp.create({
    email,
    phone,
    codeHash: hashCode(email, code),
    expiresAt: new Date(Date.now() + TTL_MS),
    sentAt: new Date(),
  });
  const channel = await deliverCode(code, email, phone);
  return { ok: true as const, channel };
}

export async function verifyCustomerOtp(emailRaw: string, code: string) {
  const email = emailRaw.trim().toLowerCase();
  await connectDB();
  const row = await CustomerOtp.findOne({ email, expiresAt: { $gt: new Date() } }).sort({ sentAt: -1 });
  if (!row) return { ok: false as const, error: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false as const, error: "rate_limited" };
  if (row.codeHash !== hashCode(email, code.trim())) {
    await CustomerOtp.updateOne({ _id: row._id }, { $inc: { attempts: 1 } });
    return { ok: false as const, error: "invalid_code" };
  }
  await CustomerOtp.deleteMany({ email });
  return { ok: true as const, email };
}
