import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mongoDb } from "./mongo";

// One-time password-reset links. Only a SHA-256 hash of the token is stored, in the
// MongoDB collection "password_resets"; expired entries are removed by a TTL index.

export const RESET_TTL_MINUTES = 30;

type ResetDoc = { _id: string; userId: string; expiresAt: Date };

let indexReady: Promise<unknown> | null = null;

async function collection() {
  const col = (await mongoDb()).collection<ResetDoc>("password_resets");
  indexReady ??= col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {
    indexReady = null;
  });
  await indexReady;
  return col;
}

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a token for the user (replacing older ones) and returns it. */
export async function createResetToken(userId: string): Promise<string> {
  const col = await collection();
  await col.deleteMany({ userId });
  const token = randomBytes(32).toString("base64url");
  await col.insertOne({ _id: hash(token), userId, expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000) });
  return token;
}

/** The user id for a valid, unexpired token, or null. Does not use it up. */
export async function checkResetToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const doc = await (await collection()).findOne({ _id: hash(token), expiresAt: { $gt: new Date() } });
  return doc?.userId ?? null;
}

/** Uses up the token (and any other open tokens of that user). Returns the user id, or null. */
export async function consumeResetToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const col = await collection();
  const doc = await col.findOneAndDelete({ _id: hash(token), expiresAt: { $gt: new Date() } });
  if (!doc) return null;
  await col.deleteMany({ userId: doc.userId });
  return doc.userId;
}
