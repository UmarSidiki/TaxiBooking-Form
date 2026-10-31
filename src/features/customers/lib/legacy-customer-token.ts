import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.NEXTAUTH_SECRET || "";
}

/** Reads the email from an old portal link for prefill only. Never authenticates. */
export function legacyCustomerEmail(token: string | null | undefined) {
  if (!token || !secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [email] = Buffer.from(body, "base64url").toString().split("|");
  return email || null;
}
