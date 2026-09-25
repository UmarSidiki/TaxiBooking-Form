import { randomBytes, createHash } from "crypto";

export function mintPaymentToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  const hash = hashPaymentToken(token);
  return { token, hash };
}

export function hashPaymentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
