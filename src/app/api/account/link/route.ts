import { NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeMagicLink,
  magicLinkLocale,
} from "@/features/customers/lib/magic-link";
import {
  createCustomerSession,
  customerSessionCookie,
  sessionMeta,
} from "@/features/customers/lib/customer-session";
import { isSameSiteRequest } from "@/shared/http/same-site";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const linkSchema = z.strictObject({
  token: z.string().trim().min(1).max(128),
});

function redirect(request: Request, path: string) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(path, url.origin), 303);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function failure(code: string, status: number) {
  const response = NextResponse.json({ code }, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Mail scanners prefetch GET links, so this only hands the token to the page fragment. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = magicLinkLocale(url.searchParams.get("l"));
  const token = url.searchParams.get("t");

  if (!token) return redirect(request, `/${locale}/account?link=expired`);
  return redirect(
    request,
    `/${locale}/account/link#t=${encodeURIComponent(token)}`,
  );
}

export async function POST(request: Request) {
  if (!isSameSiteRequest(request)) return failure("forbidden", 403);

  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return failure("invalid", 415);

  const body = await request.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) return failure("expired", 400);

  const consumed = await consumeMagicLink(parsed.data.token);
  if (!consumed) return failure("expired", 400);

  const id = await createCustomerSession(consumed.emailLower, sessionMeta(request));
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  const cookie = customerSessionCookie();
  response.cookies.set(cookie.name, id, {
    ...cookie.options,
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
