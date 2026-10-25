import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Booking } from "@/features/booking/model";
import { changeAllowed } from "@/features/customers/lib/customer-rides";
import { readCustomerToken } from "@/features/customers/lib/customer-token";
import { connectDB } from "@/shared/db";

const changeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  action: z.enum(["cancel", "change"]),
});

async function emailFromRequest(request: Request) {
  const jar = await cookies();
  return readCustomerToken(new URL(request.url).searchParams.get("token") || jar.get("customer_session")?.value);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = await emailFromRequest(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  await connectDB();
  const { id } = await params;
  const booking = await Booking.findOne({
    $or: [{ tripId: id }, { _id: id }],
    email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!(await changeAllowed(booking))) {
    return NextResponse.json({ error: "cutoff" }, { status: 409 });
  }
  if (parsed.data.action === "cancel") {
    booking.status = "canceled";
    booking.canceledAt = new Date();
  } else {
    if (parsed.data.date) booking.date = parsed.data.date;
    if (parsed.data.time) booking.time = parsed.data.time;
  }
  await booking.save();
  return NextResponse.json({ ok: true, status: booking.status, date: booking.date, time: booking.time });
}
