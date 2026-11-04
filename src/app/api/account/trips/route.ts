import { NextResponse } from "next/server";
import {
  applyCustomerSessionCookie,
  readCustomerSession,
} from "@/features/customers/lib/customer-session";
import { ridesForEmail } from "@/features/customers/lib/customer-rides";
import { connectDB } from "@/shared/db";

export async function GET(request: Request) {
  const session = await readCustomerSession(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const rides = await ridesForEmail(session.email);
  return applyCustomerSessionCookie(
    NextResponse.json({ email: session.email, ...rides }),
    session,
  );
}
