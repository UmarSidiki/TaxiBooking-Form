import { after, NextResponse } from "next/server";
import { z } from "zod";
import { sendCustomerOtp, verifyCustomerOtp } from "@/features/customers/lib/customer-otp";
import { padOtpSend } from "@/features/customers/lib/otp-send-timing";
import {
  createCustomerSession,
  customerSessionCookie,
  sessionMeta,
} from "@/features/customers/lib/customer-session";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { WHATSAPP_OTP_MAX_DURATION_SECONDS } from "@/features/settings/lib/whatsapp-deadline";

export const maxDuration = WHATSAPP_OTP_MAX_DURATION_SECONDS;

const emailSchema = z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

const sendSchema = z.strictObject({
  email: emailSchema,
  channel: z.enum(["email", "whatsapp"]).optional(),
});

const verifySchema = z.strictObject({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/),
});

/** Run delivery after the response; tests have no request scope for `after`. */
function deferDelivery(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task().catch(() => undefined);
  }
}

export async function POST(request: Request) {
  const limited = await limitSensitive(request, "otp");
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const verify = verifySchema.safeParse(body);
  if (verify.success) {
    const result = await verifyCustomerOtp(verify.data.email, verify.data.code);
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

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const startedAt = Date.now();
  const sent = await sendCustomerOtp(parsed.data.email, parsed.data.channel);
  await padOtpSend(startedAt);

  if (!sent.ok) {
    if ("code" in sent) return NextResponse.json({ ok: false, code: sent.code });
    return NextResponse.json(
      { error: sent.error },
      {
        status: sent.error === "rate_limited" ? 429 : 400,
        headers: sent.retryAfter ? { "Retry-After": String(sent.retryAfter) } : undefined,
      },
    );
  }
  deferDelivery(sent.delivery);
  return NextResponse.json({ ok: true });
}
