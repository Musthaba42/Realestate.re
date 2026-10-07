import { Readable } from "node:stream";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { mediaBucket, mongoDb } from "@/lib/mongo";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { MediaMeta } from "@/lib/uploads";

// Serves files stored in MongoDB GridFS, with HTTP Range support so videos can
// be streamed and seeked (required by Safari / iPhone).
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const m = parts.length === 1 ? /^([a-f0-9]{24})\.[a-z0-9]+$/i.exec(parts[0]!) : null;
  if (!m) return new Response("Not found", { status: 404 });
  const id = new ObjectId(m[1]);

  const db = await mongoDb();
  const file = await db
    .collection<{ _id: ObjectId; length: number; metadata?: MediaMeta }>("media.files")
    .findOne({ _id: id });
  if (!file) return new Response("Not found", { status: 404 });

  const isPrivate = Boolean(file.metadata?.private);
  if (isPrivate) {
    const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
    // Owners' private photos and approval documents: the admin only.
    if (session?.role !== "admin") return new Response("Not found", { status: 404 });
  }

  const size = file.length;
  const headers: Record<string, string> = {
    "Content-Type": file.metadata?.mime ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  if (file.metadata?.mime === "application/pdf") headers["Content-Disposition"] = "inline";

  const bucket = await mediaBucket();
  const range = req.headers.get("range");
  if (range) {
    const r = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!r || (r[1] === "" && r[2] === "")) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    let start: number;
    let end: number;
    if (r[1] === "") {
      start = Math.max(0, size - Number(r[2]));
      end = size - 1;
    } else {
      start = Number(r[1]);
      end = r[2] === "" ? size - 1 : Math.min(Number(r[2]), size - 1);
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    // GridFS `end` is exclusive.
    const stream = Readable.toWeb(bucket.openDownloadStream(id, { start, end: end + 1 })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(bucket.openDownloadStream(id)) as ReadableStream;
  return new Response(stream, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}
