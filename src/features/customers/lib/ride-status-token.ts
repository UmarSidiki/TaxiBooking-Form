import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.NEXTAUTH_SECRET || "";
}

export function signRideStatusToken(payload: string, ttlSeconds: number) {
  if (!secret()) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(`${payload}|${exp}`).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readRideStatusTokenPayload(token: string | null | undefined) {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const parts = Buffer.from(body, "base64url").toString().split("|");
  const exp = Number(parts.pop());
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  return parts.join("|");
}
