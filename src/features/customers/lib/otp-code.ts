import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

function otpSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to hash customer OTP codes");
  return secret;
}

export function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(scope: string, code: string) {
  return createHmac("sha256", otpSecret()).update(`${scope}:${code}`).digest("hex");
}

export function otpCodeMatches(scope: string, code: string, expectedHash: string) {
  const actual = Buffer.from(hashOtpCode(scope, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
