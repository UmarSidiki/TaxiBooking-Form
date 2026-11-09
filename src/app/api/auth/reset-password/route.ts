import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/shared/db";
import { User } from "@/features/auth/model";
import { PasswordReset } from "@/features/auth/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { resetPasswordSchema } from "@/features/auth/schema/password-reset.schema";
import { checkOtpAttempt } from "@/features/auth/lib/check-otp-attempt";

export async function POST(request: NextRequest) {
  const limited = await limitSensitive(request, "otp");
  if (limited) return limited;
  try {
    const parsed = await parseJsonBody(request, resetPasswordSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const check = await checkOtpAttempt(parsed.data.email, parsed.data.otp);
    if (!check.ok) {
      return jsonError(check.reason, check.reason === "too_many_attempts" ? 429 : 400);
    }

    const user = await User.findOne({ email: check.email });
    if (!user) {
      return jsonError("not_found", 404);
    }

    user.password = await hash(parsed.data.newPassword, 10);
    await user.save();
    await PasswordReset.updateOne(
      { email: check.email, isUsed: false },
      { $set: { isUsed: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return jsonError("internal_error", 500);
  }
}
