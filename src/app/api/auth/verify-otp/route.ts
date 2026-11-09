import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { verifyOtpSchema } from "@/features/auth/schema/password-reset.schema";
import { checkOtpAttempt } from "@/features/auth/lib/check-otp-attempt";

export async function POST(request: NextRequest) {
  const limited = await limitSensitive(request, "otp");
  if (limited) return limited;
  try {
    const parsed = await parseJsonBody(request, verifyOtpSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const check = await checkOtpAttempt(parsed.data.email, parsed.data.otp);
    if (!check.ok) {
      return jsonError(check.reason, check.reason === "too_many_attempts" ? 429 : 400);
    }

    return NextResponse.json({ success: true, valid: true });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return jsonError("internal_error", 500);
  }
}
