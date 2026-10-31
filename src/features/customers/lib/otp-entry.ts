export const OTP_LENGTH = 6;

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function otpChars(value: string): string {
  return value.padEnd(OTP_LENGTH, " ").slice(0, OTP_LENGTH);
}

export function otpDisplayValue(value: string, index: number): string {
  const char = otpChars(value)[index];
  return char && char !== " " ? char : "";
}

export function mergeOtpEntry(
  value: string,
  index: number,
  raw: string,
): { value: string; focusIndex: number } {
  const digits = digitsOnly(raw).slice(0, OTP_LENGTH);
  if (!digits) return { value: otpChars(value), focusIndex: index };

  const chars = otpChars(value).split("");
  const start = Math.min(index, OTP_LENGTH - digits.length);
  for (let offset = 0; offset < digits.length; offset += 1) {
    chars[start + offset] = digits[offset];
  }

  return {
    value: chars.join(""),
    focusIndex: Math.min(start + digits.length, OTP_LENGTH - 1),
  };
}

export function setOtpDigit(value: string, index: number, raw: string): string {
  const chars = otpChars(value).split("");
  const digit = digitsOnly(raw).slice(-1);
  chars[index] = digit || " ";
  return chars.join("");
}

export function otpFocusAfterKey(value: string, index: number, key: string): number {
  const char = otpChars(value)[index];
  if (key === "Backspace" && (!char || char === " ") && index > 0) return index - 1;
  if (key === "ArrowLeft") return Math.max(0, index - 1);
  if (key === "ArrowRight") return Math.min(OTP_LENGTH - 1, index + 1);
  return index;
}

export function compactOtp(value: string): string {
  return digitsOnly(value);
}
