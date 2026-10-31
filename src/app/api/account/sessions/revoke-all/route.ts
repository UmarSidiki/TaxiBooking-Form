import { NextResponse } from "next/server";
import { isSameSiteRequest } from "@/shared/http/same-site";
import {
  clearCustomerSessionCookie,
  readCustomerSession,
  revokeAllCustomerSessions,
} from "@/features/customers/lib/customer-session";

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const email = await readCustomerSession(request);
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await revokeAllCustomerSessions(email);
  const response = NextResponse.json({ ok: true });
  clearCustomerSessionCookie(response);
  return response;
}
