import { NextResponse } from "next/server";
import { z } from "zod";
import RideCharge from "@/features/invoices/model/RideCharge";
import { readRidePayToken } from "@/features/invoices/lib/ride-pay-link";
import { settleRideCharge } from "@/features/invoices/lib/settle-ride-charge";
import { jsonError } from "@/shared/http/json-error";
import { connectDB } from "@/shared/db";

const bodySchema = z.object({ paymentIntentId: z.string().min(3) });
type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const tripId = readRidePayToken((await params).token);
  if (!tripId) return jsonError("not_found", 404);
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_body", 400);
  await connectDB();
  const charge = await RideCharge.findOne({ paymentIntentId: parsed.data.paymentIntentId, tripId });
  if (!charge) return jsonError("not_found", 404);
  const settled = await settleRideCharge({ paymentIntentId: parsed.data.paymentIntentId });
  if (!settled.ok) return jsonError("payment_failed", settled.retryable ? 409 : 400);
  return NextResponse.json({ ok: true });
}
