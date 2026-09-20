import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { PasswordReset } from "@/features/auth/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { verifyOtpSchema } from "@/features/auth/schema/password-reset.schema";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, verifyOtpSchema);
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

    return NextResponse.json({ success: true, valid: true });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return jsonError("internal_error", 500);
  }
}
