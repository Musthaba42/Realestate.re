import "server-only";

export type LatLng = { lat: number; lng: number };

/** Straight-line distance in km between two points on the Earth. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough bounding box of India — rejects obviously wrong values. */
export function validCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 98;
}

/** Reads a position out of a Google Maps URL (any of the usual forms). */
export function coordsFromUrl(url: string): LatLng | null {
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i,
    /\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = re.exec(url);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (validCoords(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

const MAPS_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "www.google.com", "google.com", "maps.google.com", "www.google.co.in"]);

/** Follows a short Google Maps link (maps.app.goo.gl) to find the position it points to. */
async function resolveShortLink(url: string): Promise<LatLng | null> {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    if (u.protocol !== "https:" || !MAPS_HOSTS.has(u.hostname)) return null; // never fetch other sites
    const direct = coordsFromUrl(current);
    if (direct) return direct;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(current, { redirect: "manual", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0" } });
      const loc = res.headers.get("location");
      if (!loc) return null;
      current = new URL(loc, current).toString();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return coordsFromUrl(current);
}

/** Looks up an area name (e.g. "Urapakkam, Chennai") using OpenStreetMap's free search. */
export async function geocodeArea(query: string): Promise<LatLng | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
      { signal: ctrl.signal, headers: { "User-Agent": "GoldenGroupsRealEstate/1.0 (property listing site)" } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat: string; lon: string }[];
    const lat = Number(rows[0]?.lat);
    const lng = Number(rows[0]?.lon);
    return validCoords(lat, lng) ? { lat, lng } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Best-effort position of a property: from its Google Maps link if it has one,
 * otherwise from the area name (approximate, to the area rather than the plot).
 */
export async function locate(opts: { mapsUrl?: string | null; locality: string; city: string }): Promise<LatLng | null> {
  if (opts.mapsUrl) {
    const fromUrl = coordsFromUrl(opts.mapsUrl) ?? (await resolveShortLink(opts.mapsUrl));
    if (fromUrl) return fromUrl;
  }
  const parts = opts.locality.split(",").map((s) => s.trim()).filter(Boolean);
  // Try the full area first, then the most general part (e.g. "Urapakkam").
  const base = [opts.locality, ...parts.slice().reverse()];
  // OpenStreetMap spells some Tamil Nadu towns differently (Guduvancheri, Kattangulathur).
  const spell = (s: string) => s.replace(/chery\b/gi, "cheri").replace(/kulathur\b/gi, "gulathur").replace(/kolathur\b/gi, "golathur");
  const names = [...new Set(base.flatMap((n) => [n, spell(n)]))];
  const tries = [...names.map((n) => `${n}, ${opts.city}`), ...names.map((n) => `${n}, India`)];
  for (const q of [...new Set(tries)]) {
    const hit = await geocodeArea(q);
    if (hit) return hit;
  }
  return null;
}
