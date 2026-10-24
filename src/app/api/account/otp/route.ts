import { NextResponse } from "next/server";
import { z } from "zod";
import { sendCustomerOtp, verifyCustomerOtp } from "@/features/customers/lib/customer-otp";
import { signCustomerToken } from "@/features/customers/lib/customer-token";

const emailSchema = z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

const sendSchema = z.object({
  email: emailSchema,
  phone: z.string().trim().max(32).optional(),
});

const verifySchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const verify = verifySchema.safeParse(body);
  if (verify.success) {
    const result = await verifyCustomerOtp(verify.data.email, verify.data.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "rate_limited" ? 429 : 400 });
    }
    const token = signCustomerToken(result.email);
    const response = NextResponse.json({ ok: true });
    if (token) {
      response.cookies.set("customer_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    }
    return response;
  }
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const sent = await sendCustomerOtp(parsed.data.email, parsed.data.phone);
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error },
      { status: sent.error === "rate_limited" ? 429 : 400, headers: sent.retryAfter ? { "Retry-After": String(sent.retryAfter) } : undefined },
    );
  }
  return NextResponse.json({ ok: true, channel: sent.channel });
}
