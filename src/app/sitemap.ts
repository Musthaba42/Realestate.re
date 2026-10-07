import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const props = await db.property.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/properties", "/sell", "/loan", "/about", "/team", "/contact", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...props.map((p) => ({ url: `${base}/properties/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}
