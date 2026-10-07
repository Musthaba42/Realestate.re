import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchFilters, type FilterState } from "@/components/site/SearchFilters";
import { LeadForm } from "@/components/site/LeadForm";
import { localities, parseFilters, searchProperties } from "@/lib/properties";
import { getSettings } from "@/lib/settings";
import { PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { telLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Find Property",
  description: "Search land, houses, apartments and commercial properties by area.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const f = parseFilters(params);
  const [results, locs, s] = await Promise.all([searchProperties(f), localities(), getSettings()]);

  const initial: FilterState = {
    type: f.type ?? "",
    area: f.area ?? "",
    min: f.min !== undefined ? String(f.min) : "",
    max: f.max !== undefined ? String(f.max) : "",
    sqmin: f.sqmin !== undefined ? String(f.sqmin) : "",
    sqmax: f.sqmax !== undefined ? String(f.sqmax) : "",
    bhk: f.bhk !== undefined ? String(f.bhk) : "",
    facing: f.facing ?? "",
    status: f.status ?? "",
    sort: f.sort ?? "newest",
    near: f.near ? `${f.near.lat.toFixed(2)},${f.near.lng.toFixed(2)}` : "",
  };

  const typeLabel = f.type ? labelOf(PROPERTY_TYPES, f.type) : "Properties";
  const heading = f.area ? `${typeLabel} in ${f.area}` : f.type ? `${typeLabel} for sale` : "All properties";

  const searchFilters: Record<string, string> = {};
  for (const [k, v] of Object.entries(initial)) if (v && k !== "sort" && k !== "near") searchFilters[k] = v;

  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <div className="mb-5">
        <p className="eyebrow">Find property</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">{heading}</h1>
      </div>

      <div className="sticky top-16 z-30 -mx-4 bg-bg/90 px-4 py-3 backdrop-blur-xl md:top-[72px] md:-mx-6 md:px-6">
        <SearchFilters key={JSON.stringify(initial)} initial={initial} localities={locs} />
      </div>

      <p className="mb-4 mt-4 text-sm text-muted" aria-live="polite">
        {results.length} {results.length === 1 ? "property" : "properties"} found
      </p>

      {results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p, i) => (
            <PropertyCard key={p.id} p={p} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
          <div className="card flex flex-col items-center justify-center p-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-surface-2">
              <SearchX className="size-8 text-muted" />
            </span>
            <h2 className="mt-5 text-xl font-bold">No matching properties right now</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Try a nearby area or remove some filters. Or leave your number — our team will find properties for you
              {f.area ? ` in ${f.area}` : ""}.
            </p>
          </div>
          <div className="card p-5 md:p-6">
            <h2 className="text-lg font-bold">Didn&apos;t find it? We&apos;ll find it for you.</h2>
            <p className="mb-5 mt-1 text-sm text-muted">Your search details are sent along automatically.</p>
            <LeadForm
              source="no_results"
              searchFilters={searchFilters}
              submitLabel="Find properties for me"
              showMessage
              messagePlaceholder="Any other requirement? (optional)"
              callHref={telLink(s.phone)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
