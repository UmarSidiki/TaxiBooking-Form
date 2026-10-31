import { NextResponse } from "next/server";
import { readCustomerSession } from "@/features/customers/lib/customer-session";
import { ridesForEmail } from "@/features/customers/lib/customer-rides";
import { connectDB } from "@/shared/db";

export async function GET(request: Request) {
  const email = await readCustomerSession(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const rides = await ridesForEmail(email);
  const response = NextResponse.json({ email, ...rides });
  const token = new URL(request.url).searchParams.get("token");
  if (token) {
    response.cookies.set("customer_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return response;
}
