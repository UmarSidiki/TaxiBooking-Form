import { after, NextResponse } from "next/server";
import { z } from "zod";
import { sendWhatsAppLoginOtp } from "@/features/customers/lib/whatsapp-login-otp";
import { padOtpSend } from "@/features/customers/lib/otp-send-timing";
import { limitSensitive } from "@/shared/http/sensitive-limit";

export const maxDuration = 30;

const sendSchema = z.strictObject({
  phone: z.string().trim().min(1).max(32),
  callingCode: z.string().trim().max(8).optional(),
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
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const startedAt = Date.now();
  const result = await sendWhatsAppLoginOtp(parsed.data.phone, parsed.data.callingCode);
  await padOtpSend(startedAt);

  if (!result.ok) {
    if ("code" in result) return NextResponse.json({ ok: false, code: result.code });
    return NextResponse.json(
      { error: result.error },
      {
        status: 429,
        headers: result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined,
      },
    );
  }

  deferDelivery(result.delivery);
  return NextResponse.json({ ok: true });
}
