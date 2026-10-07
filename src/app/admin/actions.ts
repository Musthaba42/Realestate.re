"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { nextSeq } from "@/lib/mongo";
import { locate, validCoords } from "@/lib/geo";
import { buildSearchText } from "@/lib/properties";
import { deleteMediaFile, saveUpload, setMediaPrivacy, UploadError } from "@/lib/uploads";
import { normalizeIndianPhone, slugify, youtubeId } from "@/lib/format";
import {
  APPROVAL_TYPES,
  CONSTRUCTION_STAGES,
  FACINGS,
  LEAD_STATUSES,
  MEDIA_CATEGORIES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_TYPE_VALUES,
  RESIDENTIAL_TYPES,
  ROAD_TYPES,
  SELLER_STATUSES,
  labelOf,
  type Option,
} from "@/lib/constants";

export type FormState = { error?: string; ok?: string; id?: string } | undefined;

// ---------- helpers ----------
function str(fd: FormData, key: string, max = 500): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t ? t : null;
}
function num(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (s === null) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}
function int(fd: FormData, key: string): number | null {
  const n = num(fd, key);
  if (n === null) return null;
  return Number.isNaN(n) ? NaN : Math.round(n);
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true" || fd.get(key) === "1";
}
function opt(fd: FormData, key: string, list: readonly Option[]): string | null {
  const v = str(fd, key);
  return v && list.some((o) => o.value === v) ? v : null;
}
const OBJECT_ID = /^[a-f0-9]{24}$/;
function idOf(fd: FormData, key = "id"): string {
  const v = fd.get(key);
  if (typeof v !== "string" || !OBJECT_ID.test(v)) throw new Error("Invalid id");
  return v;
}
function isUrl(v: string | null): boolean {
  return v === null || /^https?:\/\/\S+$/i.test(v);
}
function refresh() {
  revalidatePath("/", "layout");
}
function makeSlug(title: string, locality: string, code: string): string {
  const base = title.toLowerCase().includes(locality.toLowerCase()) ? title : `${title} ${locality}`;
  return `${slugify(base) || "property"}-${code.toLowerCase()}`;
}
async function newPropertyNumber() {
  const number = await nextSeq("property", 1000);
  return { number, code: `P-${number}` };
}
function parseMediaJson(json: string): { kind: string; url: string }[] {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? (v as { kind: string; url: string }[]) : [];
  } catch {
    return [];
  }
}

// ---------- properties ----------
function fail(error: string) {
  return { error, data: null } as const;
}

