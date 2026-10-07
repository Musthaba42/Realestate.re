import { NextResponse } from "next/server";
import { nearbyProperties } from "@/lib/properties";
import { validCoords } from "@/lib/geo";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// "Properties near you". The visitor's position is used for this one request only and is never stored.
// Distances are rounded to whole km and property coordinates are never returned.
export async function GET(req: Request) {
  if (!rateLimit(`nearby:${clientIp(req.headers)}`, 30, 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a moment." }, { status: 429 });
  }
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!validCoords(lat, lng)) {
    return NextResponse.json({ ok: false, error: "Could not read your location." }, { status: 400 });
  }
  const items = await nearbyProperties({ lat, lng }, 6);
  return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}
