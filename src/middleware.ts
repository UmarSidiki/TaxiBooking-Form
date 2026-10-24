import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/shared/i18n/routing";
import { clientIp } from "@/shared/http/client-ip";
import { memoryLimit } from "@/shared/http/memory-limit";

const intl = createMiddleware(routing);

const SENSITIVE: { prefix: string; bucket: string; limit: number }[] = [
  { prefix: "/api/booking", bucket: "booking", limit: 20 },
  { prefix: "/api/quote", bucket: "quote", limit: 60 },
  { prefix: "/api/account", bucket: "otp", limit: 15 },
  { prefix: "/api/partners/register", bucket: "login", limit: 15 },
  { prefix: "/api/drivers/register", bucket: "login", limit: 15 },
  { prefix: "/api/auth", bucket: "login", limit: 30 },
  { prefix: "/api/agent", bucket: "agent", limit: 60 },
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = SENSITIVE.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (rule) {
    const hit = memoryLimit(`${rule.bucket}:${clientIp(request)}`, rule.limit, 60_000);
    if (!hit.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(hit.retryAfter) } },
      );
    }
    return NextResponse.next();
  }
  return intl(request);
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    "/api/booking",
    "/api/quote",
    "/api/account/:path*",
    "/api/partners/register",
    "/api/drivers/register",
    "/api/auth/:path*",
    "/api/agent/:path*",
  ],
};