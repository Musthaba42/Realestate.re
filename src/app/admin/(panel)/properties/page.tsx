import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Star } from "@/components/glyphs";
import { db } from "@/lib/db";
import { PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { formatPriceShort } from "@/lib/format";
import { PropertyImage } from "@/components/PropertyImage";
import { Pill } from "@/components/admin/Pill";
import { QuickPropertyStatus } from "@/components/admin/QuickStatus";
import { quickTogglePropertyAction } from "../../actions";

export const metadata: Metadata = { title: "Properties" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPropertiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const type = typeof sp.type === "string" && PROPERTY_TYPES.some((t) => t.value === sp.type) ? sp.type : "";
  const vis = sp.vis === "live" || sp.vis === "hidden" ? sp.vis : "";

  const properties = await db.property.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(vis ? { isPublished: vis === "live" } : {}),
      ...(q ? { OR: [{ searchText: { contains: q } }, { code: { contains: q.toUpperCase() } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      media: { where: { kind: "image" }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      _count: { select: { leads: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Properties</h1>
          <p className="mt-1 text-sm text-muted">{properties.length} shown</p>
        </div>
        <Link href="/admin/properties/new" className="btn btn-primary">
          <Plus className="size-4" /> Add property
        </Link>
      </div>

      {sp.deleted && <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">Property deleted.</p>}

      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} className="input max-w-xs flex-1" placeholder="Search title, area or ID" />
        <select name="type" defaultValue={type} className="input w-auto">
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select name="vis" defaultValue={vis} className="input w-auto">
          <option value="">Live & hidden</option>
          <option value="live">Live only</option>
          <option value="hidden">Hidden / drafts</option>
        </select>
        <button type="submit" className="btn btn-soft">
          Filter
        </button>
      </form>

      <div className="card overflow-hidden">
        {properties.length === 0 ? (
          <p className="p-8 text-center text-muted">No properties found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Leads</th>
                  <th>Visible</th>
                  <th>Featured</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/properties/${p.id}`} className="flex min-w-[260px] items-center gap-3">
                        <PropertyImage src={p.media[0]?.url} alt="" width={200} className="size-14 shrink-0 rounded-xl object-cover" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold hover:underline">{p.title}</span>
                          <span className="block truncate text-xs text-muted">
                            {p.code} · {labelOf(PROPERTY_TYPES, p.type)} · {p.locality}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap font-semibold">{formatPriceShort(p.price)}</td>
                    <td>
                      <QuickPropertyStatus key={p.status} id={p.id} status={p.status} />
                    </td>
                    <td>{p._count.leads}</td>
                    <td>
                      <form action={quickTogglePropertyAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="field" value="isPublished" />
                        <button type="submit" title={p.isPublished ? "Hide from website" : "Show on website"} aria-label={p.isPublished ? "Hide from website" : "Show on website"}>
                          {p.isPublished ? (
                            <Pill value="live" label="Live" />
                          ) : (
                            <Pill value="hidden" label="Hidden" />
                          )}
                        </button>
                      </form>
                    </td>
                    <td>
                      <form action={quickTogglePropertyAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="field" value="isFeatured" />
                        <button
                          type="submit"
                          className={`icon-btn icon-btn-solid size-8 ${p.isFeatured ? "text-warn" : "text-faint"}`}
                          title={p.isFeatured ? "Remove from featured" : "Mark as featured"}
                          aria-label={p.isFeatured ? "Remove from featured" : "Mark as featured"}
                        >
                          <Star className={`size-4 ${p.isFeatured ? "fill-current" : ""}`} />
                        </button>
                      </form>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        {p.isPublished ? (
                          <Link href={`/properties/${p.slug}`} target="_blank" className="icon-btn icon-btn-solid size-8" aria-label="View on website" title="View on website">
                            <Eye className="size-4" />
                          </Link>
                        ) : (
                          <span className="icon-btn icon-btn-solid size-8 opacity-40" title="Hidden from website">
                            <EyeOff className="size-4" />
                          </span>
                        )}
                        <Link href={`/admin/properties/${p.id}`} className="icon-btn icon-btn-solid size-8" aria-label="Edit" title="Edit">
                          <Pencil className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
