import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash } from "@/components/glyphs";
import { db } from "@/lib/db";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { DocumentManager, MediaManager } from "@/components/admin/MediaManager";
import { ConfirmSubmit } from "@/components/admin/ui";
import { Pill } from "@/components/admin/Pill";
import { deletePropertyAction } from "../../../actions";

export const metadata: Metadata = { title: "Edit property" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPropertyPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  const property = await db.property.findUnique({
    where: { id },
    include: {
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      documents: { orderBy: { createdAt: "asc" } },
      _count: { select: { leads: true } },
    },
  });
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/properties" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Properties
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{property.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{property.code}</span>
              <Pill value={property.isPublished ? "live" : "hidden"} label={property.isPublished ? "Live on website" : "Hidden"} />
              {property._count.leads > 0 && (
                <Link href={`/admin/leads?property=${property.id}`} className="underline">
                  {property._count.leads} lead{property._count.leads === 1 ? "" : "s"}
                </Link>
              )}
              {property.sellerRequestId && (
                <Link href={`/admin/sellers/${property.sellerRequestId}`} className="underline">
                  From an owner submission
                </Link>
              )}
            </div>
          </div>
          {property.isPublished && (
            <Link href={`/properties/${property.slug}`} target="_blank" className="btn btn-ghost btn-sm">
              <ExternalLink className="size-4" /> View on website
            </Link>
          )}
        </div>
      </div>

      {(property.lat == null || property.lng == null) && (
        <p className="rounded-2xl bg-warn/10 px-4 py-3 text-sm text-warn">
          This property has no map position, so it will not appear in “Properties near you”. Add a Google Maps link, or type the latitude and
          longitude, in the Location section below and save.
        </p>
      )}
      {sp.created && (
        <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">
          Property created{property.isPublished ? " and live on the website" : " (hidden from the website)"}. You can add more photos,
          videos and documents below.
        </p>
      )}
      {sp.uploadErrors && (
        <p className="rounded-2xl bg-warn/10 px-4 py-3 text-sm text-warn">
          Some files could not be uploaded. Please add them again in Photos &amp; videos below.
        </p>
      )}
      {sp.approved && (
        <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">
          Approved: this property is now live on the website. Check the details and photos below. Tick “Approval verified by our
          team” only after checking the documents.
        </p>
      )}

      <MediaManager propertyId={property.id} media={property.media} />
      <PropertyForm property={property} />
      <DocumentManager propertyId={property.id} documents={property.documents} />

      <section className="card flex flex-wrap items-center justify-between gap-4 border-danger/30 p-5 md:p-6">
        <div>
          <h2 className="font-bold">Delete property</h2>
          <p className="mt-0.5 text-sm text-muted">
            Removes the listing, its photos, videos and documents. Leads are kept. To hide it temporarily, untick “Show on website”
            instead.
          </p>
        </div>
        <form action={deletePropertyAction}>
          <input type="hidden" name="id" value={property.id} />
          <ConfirmSubmit message={`Delete "${property.title}" permanently? This cannot be undone.`} className="btn btn-danger">
            <Trash className="size-4" /> Delete
          </ConfirmSubmit>
        </form>
      </section>
    </div>
  );
}
