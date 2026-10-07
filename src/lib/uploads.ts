import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { mediaBucket, mongoDb } from "./mongo";

// Files are stored in MongoDB (GridFS bucket "media") and served by /media/<id>.<ext>.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_DOC_BYTES = 15 * 1024 * 1024; // 15 MB

export type FileKind = "image" | "video" | "pdf";
type Detected = { kind: FileKind; ext: string; mime: string };

export type MediaMeta = { kind: FileKind; mime: string; private: boolean; folder: string };

/** Detect file type from its first bytes — never trust the browser's MIME type. */
export function detectFileType(buf: Buffer): Detected | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: "image", ext: "jpg", mime: "image/jpeg" };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return { kind: "image", ext: "png", mime: "image/png" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { kind: "image", ext: "webp", mime: "image/webp" };
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "qt  ") return { kind: "video", ext: "mov", mime: "video/quicktime" };
    if (/^(heic|heix|hevc|heim|heis|mif1|msf1|avif)/.test(brand)) return null; // HEIC/AVIF photos: not supported by all browsers
    return { kind: "video", ext: "mp4", mime: "video/mp4" };
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)
    return { kind: "video", ext: "webm", mime: "video/webm" };
  if (buf.toString("ascii", 0, 5) === "%PDF-") return { kind: "pdf", ext: "pdf", mime: "application/pdf" };
  return null;
}

export class UploadError extends Error {}

/**
 * Validate and store an uploaded File in MongoDB.
 * Private files (seller submissions, approval documents) are only served to logged-in admins.
 */
export async function saveUpload(
  file: File,
  folder: string,
  allowed: FileKind[],
  opts: { private?: boolean } = {},
): Promise<{ url: string; kind: FileKind }> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) throw new UploadError("Empty file.");
  if (file.size > MAX_VIDEO_BYTES) throw new UploadError(`"${file.name}" is too large.`);

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = detectFileType(buf);
  if (!detected || !allowed.includes(detected.kind)) {
    throw new UploadError(`"${file.name}" is not a supported file type.`);
  }
  const limit = detected.kind === "image" ? MAX_IMAGE_BYTES : detected.kind === "pdf" ? MAX_DOC_BYTES : MAX_VIDEO_BYTES;
  if (buf.length > limit) throw new UploadError(`"${file.name}" is too large.`);

  const bucket = await mediaBucket();
  const id = new ObjectId();
  const metadata: MediaMeta = { kind: detected.kind, mime: detected.mime, private: Boolean(opts.private), folder };
  await new Promise<void>((resolve, reject) => {
    const stream = bucket.openUploadStreamWithId(id, `${folder}/${randomBytes(4).toString("hex")}.${detected.ext}`, {
      metadata,
    });
    stream.once("finish", () => resolve());
    stream.once("error", reject);
    stream.end(buf);
  });
  return { url: `/media/${id.toHexString()}.${detected.ext}`, kind: detected.kind };
}

/** "/media/<24-hex>.<ext>" → ObjectId, or null for external URLs (e.g. YouTube). */
export function mediaIdFromUrl(url: string): ObjectId | null {
  const m = /^\/media\/([a-f0-9]{24})\.[a-z0-9]+$/i.exec(url);
  return m ? new ObjectId(m[1]) : null;
}

export async function deleteMediaFile(url: string): Promise<void> {
  const id = mediaIdFromUrl(url);
  if (!id) return;
  try {
    await (await mediaBucket()).delete(id);
  } catch {
    /* already gone */
  }
}

/** Make a stored file public or private (e.g. when an owner's submission is approved). */
export async function setMediaPrivacy(url: string, isPrivate: boolean): Promise<void> {
  const id = mediaIdFromUrl(url);
  if (!id) return;
  const db = await mongoDb();
  await db.collection("media.files").updateOne({ _id: id }, { $set: { "metadata.private": isPrivate } });
}
