import { NextResponse } from "next/server";
import {
  consumeMagicLink,
  magicLinkLocale,
} from "@/features/customers/lib/magic-link";
import {
  createCustomerSession,
  customerSessionCookie,
  sessionMeta,
} from "@/features/customers/lib/customer-session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function redirect(request: Request, path: string) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(path, url.origin), 303);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = magicLinkLocale(url.searchParams.get("l"));
  const token = url.searchParams.get("t");
  const consumed = token ? await consumeMagicLink(token) : null;

  if (!consumed) return redirect(request, `/${locale}/account?link=expired`);

  const id = await createCustomerSession(consumed.emailLower, sessionMeta(request));
  const response = redirect(request, `/${locale}/account`);
  const cookie = customerSessionCookie();
  response.cookies.set(cookie.name, id, {
    ...cookie.options,
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
