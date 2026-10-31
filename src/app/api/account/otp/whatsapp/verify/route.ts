import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyWhatsAppLoginOtp } from "@/features/customers/lib/whatsapp-login-otp";
import {
  createCustomerSession,
  customerSessionCookie,
  sessionMeta,
} from "@/features/customers/lib/customer-session";
import { limitSensitive } from "@/shared/http/sensitive-limit";

export const maxDuration = 30;

const verifySchema = z.strictObject({
  phone: z.string().trim().min(1).max(32),
  code: z.string().trim().regex(/^\d{6}$/),
  callingCode: z.string().trim().max(8).optional(),
});

export async function POST(request: Request) {
  const limited = await limitSensitive(request, "otp");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const result = await verifyWhatsAppLoginOtp(
    parsed.data.phone,
    parsed.data.code,
    parsed.data.callingCode,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "rate_limited" ? 429 : 400 },
    );
  }

  const id = await createCustomerSession(result.email, sessionMeta(request));
  const cookie = customerSessionCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, id, {
    ...cookie.options,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
