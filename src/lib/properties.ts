import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { FACINGS, OPEN_STATUSES, PROPERTY_STATUSES, PROPERTY_TYPE_VALUES } from "./constants";
import { haversineKm, validCoords, type LatLng } from "./geo";

export type SearchFilters = {
  type?: string;
  area?: string;
  min?: number;
  max?: number;
  sqmin?: number;
  sqmax?: number;
  bhk?: number;
  facing?: string;
  status?: string;
  sort?: string;
  /** Visitor position: sorts results nearest first. */
  near?: LatLng;
};

type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = one(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseFilters(params: RawParams): SearchFilters {
  const type = one(params.type);
  const facing = one(params.facing);
  const status = one(params.status);
  const sort = one(params.sort);
  const bhk = num(params.bhk);
  const nearRaw = one(params.near)?.split(",");
  const nearLat = nearRaw ? Number(nearRaw[0]) : NaN;
  const nearLng = nearRaw ? Number(nearRaw[1]) : NaN;
  return {
    near: validCoords(nearLat, nearLng) ? { lat: nearLat, lng: nearLng } : undefined,
    type: type && (PROPERTY_TYPE_VALUES as string[]).includes(type) ? type : undefined,
    area: one(params.area)?.slice(0, 80),
    min: num(params.min),
    max: num(params.max),
    sqmin: num(params.sqmin),
    sqmax: num(params.sqmax),
    bhk: bhk && bhk >= 1 && bhk <= 5 ? Math.floor(bhk) : undefined,
    facing: facing && FACINGS.some((f) => f.value === facing) ? facing : undefined,
    status: status && PROPERTY_STATUSES.some((s) => s.value === status) ? status : undefined,
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
  };
}

export function filtersToQuery(f: SearchFilters): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === "" || (k === "sort" && v === "newest")) continue;
    if (k === "near") {
      const n = v as LatLng;
      p.set("near", `,`);
      continue;
    }
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function buildSearchText(p: {
  title: string;
  locality: string;
  city: string;
  district?: string | null;
  pincode?: string | null;
  subType?: string | null;
  address?: string | null;
}): string {
  return [p.title, p.locality, p.city, p.district, p.pincode, p.subType, p.address]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const cardSelect = {
  id: true,
  slug: true,
  code: true,
  title: true,
  type: true,
  locality: true,
  city: true,
  price: true,
  isNegotiable: true,
  totalSqft: true,
  bhk: true,
  bathrooms: true,
  facing: true,
  status: true,
  constructionPercent: true,
  isFeatured: true,
  media: {
    where: { kind: "image" },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    take: 1,
    select: { url: true },
  },
} satisfies Prisma.PropertySelect;

export type PropertyCardData = Prisma.PropertyGetPayload<{ select: typeof cardSelect }> & {
  /** Distance from the visitor in whole km (only when a position was given). */
  distanceKm?: number;
};

const cardSelectWithPos = { ...cardSelect, lat: true, lng: true } satisfies Prisma.PropertySelect;

/** Adds a rounded distance and removes the property's coordinates before the data goes anywhere. */
function withDistance<T extends { lat: number | null; lng: number | null }>(row: T, near: LatLng) {
  const { lat, lng, ...rest } = row;
  const km = lat != null && lng != null ? haversineKm(near, { lat, lng }) : undefined;
  return { ...rest, distanceKm: km === undefined ? undefined : Math.round(km), _km: km };
}

export async function searchProperties(f: SearchFilters): Promise<PropertyCardData[]> {
  const and: Prisma.PropertyWhereInput[] = [{ isPublished: true }];
  if (f.type) and.push({ type: f.type });
  if (f.area) {
    const words = f.area.toLowerCase().split(/[\s,]+/).filter(Boolean).slice(0, 5);
    for (const w of words) and.push({ searchText: { contains: w } });
  }
  if (f.min !== undefined) and.push({ price: { gte: f.min } });
  if (f.max !== undefined) and.push({ price: { lte: f.max } });
  if (f.sqmin !== undefined) and.push({ totalSqft: { gte: f.sqmin } });
  if (f.sqmax !== undefined) and.push({ totalSqft: { lte: f.sqmax } });
  if (f.bhk !== undefined) and.push(f.bhk >= 5 ? { bhk: { gte: 5 } } : { bhk: f.bhk });
  if (f.facing) and.push({ facing: f.facing });
  // "For sale" also covers properties that are still under construction.
  if (f.status) and.push(f.status === "available" ? { status: { in: ["available", "under_construction"] } } : { status: f.status });

  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    f.sort === "price_asc"
      ? [{ price: "asc" }]
      : f.sort === "price_desc"
        ? [{ price: "desc" }]
        : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  if (f.near) {
    const near = f.near;
    const rows = await db.property.findMany({ where: { AND: and }, select: cardSelectWithPos, take: 300 });
    return rows
      .map((r) => withDistance(r, near))
      .sort((a, b) => Number(isClosed(a.status)) - Number(isClosed(b.status)) || (a._km ?? Infinity) - (b._km ?? Infinity))
      .map(({ _km, ...card }) => card);
  }

  const rows = await db.property.findMany({ where: { AND: and }, orderBy, select: cardSelect, take: 120 });
  // Sold / unavailable properties go last.
  return rows.sort((a, b) => Number(isClosed(a.status)) - Number(isClosed(b.status)));
}

/** The properties closest to a visitor, with distances rounded to whole km. */
export async function nearbyProperties(near: LatLng, limit = 6): Promise<PropertyCardData[]> {
  const rows = await db.property.findMany({
    where: { isPublished: true, status: { in: OPEN_STATUSES }, lat: { not: null }, lng: { not: null } },
    select: cardSelectWithPos,
    take: 500,
  });
  return rows
    .map((r) => withDistance(r, near))
    .sort((a, b) => (a._km ?? Infinity) - (b._km ?? Infinity))
    .slice(0, limit)
    .map(({ _km, ...card }) => card);
}

export function isClosed(status: string): boolean {
  return status === "sold" || status === "not_available" || status === "reserved";
}

export async function featuredProperties(limit = 6): Promise<PropertyCardData[]> {
  const featured = await db.property.findMany({
    where: { isPublished: true, isFeatured: true, status: { notIn: ["sold", "not_available"] } },
    orderBy: { updatedAt: "desc" },
    select: cardSelect,
    take: limit,
  });
  if (featured.length >= limit) return featured;
  const more = await db.property.findMany({
    where: {
      isPublished: true,
      status: { notIn: ["sold", "not_available"] },
      id: { notIn: featured.map((p) => p.id) },
    },
    orderBy: { createdAt: "desc" },
    select: cardSelect,
    take: limit - featured.length,
  });
  return [...featured, ...more];
}

export async function localities(): Promise<string[]> {
  const rows = await db.property.findMany({
    where: { isPublished: true },
    select: { locality: true, city: true },
    distinct: ["locality"],
    orderBy: { locality: "asc" },
  });
  return rows.map((r) => r.locality);
}

/** Areas with properties on sale right now, busiest first. */
export async function localityCounts(limit = 12): Promise<{ locality: string; city: string; count: number }[]> {
  const rows = await db.property.groupBy({
    by: ["locality", "city"],
    where: { isPublished: true, status: { in: OPEN_STATUSES } },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ locality: r.locality, city: r.city, count: r._count._all }))
    .sort((a, b) => b.count - a.count || a.locality.localeCompare(b.locality))
    .slice(0, limit);
}

export async function typeCounts(): Promise<Record<string, number>> {
  const rows = await db.property.groupBy({
    by: ["type"],
    where: { isPublished: true, status: { notIn: ["sold", "not_available"] } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.type, r._count._all]));
}
