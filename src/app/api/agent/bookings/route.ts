import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiKey } from "@/features/agent-api/lib/api-key";
import { createCashBooking } from "@/features/booking/lib/create-cash-booking.service";
import { parseCashBookingInput } from "@/features/booking/schema/cash-booking.schema";

const bodySchema = z.object({}).passthrough();

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 429 ? "rate_limited" : "unauthorized" },
      { status: auth.status, headers: auth.status === 429 ? { "Retry-After": "60" } : undefined },
    );
  }
  const raw = bodySchema.safeParse(await request.json().catch(() => null));
  if (!raw.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const parsed = parseCashBookingInput({ ...raw.data, paymentMethod: "cash" });
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const created = await createCashBooking(parsed.data);
  if (!created.ok) return NextResponse.json({ error: created.message }, { status: created.status });
  return NextResponse.json({ tripId: created.tripId, totalAmount: created.totalAmount }, { status: 201 });
}
