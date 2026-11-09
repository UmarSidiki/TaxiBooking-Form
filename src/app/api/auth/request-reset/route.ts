import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { User } from "@/features/auth/model";
import { PasswordReset } from "@/features/auth/model";
import { sendPasswordResetOTP } from "@/features/auth/email/password-reset-otp";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { requestResetSchema } from "@/features/auth/schema/password-reset.schema";

/** Seconds a caller must wait between codes for the same address. */
const RESEND_COOLDOWN_SECONDS = 60;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Always answers `{ success: true }`, whether or not the address belongs to an
 * account, so the endpoint cannot be used to discover registered emails.
 */
export async function POST(request: NextRequest) {
  const limited = await limitSensitive(request, "otp");
  if (limited) return limited;
  try {
    const parsed = await parseJsonBody(request, requestResetSchema);
    if (!parsed.ok) return parsed.response;
    const email = parsed.data.email.toLowerCase().trim();

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: true });

    const recent = await PasswordReset.findOne({
      email: user.email,
      createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
    });
    if (recent) return NextResponse.json({ success: true });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await PasswordReset.deleteMany({ email: user.email, isUsed: false });
    await PasswordReset.create({
      email: user.email,
      otp,
      expiresAt,
      isUsed: false,
      attempts: 0,
    });

    const emailSent = await sendPasswordResetOTP({
      email: user.email,
      otp,
      name: user.name,
    });
    if (!emailSent) {
      // Stay silent to the caller; the operator sees it in the logs.
      console.error("request-reset: could not send reset email for", user.email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("request-reset failed:", error);
    return jsonError("internal_error", 500);
  }
}
