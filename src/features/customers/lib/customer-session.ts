import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { clientIp } from "@/shared/http/client-ip";
import CustomerSession from "@/features/customers/model/CustomerSession";

const IDLE_MS = 30 * 24 * 60 * 60 * 1000;
const ABSOLUTE_MS = 90 * 24 * 60 * 60 * 1000;
const SLIDE_MS = 60 * 60 * 1000;
const LEGACY_COOKIE = "customer_session";

type SessionRow = {
  _id: unknown;
  emailLower: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
};

export type CustomerSessionHit = {
  id: string;
  email: string;
  expiresAt: Date;
  slid: boolean;
};

function usesSecureCookie() {
  return process.env.NODE_ENV === "production";
}

export function customerSessionCookie() {
  const secure = usesSecureCookie();
  return {
    name: secure ? "__Host-cs" : "cs",
    options: { httpOnly: true, sameSite: "lax" as const, secure, path: "/" },
  };
}

function hashId(id: string) {
  return createHash("sha256").update(id).digest("hex");
}

export function sessionMeta(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const uaFamily = !ua ? "" : /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
  const ip = clientIp(request);
  const ipPrefix = ip.includes(":") ? ip.split(":").slice(0, 4).join(":") : ip.split(".").slice(0, 2).join(".");
  return { uaFamily, ipPrefix };
}

export async function createCustomerSession(
  email: string,
  meta: { uaFamily?: string; ipPrefix?: string } = {},
) {
  await connectDB();
  const id = randomBytes(32).toString("base64url");
  const now = new Date();
  await CustomerSession.create({
    idHash: hashId(id),
    emailLower: email.trim().toLowerCase(),
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + IDLE_MS),
    uaFamily: meta.uaFamily ?? "",
    ipPrefix: meta.ipPrefix ?? "",
    revokedAt: null,
  });
  return id;
}

async function touchSession(id: string, now = new Date()): Promise<CustomerSessionHit | null> {
  await connectDB();
  const row = await CustomerSession.findOne({
    idHash: hashId(id),
    revokedAt: null,
    expiresAt: { $gt: now },
  }).lean<SessionRow | null>();
  if (!row) return null;

  const absoluteEnd = new Date(row.createdAt.getTime() + ABSOLUTE_MS);
  if (now.getTime() >= absoluteEnd.getTime()) return null;

  const lastSeenAt = row.lastSeenAt ?? row.createdAt;
  if (now.getTime() - lastSeenAt.getTime() < SLIDE_MS) {
    return { id, email: row.emailLower, expiresAt: row.expiresAt, slid: false };
  }

  const idleEnd = new Date(now.getTime() + IDLE_MS);
  const expiresAt = idleEnd < absoluteEnd ? idleEnd : absoluteEnd;
  await CustomerSession.updateOne(
    { _id: row._id },
    { $set: { lastSeenAt: now, expiresAt } },
  );
  return { id, email: row.emailLower, expiresAt, slid: true };
}

async function cookieJar() {
  try {
    return await cookies();
  } catch {
    return null;
  }
}

function cookieFromHeader(request: Request | undefined, name: string) {
  const header = request?.headers.get("cookie");
  if (!header) return null;
  for (const entry of header.split(";")) {
    const index = entry.indexOf("=");
    if (index === -1) continue;
    if (entry.slice(0, index).trim() === name) {
      return decodeURIComponent(entry.slice(index + 1).trim());
    }
  }
  return null;
}

export async function readCustomerSession(request?: Request): Promise<CustomerSessionHit | null> {
  const jar = await cookieJar();
  const { name } = customerSessionCookie();
  if (jar?.get(LEGACY_COOKIE)) {
    try {
      jar.delete(LEGACY_COOKIE);
    } catch {
      // Server Components can read cookies but not mutate them.
    }
  }
  const id = cookieFromHeader(request, name) ?? jar?.get(name)?.value;
  if (!id) return null;
  return touchSession(id);
}

/** Keep the browser cookie alive for as long as the slid database session. */
export function applyCustomerSessionCookie(
  response: NextResponse,
  session: CustomerSessionHit | null,
) {
  if (!session?.slid) return response;
  const cookie = customerSessionCookie();
  const maxAge = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
  response.cookies.set(cookie.name, session.id, { ...cookie.options, maxAge });
  return response;
}

export async function revokeCustomerSession(request?: Request) {
  const { name } = customerSessionCookie();
  const id = cookieFromHeader(request, name) ?? (await cookieJar())?.get(name)?.value;
  if (!id) return;
  await connectDB();
  await CustomerSession.updateOne({ idHash: hashId(id) }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllCustomerSessions(email: string): Promise<number> {
  await connectDB();
  const result = await CustomerSession.updateMany(
    { emailLower: email.trim().toLowerCase(), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  return result.modifiedCount ?? 0;
}

/** Revoke one session only when it belongs to this customer. */
export async function revokeCustomerSessionById(
  email: string,
  sessionId: string,
): Promise<boolean> {
  await connectDB();
  const result = await CustomerSession.updateOne(
    { _id: sessionId, emailLower: email.trim().toLowerCase(), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  return (result.modifiedCount ?? 0) > 0;
}

export function clearCustomerSessionCookie(response: NextResponse) {
  const cookie = customerSessionCookie();
  response.cookies.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
  response.cookies.set(LEGACY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
