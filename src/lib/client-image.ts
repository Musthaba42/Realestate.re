"use client";

/**
 * Shrink a photo in the browser before upload (phone photos are often 4–8 MB).
 * Returns a JPEG no larger than `maxDim` px on its longest side. Falls back to
 * the original file if the browser cannot decode it.
 */
export async function compressImage(file: File, maxDim = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || (blob.size >= file.size && scale === 1 && file.type === "image/jpeg")) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

type UploadResult = { ok: boolean; saved?: number; error?: string };

/**
 * Upload files to a property one per request (keeps each request small and
 * reliable on mobile data). Photos are resized first. Reports overall progress 0–100.
 */
export async function uploadPropertyFiles(
  propertyId: string,
  files: File[],
  opts: { kind: "media" | "document"; category?: string; name?: string },
  onProgress: (percent: number, index: number) => void,
): Promise<{ saved: number; errors: string[]; unauthorized: boolean }> {
  let saved = 0;
  const errors: string[] = [];
  for (const [i, original] of files.entries()) {
    const file = opts.kind === "media" && original.type.startsWith("image/") ? await compressImage(original) : original;
    const fd = new FormData();
    fd.set("propertyId", propertyId);
    fd.set("kind", opts.kind);
    if (opts.category) fd.set("category", opts.category);
    if (opts.name) fd.set("name", opts.name);
    fd.append("files", file);
    try {
      const res = await uploadWithProgress<UploadResult>("/api/admin/upload", fd, (p) =>
        onProgress(Math.round(((i + p / 100) / files.length) * 100), i),
      );
      if (res.status === 401) return { saved, errors: ["Session expired. Please log in again."], unauthorized: true };
      saved += res.body?.saved ?? 0;
      if (res.body?.error) errors.push(res.body.error);
      else if (res.status >= 400) errors.push(`"${original.name}" could not be uploaded.`);
    } catch {
      errors.push(`"${original.name}" failed (network error).`);
    }
  }
  onProgress(100, files.length - 1);
  return { saved, errors, unauthorized: false };
}

/** POST FormData with upload progress (fetch has no upload progress). */
export function uploadWithProgress<T>(
  url: string,
  data: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; body: T | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: T | null = null;
      try {
        body = JSON.parse(xhr.responseText) as T;
      } catch {
        body = null;
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(data);
  });
}