function parseProperty(fd: FormData) {
  const title = str(fd, "title", 140);
  const type = str(fd, "type");
  const locality = str(fd, "locality", 100);
  const city = str(fd, "city", 60);
  const price = num(fd, "price");
  const totalSqft = num(fd, "totalSqft");
  const status = opt(fd, "status", PROPERTY_STATUSES) ?? "available";
  const pincode = str(fd, "pincode", 10);
  const mapsUrl = str(fd, "mapsUrl", 1000);
  const constructionPercent = int(fd, "constructionPercent");
  const loanPercent = int(fd, "loanPercent");
  const latIn = num(fd, "lat");
  const lngIn = num(fd, "lng");

  if (!title) return fail("Title is required.");
  if ((latIn === null) !== (lngIn === null)) return fail("Enter both latitude and longitude, or leave both empty.");
  if (latIn !== null && lngIn !== null && !validCoords(latIn, lngIn)) return fail("Latitude / longitude must be a position in India.");
  if (!type || !(PROPERTY_TYPE_VALUES as string[]).includes(type)) return fail("Choose a property type.");
  if (!locality) return fail("Area / locality is required.");
  if (!city) return fail("City is required.");
  if (price === null || Number.isNaN(price) || price <= 0) return fail("Enter a valid price.");
  if (totalSqft === null || Number.isNaN(totalSqft) || totalSqft <= 0) return fail("Enter the total area in sq.ft.");
  if (pincode && !/^\d{6}$/.test(pincode)) return fail("PIN code must be 6 digits.");
  if (!isUrl(mapsUrl)) return fail("Google Maps link must start with https://");
  if (constructionPercent !== null && (Number.isNaN(constructionPercent) || constructionPercent < 0 || constructionPercent > 100))
    return fail("Construction % must be between 0 and 100.");
  if (loanPercent !== null && (Number.isNaN(loanPercent) || loanPercent < 0 || loanPercent > 100))
    return fail("Loan % must be between 0 and 100.");

  const intField = (k: string) => {
    const v = int(fd, k);
    return v === null || Number.isNaN(v) || v < 0 ? null : v;
  };
  const numField = (k: string) => {
    const v = num(fd, k);
    return v === null || Number.isNaN(v) || v <= 0 ? null : v;
  };
  const residential = RESIDENTIAL_TYPES.includes(type);
  const bhk = residential ? intField("bhk") : null;

  const data = {
    title,
    type,
    subType: str(fd, "subType", 60),
    locality,
    city,
    district: str(fd, "district", 60),
    pincode,
    address: str(fd, "address", 300),
    mapsUrl,
    showExactLocation: bool(fd, "showExactLocation"),
    lat: latIn,
    lng: lngIn,
    price: Math.round(price),
    isNegotiable: bool(fd, "isNegotiable"),
    totalSqft,
    builtUpSqft: numField("builtUpSqft"),
    carpetSqft: numField("carpetSqft"),
    bhk: bhk && bhk >= 1 ? Math.min(bhk, 10) : null,
    bedrooms: residential ? intField("bedrooms") : null,
    bathrooms: type === "land" ? null : intField("bathrooms"),
    floors: type === "land" ? null : intField("floors"),
    floorNo: type === "land" ? null : intField("floorNo"),
    parking: str(fd, "parking", 60),
    balcony: residential ? intField("balcony") : null,
    kitchen: residential && bool(fd, "kitchen"),
    livingRoom: residential && bool(fd, "livingRoom"),
    facing: opt(fd, "facing", FACINGS),
    constructionStage: type === "land" ? null : opt(fd, "constructionStage", CONSTRUCTION_STAGES),
    constructionPercent: type === "land" || constructionPercent === null ? null : constructionPercent,
    roadType: opt(fd, "roadType", ROAD_TYPES),
    roadNote: str(fd, "roadNote", 200),
    approvalType: opt(fd, "approvalType", APPROVAL_TYPES),
    approvalNumber: str(fd, "approvalNumber", 100),
    approvalVerified: bool(fd, "approvalVerified") && Boolean(opt(fd, "approvalType", APPROVAL_TYPES)),
    loanAvailable: bool(fd, "loanAvailable"),
    loanBanks: str(fd, "loanBanks", 200),
    loanPercent: loanPercent === null ? null : loanPercent,
    status,
    isFeatured: bool(fd, "isFeatured"),
    isPublished: bool(fd, "isPublished"),
    description: str(fd, "description", 5000),
  };
  if (data.constructionStage === "completed" && data.constructionPercent === null) data.constructionPercent = 100;
  return { data, error: null };
}

/** Create (returns the new id, the form then uploads photos) or update a property. */
export async function savePropertyAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { data, error } = parseProperty(fd);
  if (!data) return { error };
  const searchText = buildSearchText(data);

  // No position typed in: work it out from the Google Maps link, or the area name.
  if (data.lat === null || data.lng === null) {
    const pos = await locate({ mapsUrl: data.mapsUrl, locality: data.locality, city: data.city });
    data.lat = pos?.lat ?? null;
    data.lng = pos?.lng ?? null;
  }

  const rawId = fd.get("id");
  if (rawId) {
    const id = idOf(fd);
    await db.property.update({ where: { id }, data: { ...data, searchText } });
    refresh();
    return { ok: "Saved.", id };
  }

  const { number, code } = await newPropertyNumber();
  const created = await db.property.create({
    data: { ...data, searchText, number, code, slug: makeSlug(data.title, data.locality, code), source: "team" },
  });
  refresh();
  return { ok: "Property created.", id: created.id };
}

export async function deletePropertyAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const p = await db.property.findUnique({ where: { id }, include: { media: true, documents: true } });
  if (!p) redirect("/admin/properties");
  await db.property.delete({ where: { id } });
  await Promise.all([...p.media.map((m) => deleteMediaFile(m.url)), ...p.documents.map((d) => deleteMediaFile(d.fileUrl))]);
  if (p.sellerRequestId) {
    await db.sellerRequest.updateMany({ where: { id: p.sellerRequestId }, data: { propertyId: null } });
  }
  refresh();
  redirect("/admin/properties?deleted=1");
}

