import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

// Public data that changes only when the team edits something (site settings, home-page
// listings, area lists) is cached instead of being read from MongoDB on every visit.
// Every admin change calls revalidateSiteData(); the cache also expires on its own after
// CACHE_SECONDS, so changes made outside the dashboard (scripts, Prisma Studio) show up too.

export const SITE_DATA_TAG = "site-data";
const CACHE_SECONDS = 300;

/** Wrap a database read so its (JSON-safe) result is cached under the site-data tag. */
export function cachedSiteData<Args extends unknown[], R>(fn: (...args: Args) => Promise<R>, key: string) {
  return unstable_cache(fn, [key], { tags: [SITE_DATA_TAG], revalidate: CACHE_SECONDS });
}

/** Call after any change to properties, media, team or settings. */
export function revalidateSiteData() {
  revalidateTag(SITE_DATA_TAG);
  revalidatePath("/", "layout");
}
