import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { notifyTeam } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { TURNSTILE_ERROR, TURNSTILE_FIELD, verifyTurnstile } from "@/lib/turnstile";
import { deleteMediaFile, saveUpload, UploadError } from "@/lib/uploads";
import { nextSeq } from "@/lib/mongo";
import { getCurrentUser } from "@/lib/auth";
import {
  APPROVAL_TYPES,
  CONSTRUCTION_STAGES,
  FACINGS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_VALUES,
  RESIDENTIAL_TYPES,
  ROAD_TYPES,
  SELL_MAX_PHOTOS,
  SELL_MAX_VIDEOS,
  labelOf,
} from "@/lib/constants";
import { displayPhone, formatINR, siteUrl, whatsappLink } from "@/lib/format";

const MAX_PHOTOS = SELL_MAX_PHOTOS;
const MAX_VIDEOS = SELL_MAX_VIDEOS;

const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const inList = (list: readonly { value: string }[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && list.some((o) => o.value === v) ? v : undefined));

const posNumber = (msg: string) =>
  z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/,/g, "")))
    .refine((n) => Number.isFinite(n) && n > 0 && n < 1e11, msg);

const schema = z.object({
  title: optStr(120),
  type: z.string().refine((v) => (PROPERTY_TYPE_VALUES as string[]).includes(v), "Please choose a property type"),
  locality: z.string().trim().min(2, "Please enter the area / locality").max(100),
  city: z.string().trim().min(2, "Please enter the city").max(60),
  district: optStr(60),
  pincode: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^\d{6}$/.test(v), "PIN code must be 6 digits"),
  address: optStr(300),
  mapsUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https?:\/\//i.test(v), "Google Maps link must start with https://"),
  totalSqft: posNumber("Please enter the total square feet"),
  price: posNumber("Please enter the expected price"),
  isNegotiable: z.enum(["yes", "no"]).default("yes"),
  bhk: z
    .string()
    .optional()
    .transform((v) => (v && /^[1-5]$/.test(v) ? Number(v) : undefined)),
  bathrooms: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{1,2}$/.test(v) ? Number(v) : undefined)),
  facing: inList(FACINGS),
  constructionStage: inList(CONSTRUCTION_STAGES),
  constructionPercent: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{1,3}$/.test(v) ? Math.min(100, Number(v)) : undefined)),
  roadType: inList(ROAD_TYPES),
  roadNote: optStr(200),
  approvalType: inList(APPROVAL_TYPES),
  loanAvailable: z
    .string()
    .optional()
    .transform((v) => (v === "yes" || v === "no" || v === "not_sure" ? v : undefined)),
  description: optStr(2000),
  videoLink: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^https?:\/\//i.test(v), "Video link must start with https://"),
});

/** undefined → null, so an update clears fields the owner emptied. */
type Nullified<T> = { [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K] };
function nullify<T extends Record<string, unknown>>(o: T): Nullified<T> {
  return Object.fromEntries(Object.entries(o).map(([k, val]) => [k, val === undefined ? null : val])) as Nullified<T>;
}

