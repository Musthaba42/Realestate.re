import { AwsClient } from "aws4fetch";

// Cloudflare R2 (S3-compatible) storage for uploaded photos, videos and documents.
// Used when the R2_* variables are set; otherwise uploads stay in MongoDB GridFS.
// Files are still served through /media/<id>.<ext>, so links never change.

type R2 = { client: AwsClient; base: string };

const globalForR2 = globalThis as unknown as { r2?: R2 | null };

function r2(): R2 | null {
  if (globalForR2.r2 === undefined) {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
    globalForR2.r2 =
      R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET
        ? {
            client: new AwsClient({
              accessKeyId: R2_ACCESS_KEY_ID,
              secretAccessKey: R2_SECRET_ACCESS_KEY,
              service: "s3",
              region: "auto",
            }),
            base: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
          }
        : null;
  }
  return globalForR2.r2;
}

function need(): R2 {
  const c = r2();
  if (!c) throw new Error("Cloudflare R2 is not configured (R2_* variables).");
  return c;
}

function objectUrl(c: R2, key: string): string {
  return `${c.base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function r2Enabled(): boolean {
  return r2() !== null;
}

export async function r2Put(key: string, body: Buffer, mime: string): Promise<void> {
  const c = need();
  const res = await c.client.fetch(objectUrl(c, key), {
    method: "PUT",
    body: body as unknown as BodyInit,
    headers: { "Content-Type": mime },
  });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

/** GET an object; pass `range` ("bytes=0-99") for partial content. */
export async function r2Get(key: string, range?: string): Promise<Response> {
  const c = need();
  return c.client.fetch(objectUrl(c, key), { headers: range ? { Range: range } : {} });
}

/** Size of a stored object in bytes, or null if it does not exist. */
export async function r2Size(key: string): Promise<number | null> {
  const c = need();
  const res = await c.client.fetch(objectUrl(c, key), { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 lookup failed (${res.status}).`);
  return Number(res.headers.get("content-length"));
}

export async function r2Delete(key: string): Promise<void> {
  const c = need();
  const res = await c.client.fetch(objectUrl(c, key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status}).`);
}
