import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readCustomerToken } from "@/features/customers/lib/customer-token";
import { ridesForEmail } from "@/features/customers/lib/customer-rides";
import { connectDB } from "@/shared/db";

export async function GET(request: Request) {
  const jar = await cookies();
  const token = new URL(request.url).searchParams.get("token") || jar.get("customer_session")?.value;
  const email = readCustomerToken(token);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await connectDB();
  const rides = await ridesForEmail(email);
  const response = NextResponse.json({ email, ...rides });
  if (new URL(request.url).searchParams.get("token")) {
    response.cookies.set("customer_session", token!, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  }
  return response;
}
