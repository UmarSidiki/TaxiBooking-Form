import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { User } from "@/features/auth/model";
import { PasswordReset } from "@/features/auth/model";
import { sendPasswordResetOTP } from "@/features/auth/email/password-reset-otp";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { requestResetSchema } from "@/features/auth/schema/password-reset.schema";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, requestResetSchema);
    if (!parsed.ok) return parsed.response;
    const email = parsed.data.email.toLowerCase().trim();

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return jsonError("not_found", 404);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await PasswordReset.deleteMany({ email: user.email, isUsed: false });
    await PasswordReset.create({
      email: user.email,
      otp,
      expiresAt,
      isUsed: false,
    });

    const emailSent = await sendPasswordResetOTP({
      email: user.email,
      otp,
      name: user.name,
    });
    if (!emailSent) {
      return jsonError("smtp_failed", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("request-reset failed:", error);
    return jsonError("internal_error", 500);
  }
}
