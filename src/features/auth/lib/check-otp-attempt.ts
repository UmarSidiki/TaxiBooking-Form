import { PasswordReset } from "@/features/auth/model";

/** A 6-digit code dies after this many wrong guesses. */
export const MAX_OTP_ATTEMPTS = 5;

export type OtpCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid_otp" | "too_many_attempts" };

/**
 * Checks one OTP guess for an email and burns the code once the attempt
 * budget is spent, so a 6-digit code can never be brute-forced.
 * The record is looked up by email (not by the code) so a wrong guess always
 * costs an attempt.
 */
export async function checkOtpAttempt(
  email: string,
  otp: string
): Promise<OtpCheck> {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await PasswordReset.findOne({
    email: normalizedEmail,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return { ok: false, reason: "invalid_otp" };

  if ((record.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
    record.isUsed = true;
    await record.save();
    return { ok: false, reason: "too_many_attempts" };
  }

  if (record.otp !== otp.trim()) {
    record.attempts = (record.attempts ?? 0) + 1;
    if (record.attempts >= MAX_OTP_ATTEMPTS) record.isUsed = true;
    await record.save();
    return {
      ok: false,
      reason: record.isUsed ? "too_many_attempts" : "invalid_otp",
    };
  }

  return { ok: true, email: normalizedEmail };
}
