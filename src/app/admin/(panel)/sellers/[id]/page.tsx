import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, CircleCheck, ExternalLink, Navigation, Phone, Trash } from "@/components/glyphs";
import { db } from "@/lib/db";
import {
  APPROVAL_TYPES,
  CONSTRUCTION_STAGES,
  FACINGS,
  PROPERTY_TYPES,
  ROAD_TYPES,
  SELLER_STATUSES,
  labelOf,
} from "@/lib/constants";
import { displayPhone, formatDateTime, formatINR, formatNumber, mapsSearchLink, pricePerSqft, telLink, whatsappLink } from "@/lib/format";
import { SellerEditor } from "@/components/admin/Editors";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/ui";
import { Pill } from "@/components/admin/Pill";
import { WhatsAppIcon } from "@/components/icons";
import { approveSellerAction, deleteSellerRequestAction, rejectSellerAction } from "../../../actions";

export const metadata: Metadata = { title: "Seller request" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SellerRequestPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  const r = await db.sellerRequest.findUnique({ where: { id } });
  if (!r) notFound();
  const linked = r.propertyId
    ? await db.property.findUnique({ where: { id: r.propertyId }, select: { id: true, code: true, title: true, isPublished: true, slug: true } })
    : null;

  let media: { kind: string; url: string }[] = [];
  try {
    media = JSON.parse(r.media) as { kind: string; url: string }[];
  } catch {
    media = [];
  }
  const images = media.filter((m) => m.kind === "image");
  const videos = media.filter((m) => m.kind === "video");
  const per = pricePerSqft(r.price, r.totalSqft);
  const mapHref = r.mapsUrl || mapsSearchLink(`${r.locality}, ${r.city}${r.pincode ? " " + r.pincode : ""}`);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Seller requests
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            S-{r.ref} · {r.title || `${labelOf(PROPERTY_TYPES, r.type)} in ${r.locality}`}
          </h1>
          <Pill value={r.status} label={labelOf(SELLER_STATUSES, r.status)} />
        </div>
        <p className="mt-1 text-sm text-muted">Received {formatDateTime(r.createdAt)}</p>
      </div>

      {sp.rejected && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">Rejected. This property is not shown on the website.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5 md:p-6">
            <h2 className="font-bold">Owner (private)</h2>
            <p className="mt-1 text-xs text-muted">Submitted from a registered account. The owner sees your decision under “My account”.</p>
            <dl className="mt-3 divide-y divide-line/50">
              <Row label="Name">{r.ownerName}</Row>
              <Row label="Phone">{displayPhone(r.ownerPhone)}</Row>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={telLink(r.ownerPhone)} className="btn btn-primary btn-sm">
                <Phone className="size-4" /> Call owner
              </a>
              <a
                href={whatsappLink(r.ownerPhone, `Hi ${r.ownerName}, this is Golden Groups regarding the property you submitted (Ref S-${r.ref}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-sm"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
            </div>
          </section>

          <section className="card p-5 md:p-6">
            <h2 className="font-bold">Property details</h2>
            <dl className="mt-3 divide-y divide-line/50">
              {r.title && <Row label="Title">{r.title}</Row>}
              <Row label="Type">{labelOf(PROPERTY_TYPES, r.type)}</Row>
              <Row label="Expected price">
                <strong>{formatINR(r.price)}</strong> {per ? <span className="text-muted">· {formatINR(per)}/sq.ft</span> : null} ·{" "}
                {r.isNegotiable ? "Negotiable" : "Fixed"}
              </Row>
              <Row label="Total area">{formatNumber(r.totalSqft)} sq.ft</Row>
              {r.bhk && <Row label="BHK">{r.bhk >= 5 ? "5+" : r.bhk} BHK</Row>}
              {r.bathrooms != null && <Row label="Bathrooms">{r.bathrooms}</Row>}
              {r.facing && <Row label="Facing">{labelOf(FACINGS, r.facing)}</Row>}
              {r.constructionStage && (
                <Row label="Construction">
                  {labelOf(CONSTRUCTION_STAGES, r.constructionStage)}
                  {r.constructionPercent != null ? ` · ${r.constructionPercent}%` : ""}
                </Row>
              )}
              {(r.roadType || r.roadNote) && (
                <Row label="Road">{[r.roadType ? labelOf(ROAD_TYPES, r.roadType) : null, r.roadNote].filter(Boolean).join(" — ")}</Row>
              )}
              <Row label="Approval (owner says)">{r.approvalType ? labelOf(APPROVAL_TYPES, r.approvalType) : "Not sure / none"}</Row>
              <Row label="Bank loan">{r.loanAvailable === "yes" ? "Yes" : r.loanAvailable === "no" ? "No" : "Not sure"}</Row>
              {r.description && (
                <Row label="Description">
                  <span className="whitespace-pre-line">{r.description}</span>
                </Row>
              )}
            </dl>
          </section>

          <section className="card p-5 md:p-6">
            <h2 className="font-bold">Location</h2>
            <dl className="mt-3 divide-y divide-line/50">
              <Row label="Locality">{r.locality}</Row>
              <Row label="City">{r.city}</Row>
              {r.district && <Row label="District">{r.district}</Row>}
              {r.pincode && <Row label="PIN code">{r.pincode}</Row>}
              {r.address && <Row label="Address">{r.address}</Row>}
            </dl>
            <a href={mapHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-4">
              <Navigation className="size-4" /> {r.mapsUrl ? "Open owner's map link" : "Search locality on Google Maps"}
            </a>
          </section>

          <section className="card p-5 md:p-6">
            <h2 className="font-bold">
              Photos & videos <span className="font-normal text-muted">({media.length})</span>
            </h2>
            {media.length === 0 && !r.videoLink ? (
              <p className="mt-3 text-sm text-muted">No files uploaded.</p>
            ) : (
              <>
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((m) => (
                      <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl bg-surface-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
                {videos.map((m) => (
                  <video key={m.url} src={m.url} controls preload="metadata" className="mt-3 aspect-video w-full rounded-2xl bg-black" />
                ))}
                {r.videoLink && (
                  <a href={r.videoLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-3">
                    <ExternalLink className="size-4" /> Open video link
                  </a>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card space-y-3 p-5">
            <h2 className="font-bold">Decision</h2>
            {linked ? (
              <>
                <p className="text-sm text-muted">
                  Approved as {linked.code}.{" "}
                  {linked.isPublished ? "It is live on the website." : "It is currently hidden from the website."}
                </p>
                <Link href={`/admin/properties/${linked.id}`} className="btn btn-primary w-full">
                  Edit listing {linked.code}
                </Link>
                {linked.isPublished && (
                  <Link href={`/properties/${linked.slug}`} target="_blank" className="btn btn-ghost w-full">
                    <ExternalLink className="size-4" /> View on website
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  <strong className="text-ink">Approve &amp; publish</strong> puts this property on the website for everyone, with the owner&apos;s
                  photos. Owner details stay private. <strong className="text-ink">Reject</strong> keeps it off the website.
                </p>
                <form action={approveSellerAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton className="btn btn-primary w-full" pendingText="Publishing…">
                    <CircleCheck className="size-4" /> Approve &amp; publish
                  </SubmitButton>
                </form>
                {r.status !== "rejected" && (
                  <form action={rejectSellerAction} className="space-y-2">
                    <input type="hidden" name="id" value={r.id} />
                    <label className="block">
                      <span className="label">Reason (shown to the owner)</span>
                      <input name="reason" className="input" maxLength={500} placeholder="e.g. Documents are not clear. Please call us." />
                    </label>
                    <ConfirmSubmit message="Reject this property? It will not be shown on the website." className="btn btn-danger w-full">
                      <Ban className="size-4" /> Reject
                    </ConfirmSubmit>
                  </form>
                )}
              </>
            )}
          </section>
          <section className="card p-5">
            <SellerEditor key={r.status} id={r.id} status={r.status} notes={r.adminNotes} ownerMessage={r.ownerMessage} />
          </section>
          <form action={deleteSellerRequestAction} className="text-right">
            <input type="hidden" name="id" value={r.id} />
            <ConfirmSubmit message="Delete this request permanently?" className="btn btn-danger btn-sm">
              <Trash className="size-4" /> Delete request
            </ConfirmSubmit>
          </form>
        </aside>
      </div>
    </div>
  );
}