export async function quickTogglePropertyAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const field = fd.get("field");
  const p = await db.property.findUnique({ where: { id }, select: { isPublished: true, isFeatured: true } });
  if (!p) return;
  if (field === "isPublished") await db.property.update({ where: { id }, data: { isPublished: !p.isPublished } });
  if (field === "isFeatured") await db.property.update({ where: { id }, data: { isFeatured: !p.isFeatured } });
  refresh();
}

export async function quickPropertyStatusAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const status = opt(fd, "status", PROPERTY_STATUSES);
  if (!status) return;
  await db.property.update({ where: { id }, data: { status, ...(status === "sold" ? { isFeatured: false } : {}) } });
  refresh();
}

// ---------- media ----------
export async function setCoverAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const m = await db.propertyMedia.findUnique({ where: { id } });
  if (!m || m.kind !== "image") return;
  await db.propertyMedia.updateMany({ where: { propertyId: m.propertyId }, data: { isCover: false } });
  await db.propertyMedia.update({ where: { id }, data: { isCover: true } });
  refresh();
}

export async function deleteMediaAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const m = await db.propertyMedia.findUnique({ where: { id } });
  if (!m) return;
  await db.propertyMedia.delete({ where: { id } });
  const stillUsed = await db.propertyMedia.count({ where: { url: m.url } });
  if (!stillUsed) await deleteMediaFile(m.url);
  if (m.isCover) {
    const next = await db.propertyMedia.findFirst({
      where: { propertyId: m.propertyId, kind: "image" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (next) await db.propertyMedia.update({ where: { id: next.id }, data: { isCover: true } });
  }
  refresh();
}

export async function moveMediaAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const dir = fd.get("dir") === "up" ? -1 : 1;
  const m = await db.propertyMedia.findUnique({ where: { id } });
  if (!m) return;
  const list = await db.propertyMedia.findMany({
    where: { propertyId: m.propertyId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const idx = list.findIndex((x) => x.id === id);
  const swap = list[idx + dir];
  if (!swap) return;
  [list[idx], list[idx + dir]] = [swap, list[idx]!];
  for (const [i, x] of list.entries()) {
    if (x.sortOrder !== i) await db.propertyMedia.update({ where: { id: x.id }, data: { sortOrder: i } });
  }
  refresh();
}

export async function updateMediaCategoryAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const category = opt(fd, "category", MEDIA_CATEGORIES);
  if (!category) return;
  await db.propertyMedia.update({ where: { id }, data: { category } });
  refresh();
}

export async function addYoutubeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const propertyId = idOf(fd, "propertyId");
  const url = str(fd, "url", 500);
  if (!url || !youtubeId(url)) return { error: "Paste a valid YouTube link (youtube.com/watch?v=… or youtu.be/…)." };
  const category = opt(fd, "category", MEDIA_CATEGORIES) ?? "walkthrough";
  const last = await db.propertyMedia.findFirst({ where: { propertyId }, orderBy: { sortOrder: "desc" } });
  await db.propertyMedia.create({
    data: { propertyId, kind: "youtube", category, url, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  refresh();
  return { ok: "Video added." };
}

export async function deleteDocumentAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const d = await db.propertyDocument.findUnique({ where: { id } });
  if (!d) return;
  await db.propertyDocument.delete({ where: { id } });
  await deleteMediaFile(d.fileUrl);
  refresh();
}

// ---------- leads ----------
export async function updateLeadAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  const status = opt(fd, "status", LEAD_STATUSES);
  if (!status) return { error: "Choose a status." };
  await db.lead.update({ where: { id }, data: { status, notes: str(fd, "notes", 5000) } });
  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}

export async function quickLeadStatusAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const status = opt(fd, "status", LEAD_STATUSES);
  if (!status) return;
  await db.lead.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

export async function deleteLeadAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  await db.lead.deleteMany({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin/leads");
}

// ---------- seller requests ----------
export async function updateSellerNotesAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = idOf(fd);
  const status = opt(fd, "status", SELLER_STATUSES);
  if (!status) return { error: "Choose a status." };
  const r = await db.sellerRequest.findUnique({ where: { id }, select: { propertyId: true } });
  if (!r) return { error: "Request not found." };
  if (status === "approved" && !r.propertyId) return { error: "Use “Approve & publish” to approve this request." };
  await db.sellerRequest.update({
    where: { id },
    data: { status, adminNotes: str(fd, "adminNotes", 5000), ownerMessage: status === "approved" ? null : str(fd, "ownerMessage", 500) },
  });
  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}

/** Approve an owner's submission: it becomes a live listing visible to everyone. */
export async function approveSellerAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const r = await db.sellerRequest.findUnique({ where: { id } });
  if (!r) redirect("/admin/sellers");
  if (r.propertyId) {
    const exists = await db.property.findUnique({ where: { id: r.propertyId }, select: { id: true } });
    if (exists) redirect(`/admin/properties/${r.propertyId}`);
  }

  const typeLabel = r.type === "commercial" ? "Commercial Property" : labelOf(PROPERTY_TYPES, r.type);
  const title = r.title?.trim() || `${r.bhk ? `${r.bhk >= 5 ? "5+" : r.bhk} BHK ` : ""}${typeLabel} in ${r.locality}`;
  const { number, code } = await newPropertyNumber();
  const media = parseMediaJson(r.media);
  const pos = await locate({ mapsUrl: r.mapsUrl, locality: r.locality, city: r.city });
  let coverSet = false;

  const created = await db.property.create({
    data: {
      number,
      code,
      slug: makeSlug(title, r.locality, code),
      title,
      type: r.type,
      locality: r.locality,
      city: r.city,
      district: r.district,
      pincode: r.pincode,
      address: r.address,
      mapsUrl: r.mapsUrl,
      showExactLocation: false,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      price: r.price,
      isNegotiable: r.isNegotiable,
      totalSqft: r.totalSqft,
      bhk: r.bhk,
      bedrooms: r.bhk,
      bathrooms: r.bathrooms,
      facing: r.facing,
      constructionStage: r.constructionStage,
      constructionPercent: r.constructionPercent,
      roadType: r.roadType,
      roadNote: r.roadNote,
      approvalType: r.approvalType,
      approvalVerified: false, // the team ticks this after checking documents
      loanAvailable: r.loanAvailable === "yes",
      description: r.description,
      status: r.constructionStage && r.constructionStage !== "completed" ? "under_construction" : "available",
      isPublished: true,
      source: "seller_request",
      sellerRequestId: r.id,
      searchText: buildSearchText({ title, locality: r.locality, city: r.city, district: r.district, pincode: r.pincode, address: r.address }),
      media: {
        create: [
          ...media.map((m, i) => {
            const isCover = m.kind === "image" && !coverSet;
            if (isCover) coverSet = true;
            return { kind: m.kind, url: m.url, category: m.kind === "video" ? "walkthrough" : "exterior", sortOrder: i, isCover };
          }),
          ...(r.videoLink && youtubeId(r.videoLink)
            ? [{ kind: "youtube", url: r.videoLink, category: "walkthrough", sortOrder: media.length }]
            : []),
        ],
      },
    },
  });
  // The owner's photos become public now that the listing is approved.
  await Promise.all(media.map((m) => setMediaPrivacy(m.url, false)));
  await db.sellerRequest.update({ where: { id: r.id }, data: { status: "approved", propertyId: created.id, ownerMessage: null } });
  refresh();
  redirect(`/admin/properties/${created.id}?approved=1`);
}

export async function rejectSellerAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const r = await db.sellerRequest.findUnique({ where: { id }, select: { propertyId: true } });
  if (!r) redirect("/admin/sellers");
  if (r.propertyId) {
    // Already published: hide the listing again.
    await db.property.updateMany({ where: { id: r.propertyId }, data: { isPublished: false } });
  }
  // The reason is shown to the owner on their account page.
  await db.sellerRequest.update({ where: { id }, data: { status: "rejected", ownerMessage: str(fd, "reason", 500) } });
  refresh();
  redirect(`/admin/sellers/${id}?rejected=1`);
}

export async function deleteSellerRequestAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const r = await db.sellerRequest.findUnique({ where: { id } });
  if (r) {
    await db.sellerRequest.delete({ where: { id } });
    // Keep files that an approved listing still uses.
    const stillListed = r.propertyId ? await db.property.count({ where: { id: r.propertyId } }) : 0;
    if (!stillListed) await Promise.all(parseMediaJson(r.media).map((m) => deleteMediaFile(m.url)));
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/sellers");
}

// ---------- team ----------
export async function saveTeamMemberAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = str(fd, "name", 80);
  const role = str(fd, "role", 80);
  if (!name) return { error: "Name is required." };
  if (!role) return { error: "Position / role is required." };
  const phoneRaw = str(fd, "phone", 20);
  const waRaw = str(fd, "whatsapp", 20);
  const phone = phoneRaw ? normalizeIndianPhone(phoneRaw) : null;
  const whatsapp = waRaw ? normalizeIndianPhone(waRaw) : null;
  if (phoneRaw && !phone) return { error: "Phone must be a valid 10-digit mobile number." };
  if (waRaw && !whatsapp) return { error: "WhatsApp must be a valid 10-digit mobile number." };
  const email = str(fd, "email", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  const sortOrder = int(fd, "sortOrder");

  const data = {
    name,
    role,
    bio: str(fd, "bio", 1000),
    phone,
    whatsapp,
    email,
    showContact: bool(fd, "showContact"),
    sortOrder: sortOrder === null || Number.isNaN(sortOrder) ? 0 : sortOrder,
  };

  const rawId = fd.get("id");
  const existing = rawId ? await db.teamMember.findUnique({ where: { id: idOf(fd) } }) : null;
  if (rawId && !existing) return { error: "Team member not found." };

  let photoUrl: string | undefined;
  const photo = fd.get("photo");
  if (photo && typeof photo !== "string" && photo.size > 0) {
    try {
      photoUrl = (await saveUpload(photo, "team", ["image"])).url;
    } catch (err) {
      return { error: err instanceof UploadError ? err.message : "Could not save the photo." };
    }
  }
  const removePhoto = bool(fd, "removePhoto");

  if (existing) {
    await db.teamMember.update({
      where: { id: existing.id },
      data: { ...data, ...(photoUrl ? { photoUrl } : removePhoto ? { photoUrl: null } : {}) },
    });
    if ((photoUrl || removePhoto) && existing.photoUrl) await deleteMediaFile(existing.photoUrl);
  } else {
    await db.teamMember.create({ data: { ...data, photoUrl: photoUrl ?? null } });
  }
  refresh();
  redirect("/admin/team?saved=1");
}

export async function deleteTeamMemberAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  const m = await db.teamMember.findUnique({ where: { id } });
  if (m) {
    await db.teamMember.delete({ where: { id } });
    if (m.photoUrl) await deleteMediaFile(m.photoUrl);
  }
  refresh();
  redirect("/admin/team");
}

