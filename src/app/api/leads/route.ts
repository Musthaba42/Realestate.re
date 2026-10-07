import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { nextSeq } from "@/lib/mongo";
import { getSettings } from "@/lib/settings";
import { notifyTeam } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { LEAD_SOURCES, PREFERRED_TIMES, PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { displayPhone, formatINR, normalizeIndianPhone, siteUrl, whatsappLink } from "@/lib/format";

const schema = z.object({
  source: z.enum(["interested", "no_results", "contact", "loan"]),
  propertyId: z.string().regex(/^[a-f0-9]{24}$/, "This property is no longer available.").optional(),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20),
  preferredTime: z.string().max(20).optional(),
  message: z.string().trim().max(1000).optional(),
  searchFilters: z.record(z.string().max(100)).optional(),
  propertyPrice: z.number().positive().max(1e11).optional(),
  budgetAvailable: z.number().min(0).max(1e11).optional(),
  website: z.string().optional(), // honeypot — must stay empty
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Please check the form.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
  const d = parsed.data;

  const s = await getSettings();

  // Bots fill hidden fields: pretend success, store nothing.
  if (d.website) return NextResponse.json({ ok: true, whatsappUrl: whatsappLink(s.whatsappNumber) });

  if (!rateLimit(`lead:${clientIp(req.headers)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please call or WhatsApp us directly." },
      { status: 429 },
    );
  }

  const phone = normalizeIndianPhone(d.phone);
  if (!phone) {
    return NextResponse.json({ ok: false, error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
  }

  const property = d.propertyId
    ? await db.property.findFirst({
        where: { id: d.propertyId, isPublished: true },
        select: { id: true, code: true, title: true, price: true, slug: true, locality: true, city: true },
      })
    : null;
  if (d.source === "interested" && !property) {
    return NextResponse.json({ ok: false, error: "This property is no longer available." }, { status: 404 });
  }

  const preferredTime = PREFERRED_TIMES.some((t) => t.value === d.preferredTime) ? d.preferredTime : undefined;
  const propertyPrice = d.propertyPrice ?? property?.price;
  const loanRequired =
    d.source === "loan" && propertyPrice && d.budgetAvailable !== undefined
      ? Math.max(0, propertyPrice - d.budgetAvailable)
      : undefined;

  const lead = await db.lead.create({
    data: {
      ref: await nextSeq("lead"),
      source: d.source,
      propertyId: property?.id,
      name: d.name,
      phone,
      preferredTime,
      message: d.message || undefined,
      searchFilters: d.searchFilters ? JSON.stringify(d.searchFilters) : undefined,
      propertyPrice: d.source === "loan" ? propertyPrice : undefined,
      budgetAvailable: d.budgetAvailable,
      loanRequired,
    },
  });

  // Message the buyer sends to our WhatsApp number.
  const lines: string[] = [];
  if (d.source === "interested" && property) {
    lines.push(
      "Hi, I am interested in this property.",
      `Property: ${property.title} – ${property.locality} (ID: ${property.code})`,
      `Price: ${formatINR(property.price)}`,
      `Link: ${siteUrl()}/properties/${property.slug}`,
    );
  } else if (d.source === "no_results") {
    const f = d.searchFilters ?? {};
    lines.push("Hi, I am looking for a property.");
    if (f.type) lines.push(`Type: ${labelOf(PROPERTY_TYPES, f.type)}`);
    if (f.area) lines.push(`Area: ${f.area}`);
    if (f.max) lines.push(`Budget: up to ${formatINR(Number(f.max))}`);
    if (f.bhk) lines.push(`BHK: ${f.bhk}`);
  } else if (d.source === "loan") {
    lines.push("Hi, I need loan assistance.");
    if (property) lines.push(`Property: ${property.title} (ID: ${property.code})`);
    if (propertyPrice) lines.push(`Property price: ${formatINR(propertyPrice)}`);
    if (d.budgetAvailable !== undefined) lines.push(`Amount I have: ${formatINR(d.budgetAvailable)}`);
    if (loanRequired !== undefined) lines.push(`Loan needed: ${formatINR(loanRequired)}`);
  } else {
    lines.push("Hi, I have an enquiry.");
  }
  lines.push(`Name: ${d.name}`, `Phone: ${displayPhone(phone)}`);
  if (preferredTime) lines.push(`Best time to call: ${labelOf(PREFERRED_TIMES, preferredTime)}`);
  if (d.message) lines.push(`Message: ${d.message}`);
  lines.push(`(Ref: L-${lead.ref})`);

  await notifyTeam(`New lead (${labelOf(LEAD_SOURCES, d.source)}) – L-${lead.ref}`, [
    ...lines,
    `Admin: ${siteUrl()}/admin/leads/${lead.id}`,
  ]);

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    whatsappUrl: whatsappLink(s.whatsappNumber, lines.join("\n")),
  });
}
