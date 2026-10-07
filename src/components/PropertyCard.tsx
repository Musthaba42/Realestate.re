import Link from "next/link";
import { ArrowUpRight, Bath, BedDouble, Compass, MapPin, Maximize } from "@/components/glyphs";
import type { PropertyCardData } from "@/lib/properties";
import { FACINGS, PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { formatNumber, formatPriceShort } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { PropertyImage } from "./PropertyImage";
import { SoldStamp } from "./SoldStamp";

export function PropertyCard({ p, priority = false }: { p: PropertyCardData; priority?: boolean }) {
  const cover = p.media[0]?.url;
  return (
    <Link
      href={`/properties/${p.slug}`}
      className="group block rounded-[28px] border border-line/60 bg-surface p-2 transition-colors hover:border-faint"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-surface-2">
        <PropertyImage
          src={cover}
          alt={p.title}
          priority={priority}
          width={800}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="img-fade absolute inset-0" />
        {p.status === "sold" && <SoldStamp />}
        <div className="absolute inset-x-3 top-3 z-[2] flex flex-wrap items-start justify-between gap-2">
          <StatusBadge status={p.status} percent={p.constructionPercent} />
          <span className="badge">{labelOf(PROPERTY_TYPES, p.type)}</span>
        </div>
        <div className="absolute inset-x-4 bottom-3.5 z-[2] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[28px] leading-none">{formatPriceShort(p.price)}</p>
            <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-white/80">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {p.locality}, {p.city}
              </span>
              {p.distanceKm !== undefined && (
                <span className="shrink-0 font-semibold text-gold-2">
                  · {p.distanceKm < 1 ? "under 1 km" : `${p.distanceKm} km`} away
                </span>
              )}
            </p>
          </div>
          <span className="icon-btn transition-colors group-hover:bg-gold group-hover:text-on-gold">
            <ArrowUpRight className="size-[18px]" />
          </span>
        </div>
      </div>
      <div className="px-2 pb-1.5 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-[15px] font-semibold">{p.title}</h3>
          <span className="shrink-0 font-mono text-[10px] tracking-wider text-faint">{p.code}</span>
        </div>
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
          {p.bhk != null && (
            <span className="spec">
              <BedDouble className="size-3.5 text-muted" /> {p.bhk >= 5 ? "5+" : p.bhk} BHK
            </span>
          )}
          {p.bathrooms != null && (
            <span className="spec">
              <Bath className="size-3.5 text-muted" /> {p.bathrooms} Bath
            </span>
          )}
          <span className="spec">
            <Maximize className="size-3.5 text-muted" /> {formatNumber(p.totalSqft)} sq.ft
          </span>
          {p.facing && (
            <span className="spec">
              <Compass className="size-3.5 text-muted" /> {labelOf(FACINGS, p.facing)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
