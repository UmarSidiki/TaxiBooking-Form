import { existsSync, readFileSync } from "node:fs";

const PORT = process.env.E2E_PORT ?? "3000";
const URI_FILE = PORT === "3000" ? "/tmp/e2e-mongo-uri.txt" : `/tmp/e2e-mongo-uri-${PORT}.txt`;

/** Always use the in-memory server the e2e harness started, never an ambient real URI. */
export function configureE2eDatabase() {
  const uri = existsSync(URI_FILE) ? readFileSync(URI_FILE, "utf8").trim() : "";
  if (!uri) throw new Error("E2E Mongo URI is unavailable");
  process.env.MONGODB_URI = uri;
}

/** Creates a single-use login link through the app and returns its page path with the token fragment. */
export async function seedMagicLink(email: string, locale = "en") {
  configureE2eDatabase();
  const { createMagicLink } = await import("../../src/features/customers/lib/magic-link");
  const url = await createMagicLink(email, {
    baseUrl: "http://127.0.0.1:3000",
    locale,
    purpose: "login",
  });
  if (!url) throw new Error("Could not create an e2e magic link");
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.hash}`;
}
