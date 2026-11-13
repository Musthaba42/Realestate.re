import { Readable } from "node:stream";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { mediaBucket, mongoDb } from "@/lib/mongo";
import { r2Get } from "@/lib/r2";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { MediaMeta } from "@/lib/uploads";

// Serves uploaded files from Cloudflare R2 (or MongoDB GridFS for files not yet moved),
// with HTTP Range support so videos can be streamed and seeked (required by Safari / iPhone).
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

  // Requested byte range (inclusive), or null for the whole file.
  let span: { start: number; end: number } | null = null;
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
    span = { start, end };
  }

  let body: ReadableStream | null;
  if (file.metadata?.storage === "r2" && file.metadata.key) {
    const res = await r2Get(file.metadata.key, span ? `bytes=${span.start}-${span.end}` : undefined);
    if (!res.ok) {
      console.error(`R2 read failed for ${file.metadata.key}: ${res.status}`);
      return new Response("Not found", { status: 404 });
    }
    body = res.body;
  } else {
    const bucket = await mediaBucket();
    // GridFS `end` is exclusive.
    const stream = span ? bucket.openDownloadStream(id, { start: span.start, end: span.end + 1 }) : bucket.openDownloadStream(id);
    body = Readable.toWeb(stream) as ReadableStream;
  }

  if (span) {
    return new Response(body, {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${span.start}-${span.end}/${size}`,
        "Content-Length": String(span.end - span.start + 1),
      },
    });
  }
  return new Response(body, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}