function parseMedia(json: string): { kind: string; url: string }[] {
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? (v as { kind: string; url: string }[]) : [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  // Only logged-in accounts can submit a property; the owner details come from the account.
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Please log in to sell your property." }, { status: 401 });
  if (!me.phone) {
    return NextResponse.json({ ok: false, error: "This account has no mobile number. Admins add properties from the dashboard." }, { status: 403 });
  }

  const ip = clientIp(req.headers);
  if (!(await rateLimit(`sell:${ip}`, 5, 30 * 60 * 1000))) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please call or WhatsApp us directly." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Upload failed. Please try again with fewer or smaller files." }, { status: 400 });
  }

  const s = await getSettings();
  if (String(form.get("website") ?? "")) {
    return NextResponse.json({ ok: true, id: 0, whatsappUrl: whatsappLink(s.whatsappNumber) });
  }
  if (!(await verifyTurnstile(form.get(TURNSTILE_FIELD), ip))) {
    return NextResponse.json({ ok: false, error: TURNSTILE_ERROR }, { status: 400 });
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const d = parsed.data;
  const phone = me.phone;

  // Editing an earlier submission after the team asked for more information.
  const requestId = String(form.get("requestId") ?? "");
  const existing = requestId
    ? /^[a-f0-9]{24}$/.test(requestId)
      ? await db.sellerRequest.findFirst({ where: { id: requestId, userId: me.id } })
      : null
    : null;
  if (requestId && !existing) {
    return NextResponse.json({ ok: false, error: "This request was not found." }, { status: 404 });
  }
  if (existing && existing.status !== "needs_info") {
    return NextResponse.json(
      { ok: false, error: "This request can no longer be changed. Please contact us if something needs updating." },
      { status: 409 },
    );
  }
  const oldMedia = existing ? parseMedia(existing.media) : [];
  const oldPhotos = oldMedia.filter((m) => m.kind === "image").length;
  const oldVideos = oldMedia.length - oldPhotos;

  const photos = form.getAll("photos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  const videos = form.getAll("videos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  if (photos.length + oldPhotos > MAX_PHOTOS) {
    return NextResponse.json({ ok: false, error: `Please upload at most ${MAX_PHOTOS} photos in total.` }, { status: 400 });
  }
  if (videos.length + oldVideos > MAX_VIDEOS) {
    return NextResponse.json({ ok: false, error: `Please upload at most ${MAX_VIDEOS} videos in total.` }, { status: 400 });
  }

  // Save files first (private until the team approves the listing).
  const media: { kind: string; url: string }[] = [];
  try {
    for (const f of photos) media.push(await saveUpload(f, "sellers", ["image"], { private: true }));
    for (const f of videos) media.push(await saveUpload(f, "sellers", ["video"], { private: true }));
  } catch (err) {
    await Promise.all(media.map((m) => deleteMediaFile(m.url)));
    const msg = err instanceof UploadError ? err.message : "Could not save your files. Please try again.";
    if (!(err instanceof UploadError)) console.error("[sell] upload failed", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const isResidential = RESIDENTIAL_TYPES.includes(d.type);
  const fields = {
    ownerName: me.name,
    ownerPhone: phone,
    title: d.title,
    type: d.type,
    locality: d.locality,
    city: d.city,
    district: d.district,
    pincode: d.pincode,
    address: d.address,
    mapsUrl: d.mapsUrl,
    totalSqft: d.totalSqft,
    price: Math.round(d.price),
    isNegotiable: true, // every price is shown as negotiable
    bhk: isResidential ? d.bhk : undefined,
    bathrooms: d.type === "land" ? undefined : d.bathrooms,
    facing: d.facing,
    constructionStage: d.type === "land" ? undefined : d.constructionStage,
    constructionPercent: d.type === "land" ? undefined : d.constructionPercent,
    roadType: d.roadType,
    roadNote: d.roadNote,
    approvalType: d.approvalType,
    loanAvailable: d.loanAvailable,
    description: d.description,
    videoLink: d.videoLink,
  };
  // Optional fields left empty in an edit are cleared (null), not kept.
  const request = existing
    ? await db.sellerRequest.update({
        where: { id: existing.id },
        data: {
          ...nullify(fields),
          media: JSON.stringify([...oldMedia, ...media]),
          status: "pending",
          ownerMessage: null,
        },
      })
    : await db.sellerRequest.create({
        data: { ...fields, ref: await nextSeq("seller"), userId: me.id, media: JSON.stringify(media) },
      });
  const ref = `S-${request.ref}`;
  const lines = [
    existing ? "Hi, I have updated my property details as requested." : "Hi, I have submitted my property for sale on your website.",
    `Reference: ${ref}`,
    `Type: ${labelOf(PROPERTY_TYPES, d.type)}`,
    `Area: ${d.locality}, ${d.city}`,
    `Size: ${d.totalSqft} sq.ft`,
    `Expected price: ${formatINR(d.price)} (negotiable)`,
    `Name: ${me.name}`,
    `Phone: ${displayPhone(phone)}`,
  ];
  await notifyTeam(existing ? `Owner updated their property – ${ref}` : `New property for sale – ${ref}`, [
    ...lines.slice(1),
    `Photos: ${photos.length}, Videos: ${videos.length}${d.videoLink ? " + link" : ""}`,
    `Admin: ${siteUrl()}/admin/sellers/${request.id}`,
  ]);

  return NextResponse.json({ ok: true, id: request.ref, whatsappUrl: whatsappLink(s.whatsappNumber, lines.join("\n")) });
}
