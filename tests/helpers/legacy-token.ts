import { createHmac } from "node:crypto";

/** Builds the old 7-day portal token so tests can prove it is no longer accepted. */
export function signLegacyToken(email: string, ttlSeconds = 60 * 60 * 24 * 7) {
  const secret = process.env.NEXTAUTH_SECRET || "";
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = Buffer.from(`${email.trim().toLowerCase()}|${exp}`).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
