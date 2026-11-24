import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Handshake, LogIn, Pencil, Phone, UserPlus, Users } from "@/components/glyphs";
import { HomeTrail } from "@/components/site/HomeTrail";
import { SellForm, type SellInitial } from "@/components/site/SellForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { telLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sell Your Property",
  description: "Submit your land, house, apartment or commercial property. Our team will verify it and find genuine buyers.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** ?edit=<id>: the owner updates a request the team marked "needs more info". */
async function editableRequest(userId: string, raw: unknown): Promise<SellInitial | null> {
  if (typeof raw !== "string" || !/^[a-f0-9]{24}$/.test(raw)) return null;
  const r = await db.sellerRequest.findFirst({ where: { id: raw, userId, status: "needs_info" } });
  if (!r) return null;
  let media: { kind: string }[] = [];
  try {
    const parsed = JSON.parse(r.media) as unknown;
    if (Array.isArray(parsed)) media = parsed as { kind: string }[];
  } catch {}
  const photoCount = media.filter((m) => m.kind === "image").length;
  return {
    id: r.id,
    ref: r.ref,
    ownerMessage: r.ownerMessage,
    photoCount,
    videoCount: media.length - photoCount,
    title: r.title,
    type: r.type,
    locality: r.locality,
    city: r.city,
    district: r.district,
    pincode: r.pincode,
    address: r.address,
    mapsUrl: r.mapsUrl,
    totalSqft: r.totalSqft,
    price: r.price,
    isNegotiable: r.isNegotiable,
    bhk: r.bhk,
    bathrooms: r.bathrooms,
    facing: r.facing,
    constructionStage: r.constructionStage,
    constructionPercent: r.constructionPercent,
    roadType: r.roadType,
    roadNote: r.roadNote,
    approvalType: r.approvalType,
    loanAvailable: r.loanAvailable,
    description: r.description,
    videoLink: r.videoLink,
  };
}

export default async function SellPage({ searchParams }: Props) {
  const [s, me, sp] = await Promise.all([getSettings(), getCurrentUser(), searchParams]);
  const initial = me && sp.edit ? await editableRequest(me.id, sp.edit) : null;

  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <HomeTrail items={[{ label: "Sell your property" }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <p className="eyebrow">For property owners</p>
          <h1 className="mt-3 text-[36px] leading-tight md:text-5xl">Sell your property with us</h1>
          <p className="mb-7 mt-3 max-w-2xl leading-relaxed text-muted">
            Share the details below. Your submission goes <strong className="text-ink">only to our admin team</strong> — nothing is posted on
            the website automatically. The admin reviews it, may edit the details with you, and publishes it for genuine buyers once
            everything is ready.
          </p>

          {!me && (
            <div className="card max-w-xl p-6 md:p-8">
              <h2 className="text-2xl">Log in to sell your property</h2>
              <p className="mt-2 leading-relaxed text-muted">
                You need a free account so we can show you the approval status of your property. Browsing and “I am Interested” never
                need an account.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login?next=/sell" className="btn btn-primary">
                  <LogIn className="size-4" /> Log in
                </Link>
                <Link href="/signup?next=/sell" className="btn btn-ghost">
                  <UserPlus className="size-4" /> Create account
                </Link>
              </div>
            </div>
          )}

          {me && !me.phone && (
            <div className="card max-w-xl p-6 md:p-8">
              <h2 className="text-xl font-bold">Admins add properties from the dashboard</h2>
              <p className="mt-2 text-muted">This account is the admin account. Use the dashboard to add or approve properties.</p>
              <Link href="/admin/properties/new" className="btn btn-primary mt-5">
                Open dashboard
              </Link>
            </div>
          )}

          {me && me.phone && (
            <SellForm
              key={initial?.id ?? "new"}
              callHref={telLink(s.phone)}
              owner={{ name: me.name, phone: me.phone }}
              initial={initial ?? undefined}
            />
          )}
        </div>
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {[
            { icon: BadgeCheck, title: "Seen only by our admin", text: "Your details reach the admin team only. Nothing is posted automatically." },
            { icon: Pencil, title: "Reviewed & edited", text: "The admin checks and corrects the details before deciding to publish." },
            { icon: Users, title: "Genuine buyers", text: "Your property reaches buyers searching in your area." },
            { icon: Handshake, title: "End-to-end help", text: "We handle enquiries, site visits and negotiation." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
          <a href={telLink(s.phone)} className="btn btn-ghost w-full">
            <Phone className="size-4" /> Prefer to talk? Call us
          </a>
        </aside>
      </div>
    </div>
  );
}
