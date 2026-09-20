import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/shared/db";
import { User } from "@/features/auth/model";
import { PasswordReset } from "@/features/auth/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { resetPasswordSchema } from "@/features/auth/schema/password-reset.schema";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, resetPasswordSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const resetRecord = await PasswordReset.findOne({
      email: parsed.data.email.toLowerCase().trim(),
      otp: parsed.data.otp.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    if (!resetRecord) {
      return jsonError("invalid_otp", 400);
    }

    const user = await User.findOne({ email: resetRecord.email });
    if (!user) {
      return jsonError("not_found", 404);
    }

    user.password = await hash(parsed.data.newPassword, 10);
    await user.save();
    resetRecord.isUsed = true;
    await resetRecord.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return jsonError("internal_error", 500);
  }
}
