import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.NEXTAUTH_SECRET || "";
}

export function signCustomerToken(email: string, ttlSeconds = 60 * 60 * 24 * 7) {
  if (!secret()) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(`${email.trim().toLowerCase()}|${exp}`).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readCustomerToken(token: string | null | undefined) {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [email, exp] = Buffer.from(body, "base64url").toString().split("|");
  if (!email || Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return email;
}

export function customerPortalUrl(base: string | null, locale: string, email: string) {
  const token = signCustomerToken(email);
  if (!base || !token) return null;
  return `${base.replace(/\/$/, "")}/${locale}/account?token=${encodeURIComponent(token)}`;
}
