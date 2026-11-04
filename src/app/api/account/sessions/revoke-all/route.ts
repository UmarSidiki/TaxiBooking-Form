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
  const session = await readCustomerSession(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await revokeAllCustomerSessions(session.email);
  const response = NextResponse.json({ ok: true });
  clearCustomerSessionCookie(response);
  return response;
}
