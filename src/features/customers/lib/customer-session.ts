import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/shared/db";
import { clientIp } from "@/shared/http/client-ip";
import CustomerSession from "@/features/customers/model/CustomerSession";
import { readCustomerToken } from "@/features/customers/lib/customer-token";

const IDLE_MS = 30 * 24 * 60 * 60 * 1000;
const ABSOLUTE_MS = 90 * 24 * 60 * 60 * 1000;
const LEGACY_COOKIE = "customer_session";

type SessionRow = {
  _id: unknown;
  emailLower: string;
  createdAt: Date;
};

function usesSecureCookie() {
  return process.env.NODE_ENV === "production" || (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
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

async function touchSession(id: string) {
  await connectDB();
  const now = new Date();
  const row = await CustomerSession.findOne({
    idHash: hashId(id),
    revokedAt: null,
    expiresAt: { $gt: now },
  }).lean<SessionRow | null>();
  if (!row) return null;

  const absoluteEnd = new Date(row.createdAt.getTime() + ABSOLUTE_MS);
  if (now.getTime() >= absoluteEnd.getTime()) return null;

  const idleEnd = new Date(now.getTime() + IDLE_MS);
  await CustomerSession.updateOne(
    { _id: row._id },
    { $set: { lastSeenAt: now, expiresAt: idleEnd < absoluteEnd ? idleEnd : absoluteEnd } },
  );
  return row.emailLower;
}

export async function readCustomerSession(request?: Request) {
  const jar = await cookies();
  const { name } = customerSessionCookie();
  const id = jar.get(name)?.value;
  if (id) return touchSession(id);

  // Legacy HMAC tokens stay readable until M2 removes them.
  const legacy =
    new URL(request?.url ?? "http://local").searchParams.get("token") ||
    jar.get(LEGACY_COOKIE)?.value;
  return readCustomerToken(legacy);
}

export async function revokeCustomerSession() {
  const jar = await cookies();
  const { name } = customerSessionCookie();
  const id = jar.get(name)?.value;
  if (!id) return;
  await connectDB();
  await CustomerSession.updateOne({ idHash: hashId(id) }, { $set: { revokedAt: new Date() } });
}
