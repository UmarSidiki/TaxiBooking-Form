import { NextResponse } from "next/server";
import { isSameSiteRequest } from "@/shared/http/same-site";
import {
  clearCustomerSessionCookie,
  revokeCustomerSession,
} from "@/features/customers/lib/customer-session";

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await revokeCustomerSession(request);
  const response = NextResponse.json({ ok: true });
  clearCustomerSessionCookie(response);
  return response;
}
