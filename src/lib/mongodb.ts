import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("MONGODB_URI is not set. Define it in your environment.")
}

const options = {}

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = globalThis as GlobalWithMongo

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }

  clientPromise = globalWithMongo._mongoClientPromise
} else {
  const client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

export async function getMongoDb() {
  const client = await clientPromise
  const databaseName = process.env.MONGODB_DB || undefined

  return client.db(databaseName)
}
