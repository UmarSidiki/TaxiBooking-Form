import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { applyCustomerTripAction } from "@/features/customers/lib/apply-customer-trip-action";
import { readCustomerToken } from "@/features/customers/lib/customer-token";

const changeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  action: z.enum(["cancel", "change"]),
  passengers: z.number().int().positive().optional(),
  childSeats: z.number().int().min(0).optional(),
  babySeats: z.number().int().min(0).optional(),
  meetAndGreet: z.boolean().optional(),
});

async function emailFromRequest(request: Request) {
  const jar = await cookies();
  return readCustomerToken(
    new URL(request.url).searchParams.get("token") ||
      jar.get("customer_session")?.value
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await emailFromRequest(request);
  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { id } = await params;
  const result = await applyCustomerTripAction({
    id,
    email,
    action: parsed.data.action,
    date: parsed.data.date,
    time: parsed.data.time,
    passengers: parsed.data.passengers,
    childSeats: parsed.data.childSeats,
    babySeats: parsed.data.babySeats,
    meetAndGreet: parsed.data.meetAndGreet,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, ...(result.reason ? { reason: result.reason } : {}) },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    date: result.date,
    time: result.time,
    totalAmount: result.totalAmount,
    payUrl: result.payUrl,
    refundRequestId: result.refundRequestId,
    fee: result.fee,
    refundAmount: result.refundAmount,
  });
}
