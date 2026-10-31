import { NextResponse } from "next/server";
import {
  customerSessionCookie,
  revokeCustomerSession,
} from "@/features/customers/lib/customer-session";

export async function POST() {
  await revokeCustomerSession();
  const response = NextResponse.json({ ok: true });
  const cookie = customerSessionCookie();
  response.cookies.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
  response.cookies.set("customer_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
