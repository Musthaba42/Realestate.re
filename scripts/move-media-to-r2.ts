/* eslint-disable no-console */
// Moves uploaded photos, videos and documents from MongoDB GridFS to Cloudflare R2.
//
//   npm run media:to-r2 -- --dry-run    (only lists what would be moved)
//   npm run media:to-r2
//
// Links (/media/<id>.<ext>) stay the same, so no property needs to change.
// Each file is checked in R2 before its copy in MongoDB is deleted.
// Safe to run again: files already in R2 are skipped.

import { GridFSBucket, MongoClient, type ObjectId } from "mongodb";
import { r2Enabled, r2Put, r2Size } from "../src/lib/r2";

type FileDoc = {
  _id: ObjectId;
  length: number;
  filename: string;
  metadata?: { mime?: string; folder?: string; storage?: string; key?: string };
};

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  if (!dryRun && !r2Enabled()) throw new Error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in .env first.");

  const client = await new MongoClient(process.env.DATABASE_URL).connect();
  try {
    const db = client.db();
    const files = db.collection<FileDoc>("media.files");
    const bucket = new GridFSBucket(db, { bucketName: "media" });
    const todo = await files.find({ "metadata.storage": { $ne: "r2" } }).toArray();
    const total = todo.reduce((n, f) => n + f.length, 0);
    console.log(`${todo.length} file(s) in MongoDB to move (${mb(total)}).${dryRun ? " Dry run: nothing will change." : ""}\n`);

    let moved = 0;
    let movedBytes = 0;
    let failed = 0;
    for (const [i, f] of todo.entries()) {
      const id = f._id.toHexString();
      const mime = f.metadata?.mime ?? "application/octet-stream";
      const ext = /\.([a-z0-9]+)$/i.exec(f.filename)?.[1]?.toLowerCase() ?? EXT_BY_MIME[mime] ?? "bin";
      const key = `${f.metadata?.folder || "misc"}/${id}.${ext}`;
      const label = `[${i + 1}/${todo.length}] ${key} (${mb(f.length)})`;
      if (dryRun) {
        console.log(`  ${label}`);
        continue;
      }
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of bucket.openDownloadStream(f._id)) chunks.push(chunk as Buffer);
        const buf = Buffer.concat(chunks);
        if (buf.length !== f.length) throw new Error(`read ${buf.length} bytes, expected ${f.length}`);

        await r2Put(key, buf, mime);
        const size = await r2Size(key);
        if (size !== f.length) throw new Error(`R2 has ${size ?? "no"} bytes, expected ${f.length}`);

        await files.updateOne({ _id: f._id }, { $set: { "metadata.storage": "r2", "metadata.key": key } });
        await db.collection("media.chunks").deleteMany({ files_id: f._id });
        moved++;
        movedBytes += f.length;
        console.log(`  moved  ${label}`);
      } catch (err) {
        failed++;
        console.error(`  FAILED ${label}: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (!dryRun) {
      console.log(`\nDone: moved ${moved} file(s), ${mb(movedBytes)}.${failed ? ` ${failed} failed (run again to retry).` : ""}`);
    }
    if (failed) process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
