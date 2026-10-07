import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { saveUpload, UploadError } from "@/lib/uploads";
import { MEDIA_CATEGORIES } from "@/lib/constants";

// Admin uploads: property photos/videos (kind=media) and approval documents (kind=document).
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Upload failed. Try fewer or smaller files." }, { status: 400 });
  }

  const propertyId = String(form.get("propertyId") ?? "");
  if (!/^[a-f0-9]{24}$/.test(propertyId)) {
    return NextResponse.json({ ok: false, error: "Missing property." }, { status: 400 });
  }
  const property = await db.property.findUnique({ where: { id: propertyId }, select: { id: true, slug: true } });
  if (!property) return NextResponse.json({ ok: false, error: "Property not found." }, { status: 404 });

  const files = form.getAll("files").filter((f): f is File => typeof f !== "string" && f.size > 0);
  if (!files.length) return NextResponse.json({ ok: false, error: "No files selected." }, { status: 400 });
  if (files.length > 30) return NextResponse.json({ ok: false, error: "Upload at most 30 files at a time." }, { status: 400 });

  const kind = form.get("kind") === "document" ? "document" : "media";
  const saved: string[] = [];
  const errors: string[] = [];

  if (kind === "document") {
    for (const f of files) {
      try {
        const { url } = await saveUpload(f, "documents", ["pdf", "image"], { private: true });
        const name = String(form.get("name") || f.name || "Document").slice(0, 120);
        await db.propertyDocument.create({ data: { propertyId, name, fileUrl: url } });
        saved.push(url);
      } catch (err) {
        errors.push(err instanceof UploadError ? err.message : `Could not save "${f.name}".`);
      }
    }
  } else {
    const rawCategory = String(form.get("category") ?? "");
    const category = MEDIA_CATEGORIES.some((c) => c.value === rawCategory) ? rawCategory : "exterior";
    const last = await db.propertyMedia.findFirst({ where: { propertyId }, orderBy: { sortOrder: "desc" } });
    let order = (last?.sortOrder ?? -1) + 1;
    let hasCover = (await db.propertyMedia.count({ where: { propertyId, isCover: true } })) > 0;
    for (const f of files) {
      try {
        const { url, kind: fileKind } = await saveUpload(f, "properties", ["image", "video"]);
        const isCover = fileKind === "image" && !hasCover;
        if (isCover) hasCover = true;
        await db.propertyMedia.create({
          data: { propertyId, kind: fileKind, category, url, isCover, sortOrder: order++ },
        });
        saved.push(url);
      } catch (err) {
        errors.push(err instanceof UploadError ? err.message : `Could not save "${f.name}".`);
      }
    }
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: errors.length === 0, saved: saved.length, error: errors.join(" ") || undefined });
}
