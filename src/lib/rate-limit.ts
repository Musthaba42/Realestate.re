import "server-only";
import { mongoDb } from "./mongo";

// Rate limiter shared by every server instance: counts are kept in the MongoDB
// collection "rate_limits" (fixed time windows, old windows removed by a TTL index).
// This also works on serverless hosts (Vercel), where in-memory counts reset constantly.
// If the database cannot be reached, it falls back to a per-instance in-memory count.

type Bucket = { _id: string; count: number; expiresAt: Date };

let indexReady: Promise<unknown> | null = null;

async function collection() {
  const db = await mongoDb();
  const col = db.collection<Bucket>("rate_limits");
  indexReady ??= col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((err) => {
    indexReady = null;
    console.error("[rate-limit] could not create TTL index:", err);
  });
  await indexReady;
  return col;
}

/** Returns true when the request is allowed, false when the limit has been reached. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const id = `${key}:${windowMs}:${window}`;
  try {
    const col = await collection();
    const res = await col.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) } },
      { upsert: true, returnDocument: "after" },
    );
    return (res?.count ?? 1) <= limit;
  } catch (err) {
    console.error("[rate-limit] database unavailable, using memory:", err instanceof Error ? err.message : err);
    return memoryLimit(id, limit, (window + 1) * windowMs);
  }
}

const memory = new Map<string, { count: number; expires: number }>();

function memoryLimit(id: string, limit: number, expires: number): boolean {
  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (v.expires <= now) memory.delete(k);
  const entry = memory.get(id) ?? { count: 0, expires };
  entry.count += 1;
  memory.set(id, entry);
  return entry.count <= limit;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