// ---------- settings ----------
export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const businessName = str(fd, "businessName", 80);
  const heroTitle = str(fd, "heroTitle", 120);
  const phone = normalizeIndianPhone(str(fd, "phone", 20) ?? "");
  const whatsappNumber = normalizeIndianPhone(str(fd, "whatsappNumber", 20) ?? "");
  if (!businessName) return { error: "Business name is required." };
  if (!heroTitle) return { error: "Home page headline is required." };
  if (!phone) return { error: "Enter a valid 10-digit phone number." };
  if (!whatsappNumber) return { error: "Enter a valid 10-digit WhatsApp number. Leads are sent here." };
  const urls = ["mapsUrl", "instagramUrl", "facebookUrl", "youtubeUrl"].map((k) => [k, str(fd, k, 500)] as const);
  for (const [k, v] of urls) if (!isUrl(v)) return { error: `${k.replace("Url", "")} link must start with https://` };
  const email = str(fd, "email", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  const loanMaxPercent = int(fd, "loanMaxPercent");
  if (loanMaxPercent === null || Number.isNaN(loanMaxPercent) || loanMaxPercent < 0 || loanMaxPercent > 100)
    return { error: "Loan % must be between 0 and 100." };

  const data = {
    businessName,
    tagline: str(fd, "tagline", 120),
    phone,
    whatsappNumber,
    email,
    address: str(fd, "address", 300),
    workingHours: str(fd, "workingHours", 120),
    heroTitle,
    heroSubtitle: str(fd, "heroSubtitle", 300),
    aboutText: str(fd, "aboutText", 3000),
    reraNumber: str(fd, "reraNumber", 100),
    loanMaxPercent,
    mapsUrl: urls[0]![1],
    instagramUrl: urls[1]![1],
    facebookUrl: urls[2]![1],
    youtubeUrl: urls[3]![1],
  };
  await db.siteSettings.upsert({ where: { id: "site" }, update: data, create: { id: "site", ...data } });
  refresh();
  return { ok: "Settings saved." };
}

// ---------- admin users ----------
export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };
  const user = await db.user.findUnique({ where: { id: admin.id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: "Password changed." };
}
