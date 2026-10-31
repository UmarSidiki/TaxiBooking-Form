import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import mongoose from "mongoose";
import CustomerLoginToken from "../../src/features/customers/model/CustomerLoginToken";

const URI_FILE = "/tmp/e2e-mongo-uri.txt";
const TTL_MS = 15 * 60 * 1000;

async function connect() {
  if (mongoose.connection.readyState === 1) return;
  const fromEnv = process.env.MONGODB_URI;
  const uri = fromEnv ?? (existsSync(URI_FILE) ? readFileSync(URI_FILE, "utf8").trim() : "");
  if (!uri) throw new Error("E2E Mongo URI is unavailable");
  await mongoose.connect(uri);
}

/** Seeds a single-use login token and returns the page URL that carries it in the fragment. */
export async function seedLoginToken(email: string, locale = "en") {
  await connect();
  const token = randomBytes(32).toString("base64url");
  await CustomerLoginToken.create({
    tokenHash: createHash("sha256").update(token).digest("hex"),
    emailLower: email.trim().toLowerCase(),
    purpose: "login",
    expiresAt: new Date(Date.now() + TTL_MS),
    usedAt: null,
  });
  return `/${locale}/account/link#t=${encodeURIComponent(token)}`;
}
