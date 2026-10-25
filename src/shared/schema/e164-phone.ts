import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

export function toE164(value: string) {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed?.isValid()) return null;
  return parsed.number;
}

export const e164PhoneSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    const e164 = toE164(value);
    if (!e164) {
      ctx.addIssue({ code: "custom", message: "invalid_phone" });
      return z.NEVER;
    }
    return e164;
  });
