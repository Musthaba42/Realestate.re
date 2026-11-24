import Link from "next/link";
import { ArrowUpRight, MapPin } from "@/components/glyphs";
import type { PropertyCardData } from "@/lib/properties";
import { FACINGS, PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { formatNumber, formatPriceShort } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { PropertyImage } from "./PropertyImage";
import { SoldStamp } from "./SoldStamp";

export function PropertyCard({ p, priority = false }: { p: PropertyCardData; priority?: boolean }) {
  const cover = p.media[0]?.url;
  const specs = [
    p.bhk != null ? `${p.bhk >= 5 ? "5+" : p.bhk} BHK` : null,
    p.bathrooms != null ? `${p.bathrooms} Bath` : null,
    `${formatNumber(p.totalSqft)} sq.ft`,
    p.facing ? `${labelOf(FACINGS, p.facing)} facing` : null,
  ].filter(Boolean);

  return (
    <Link href={`/properties/${p.slug}`} className="group block rounded-card focus-visible:outline-offset-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-2 ring-1 ring-line/70 transition-[box-shadow] duration-300 group-hover:ring-gold/45">
        <PropertyImage
          src={cover}
          alt={p.title}
          priority={priority}
          width={800}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
        />
        <div className="img-fade pointer-events-none absolute inset-0" />
        {p.status === "sold" && <SoldStamp />}
        <div className="absolute inset-x-3 top-3 z-[2] flex flex-wrap items-start justify-between gap-2">
          <StatusBadge status={p.status} percent={p.constructionPercent} />
          <span className="badge">{labelOf(PROPERTY_TYPES, p.type)}</span>
        </div>
        <div className="absolute inset-x-4 bottom-3.5 z-[2] flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-[30px] font-semibold leading-none tracking-tight text-white">{formatPriceShort(p.price)}</p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-2">Negotiable</p>
          </div>
          <span className="icon-btn transition-colors group-hover:border-gold group-hover:bg-gold group-hover:text-on-gold">
            <ArrowUpRight className="size-[18px]" />
          </span>
        </div>
      </div>

      <div className="px-1 pt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-[15px] font-semibold transition-colors group-hover:text-gold-2">{p.title}</h3>
          <span className="shrink-0 font-mono text-[10px] tracking-wider text-faint">{p.code}</span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
          <MapPin className="size-3.5 shrink-0 text-gold/80" />
          <span className="truncate">
            {p.locality}, {p.city}
          </span>
          {p.distanceKm !== undefined && (
            <span className="shrink-0 font-semibold text-gold-2">· {p.distanceKm < 1 ? "under 1 km" : `${p.distanceKm} km`} away</span>
          )}
        </p>
        <p className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1 border-t border-line/60 pt-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
          {specs.map((s, i) => (
            <span key={s} className="flex items-center gap-2 whitespace-nowrap">
              {i > 0 && <span className="text-gold/60" aria-hidden="true">·</span>}
              {s}
            </span>
          ))}
        </p>
      </div>
    </Link>
  );
}
