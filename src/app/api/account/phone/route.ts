import { NextResponse } from "next/server";
import { z } from "zod";
import { readCustomerSession } from "@/features/customers/lib/customer-session";
import {
  confirmPhoneVerification,
  removeVerifiedPhone,
  requestPhoneVerification,
} from "@/features/customers/lib/customer-phone-verification";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { WHATSAPP_PHONE_MAX_DURATION_SECONDS } from "@/features/settings/lib/whatsapp-deadline";

export const maxDuration = WHATSAPP_PHONE_MAX_DURATION_SECONDS;

const phoneSchema = z.strictObject({
  phone: z.string().trim().min(1).max(32),
  callingCode: z.string().trim().max(8).optional(),
});

const codeSchema = z.strictObject({
  code: z.string().trim().regex(/^\d{6}$/),
});

async function emailFromRequest(request: Request) {
  return readCustomerSession(request);
}

export async function POST(request: Request) {
  const limited = await limitSensitive(request, "otp");
  if (limited) return limited;

  const email = await emailFromRequest(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);

  const verification = codeSchema.safeParse(body);
  if (verification.success) {
    const result = await confirmPhoneVerification(email, verification.data.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "rate_limited" ? 429 : 400 });
    }
    return NextResponse.json({ ok: true, phone: result.phone });
  }

  const phone = phoneSchema.safeParse(body);
  if (!phone.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const result = await requestPhoneVerification(email, phone.data.phone, phone.data.callingCode);
  if (!result.ok) {
    const status = result.error === "rate_limited" ? 429 : result.error === "whatsapp_failed" ? 502 : 400;
    return NextResponse.json(
      { error: result.error },
      {
        status,
        headers: result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined,
      },
    );
  }
  return NextResponse.json({ ok: true, phone: result.phone });
}

export async function DELETE(request: Request) {
  const email = await emailFromRequest(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await removeVerifiedPhone(email);
  return NextResponse.json({ ok: true });
}
