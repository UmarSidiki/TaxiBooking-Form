import { writeFileSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const URI_FILE = "/tmp/vitest-mongo-uri.txt";

let server: MongoMemoryServer;

export async function setup() {
  server = await MongoMemoryServer.create();
  const uri = server.getUri();
  process.env.MONGODB_URI = uri;
  writeFileSync(URI_FILE, uri);
}

export async function teardown() {
  await server.stop();
}
