import { writeFileSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const URI_FILE = "/tmp/vitest-mongo-uri.txt";

let server: MongoMemoryReplSet;

export async function setup() {
  server = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const uri = server.getUri();
  process.env.MONGODB_URI = uri;
  writeFileSync(URI_FILE, uri);
}

export async function teardown() {
  await server.stop();
}
