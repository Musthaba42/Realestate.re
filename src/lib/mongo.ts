import "server-only";
import { GridFSBucket, MongoClient, type Db } from "mongodb";

// Native MongoDB driver — used for file storage (GridFS) and atomic counters.
// Regular data goes through Prisma (src/lib/db.ts). Both use DATABASE_URL.

const globalForMongo = globalThis as unknown as { mongoClient?: Promise<MongoClient> };

function client(): Promise<MongoClient> {
  if (!globalForMongo.mongoClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    globalForMongo.mongoClient = new MongoClient(url).connect();
  }
  return globalForMongo.mongoClient;
}

export async function mongoDb(): Promise<Db> {
  // Uses the database name in DATABASE_URL (e.g. .../goldengroups?...)
  return (await client()).db();
}

export async function mediaBucket(): Promise<GridFSBucket> {
  return new GridFSBucket(await mongoDb(), { bucketName: "media" });
}

/** Atomically increments and returns the next number for a sequence. */
export async function nextSeq(name: "property" | "seller" | "lead", start = 0): Promise<number> {
  const db = await mongoDb();
  const res = await db
    .collection<{ _id: string; seq: number }>("Counter")
    .findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  return start + (res?.seq ?? 1);
}
