import { existsSync, readFileSync } from "node:fs";
import { beforeEach } from "vitest";

const URI_FILE = "/tmp/vitest-mongo-uri.txt";

if (!process.env.MONGODB_URI && existsSync(URI_FILE)) {
  process.env.MONGODB_URI = readFileSync(URI_FILE, "utf8").trim();
}

beforeEach(async () => {
  delete process.env.QA_MOCK_WHATSAPP;
  const { resetTestDb } = await import("./helpers/db");
  await resetTestDb();
});
