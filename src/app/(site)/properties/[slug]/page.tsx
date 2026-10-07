import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Building,
  Car,
  Compass,
  Briefcase,
  FileText,
  Flag,
  GraduationCap,
  HardHat,
  Hospital,
  Layers,
  MapPin,
  Maximize,
  Navigation,
  Plane,
  Route,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Temple,
  Train,
  Wallet,
} from "@/components/glyphs";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import {
  APPROVAL_TYPES,
  CONSTRUCTION_STAGES,
  FACINGS,
  LANDMARK_KINDS,
  LOAN_DISCLAIMER,
  OPEN_STATUSES,
  PROPERTY_TYPES,
  RESIDENTIAL_TYPES,
  ROAD_TYPES,
  labelOf,
} from "@/lib/constants";
import {
  formatINR,
  formatNumber,
  formatPriceShort,
  mapsSearchLink,
  pricePerSqft,
  telLink,
  whatsappLink,
} from "@/lib/format";
import { PropertyGallery } from "@/components/site/PropertyGallery";
import { PropertyActions } from "@/components/site/PropertyActions";
import { FacingCompass } from "@/components/site/FacingCompass";
import { StatusBadge } from "@/components/StatusBadge";
import { PropertyCard } from "@/components/PropertyCard";
import { searchProperties } from "@/lib/properties";

type Props = { params: Promise<{ slug: string }> };

const LANDMARK_ICON: Record<string, React.ElementType> = {
  transport: Train,
  highway: Route,
  airport: Plane,
  school: GraduationCap,
  hospital: Hospital,
  temple: Temple,
  shopping: ShoppingBag,
  office: Briefcase,
  other: Flag,
};

function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km % 1 === 0 ? km : km.toFixed(1)} km`;
}

async function getProperty(slug: string) {
  return db.property.findFirst({
    where: { slug, isPublished: true },
    include: { media: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProperty(slug);
  if (!p) return { title: "Property not found" };
  const cover = p.media.find((m) => m.kind === "image")?.url;
  const description = `${formatPriceShort(p.price)} · ${formatNumber(p.totalSqft)} sq.ft · ${p.locality}, ${p.city}. ${
    p.description?.slice(0, 140) ?? ""
  }`;
  return {
    title: p.title.toLowerCase().includes(p.locality.toLowerCase()) ? p.title : `${p.title} – ${p.locality}`,
    description,
    alternates: { canonical: `/properties/${p.slug}` },
    openGraph: {
      title: `${p.title} – ${formatPriceShort(p.price)}`,
      description,
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProperty(slug), getSettings()]);
  if (!p) notFound();

  const gallery = p.media
    .filter((m) => m.kind === "image" || m.kind === "video" || m.kind === "youtube")
    .map((m) => ({ kind: m.kind as "image" | "video" | "youtube", url: m.url }));
  const landmarks = p.landmarks ?? [];
  const isResidential = RESIDENTIAL_TYPES.includes(p.type);
  const perSqft = pricePerSqft(p.price, p.totalSqft);
  const isOpen = OPEN_STATUSES.includes(p.status);
  const showConstruction =
    p.constructionStage != null && p.constructionStage !== "" && !(p.type === "land" && p.constructionStage === "not_started");
  const percent = Math.max(0, Math.min(100, p.constructionPercent ?? (p.constructionStage === "completed" ? 100 : 0)));
  const loanPercent = p.loanPercent ?? s.loanMaxPercent;
  const estLoan = p.loanAvailable ? Math.round((p.price * loanPercent) / 100) : 0;
  const mapHref =
    p.showExactLocation && p.mapsUrl ? p.mapsUrl : mapsSearchLink(`${p.locality}, ${p.city}${p.pincode ? " " + p.pincode : ""}`);
  const roadLabel = p.roadType ? (p.roadType === "other" ? p.roadNote || "—" : labelOf(ROAD_TYPES, p.roadType)) : null;
  const approvalLabel = p.approvalVerified && p.approvalType ? `${labelOf(APPROVAL_TYPES, p.approvalType)} Approved` : null;

  const similarQuery = new URLSearchParams({ type: p.type, area: p.locality }).toString();
  const [similarAll, sameArea] = await Promise.all([
    searchProperties({ type: p.type, sort: "newest" }),
    db.property.count({ where: { isPublished: true, locality: p.locality, status: { in: OPEN_STATUSES }, id: { not: p.id } } }),
  ]);
  const similar = similarAll.filter((x) => x.id !== p.id && OPEN_STATUSES.includes(x.status)).slice(0, 3);

  const waText = `Hi, I am interested in this property.\nProperty: ${p.title} – ${p.locality} (ID: ${p.code})\nPrice: ${formatINR(
    p.price,
  )}`;

  const tiles: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: Building, label: "Property type", value: p.subType || labelOf(PROPERTY_TYPES, p.type) },
    ...(p.facing ? [{ icon: Compass, label: "Facing", value: labelOf(FACINGS, p.facing) }] : []),
    { icon: Maximize, label: p.type === "land" ? "Land area" : "Total area", value: `${formatNumber(p.totalSqft)} sq.ft` },
    ...(p.builtUpSqft ? [{ icon: Ruler, label: "Built-up area", value: `${formatNumber(p.builtUpSqft)} sq.ft` }] : []),
    ...(p.carpetSqft ? [{ icon: Ruler, label: "Carpet area", value: `${formatNumber(p.carpetSqft)} sq.ft` }] : []),
    ...(roadLabel ? [{ icon: Route, label: "Road", value: roadLabel }] : []),
    ...(approvalLabel ? [{ icon: BadgeCheck, label: "Approval", value: approvalLabel }] : []),
    ...(p.floors != null ? [{ icon: Layers, label: "Total floors", value: String(p.floors) }] : []),
    ...(p.floorNo != null ? [{ icon: Layers, label: "Floor no.", value: p.floorNo === 0 ? "Ground" : String(p.floorNo) }] : []),
    ...(p.parking ? [{ icon: Car, label: "Parking", value: p.parking }] : []),
    ...(showConstruction
      ? [{ icon: HardHat, label: "Construction", value: p.constructionStage === "completed" ? "Completed" : `${percent}% done` }]
      : []),
  ];

  const amenities = isResidential
    ? [
        p.bedrooms != null && `${p.bedrooms} Bedroom${p.bedrooms === 1 ? "" : "s"}`,
        p.bathrooms != null && `${p.bathrooms} Bathroom${p.bathrooms === 1 ? "" : "s"}`,
        p.balcony ? `${p.balcony} Balcon${p.balcony === 1 ? "y" : "ies"}` : null,
        p.kitchen && "Kitchen",
        p.livingRoom && "Living room",
      ].filter(Boolean)
    : [];

  const summary = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={p.status} percent={p.constructionPercent} className="bg-surface-2" />
        <span className="badge bg-surface-2">ID: {p.code}</span>
      </div>
      <div>
        <h1 className="text-[26px] leading-tight md:text-[30px]">{p.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 shrink-0" />
          {p.showExactLocation && p.address ? p.address : `${p.locality}, ${p.city}`}
        </p>
      </div>
      <div>
        <p className="font-display text-[38px] leading-none text-foil">{formatINR(p.price)}</p>
        <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-muted">
          {p.isNegotiable && (
            <span className="rounded-md border border-gold/50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-gold-2">
              Negotiable price
            </span>
          )}
          {perSqft && <span className="font-mono text-[13px]">{formatINR(perSqft)}/sq.ft</span>}
        </p>
      </div>
      {p.loanAvailable && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Wallet className="size-4 shrink-0 text-accent" /> Bank loan available · up to {loanPercent}%*
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
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
            <Compass className="size-3.5 text-muted" /> {labelOf(FACINGS, p.facing)} facing
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="container-x pb-28 pt-4 md:pt-8 lg:pb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-10">
        {/* LEFT */}
        <div className="min-w-0 space-y-6">
          <PropertyGallery items={gallery} title={p.title} sold={p.status === "sold"} />

          <div className="card p-5 lg:hidden">{summary}</div>

          {/* Info tiles — like "Property type / Year built" in the reference */}
          <section aria-labelledby="overview">
            <h2 id="overview" className="mb-3 text-2xl">
              Overview
            </h2>
            {p.facing && (
              <div className="mb-2.5 flex items-center gap-4 rounded-2xl border border-line/70 bg-surface p-3 pr-5">
                <FacingCompass facing={p.facing} label={labelOf(FACINGS, p.facing)} className="size-20 shrink-0" />
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Facing</p>
                  <p className="font-display text-2xl">{labelOf(FACINGS, p.facing)}</p>
                  <p className="mt-0.5 text-xs text-faint">Direction of the main entrance / plot frontage</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {tiles.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-line/70 bg-surface p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2">
                    <Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-muted">{label}</p>
                    <p className="truncate text-sm font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {showConstruction && p.constructionStage !== "completed" && (
            <section className="card p-5" aria-labelledby="construction">
              <div className="flex items-center justify-between gap-3">
                <h2 id="construction" className="text-2xl">
                  Construction status
                </h2>
                <span className="font-mono text-2xl">{percent}%</span>
              </div>
              <div
                className="mt-4 h-3 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Construction progress"
              >
                <div className="h-full rounded-full bg-gradient-to-r from-warn to-accent" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted">
                Current stage: <span className="font-semibold text-ink">{labelOf(CONSTRUCTION_STAGES, p.constructionStage)}</span>
              </p>
            </section>
          )}

          {p.description && (
            <section aria-labelledby="about-property">
              <h2 id="about-property" className="mb-3 text-2xl">
                About this property
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{p.description}</p>
            </section>
          )}

          {amenities.length > 0 && (
            <section aria-labelledby="rooms">
              <h2 id="rooms" className="mb-3 text-2xl">
                Rooms & features
              </h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={String(a)} className="chip cursor-default text-ink">
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card p-5" aria-labelledby="approval">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                <h2 id="approval" className="text-xl">
                  Approval & documents
                </h2>
              </div>
              {approvalLabel ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-accent">
                    <BadgeCheck className="size-4" /> {approvalLabel} – verified by our team
                  </p>
                  {p.approvalNumber && <p className="text-muted">Approval no: {p.approvalNumber}</p>}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Approval and document details will be shared by our team during your enquiry and site visit.
                </p>
              )}
            </section>

            <section className="card p-5" aria-labelledby="road">
              <div className="flex items-center gap-2">
                <Route className="size-5" />
                <h2 id="road" className="text-xl">
                  Road access
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {roadLabel ? <span className="font-semibold text-ink">{roadLabel}</span> : "Details on request"}
                {p.roadNote && p.roadType !== "other" ? ` — ${p.roadNote}` : ""}
              </p>
            </section>
          </div>

          <section className="card p-5" aria-labelledby="loan">
            <div className="flex items-center gap-2">
              <Wallet className="size-5" />
              <h2 id="loan" className="text-xl">
                Bank loan
              </h2>
            </div>
            {p.loanAvailable ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl bg-surface-2 p-3">
                    <p className="text-[11px] text-muted">Financing support</p>
                    <p className="font-semibold">Up to {loanPercent}%*</p>
                  </div>
                  <div className="rounded-2xl bg-surface-2 p-3">
                    <p className="text-[11px] text-muted">Approx. loan amount</p>
                    <p className="font-semibold">{formatPriceShort(estLoan)}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-surface-2 p-3 sm:col-span-1">
                    <p className="text-[11px] text-muted">Your contribution (approx.)</p>
                    <p className="font-semibold">{formatPriceShort(p.price - estLoan)}</p>
                  </div>
                </div>
                {p.loanBanks && <p className="mt-3 text-sm text-muted">Banks: {p.loanBanks}</p>}
                <Link href={`/loan?property=${p.slug}`} className="btn btn-ghost btn-sm mt-4">
                  Check loan options <ArrowRight className="size-4" />
                </Link>
                <p className="mt-4 text-xs leading-relaxed text-faint">* {LOAN_DISCLAIMER}</p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Bank loan is not listed for this property. Contact us to discuss financing options.
              </p>
            )}
          </section>

          <section className="card p-5" aria-labelledby="location">
            <div className="flex items-center gap-2">
              <MapPin className="size-5" />
              <h2 id="location" className="text-xl">
                Location
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {p.showExactLocation && p.address ? `${p.address}, ` : ""}
              {p.locality}, {p.city}
              {p.district ? `, ${p.district}` : ""}
              {p.pincode ? ` – ${p.pincode}` : ""}
            </p>
            {!p.showExactLocation && (
              <p className="mt-1 text-xs text-faint">Exact location is shared by our team before the site visit.</p>
            )}
            <a href={mapHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm mt-4">
              <Navigation className="size-4" /> View on Google Maps
            </a>
          </section>

          {(landmarks.length > 0 || sameArea > 0) && (
            <section className="card p-5 md:p-6" aria-labelledby="locality">
              <p className="eyebrow">Explore the locality</p>
              <h2 id="locality" className="mt-2 text-2xl">
                Around {p.locality}
              </h2>
              {landmarks.length > 0 && (
                <ol className="mt-5 divide-y divide-line/60">
                  {landmarks.map((l, i) => {
                    const Icon = LANDMARK_ICON[l.kind] ?? Flag;
                    return (
                      <li key={l.name + i} className="flex items-center gap-3.5 py-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-gold-2">
                          <Icon className="size-[18px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{l.name}</p>
                          <p className="text-xs text-muted">{labelOf(LANDMARK_KINDS, l.kind)}</p>
                        </div>
                        <span className="dim-line hidden w-16 sm:block" aria-hidden="true" />
                        <span className="shrink-0 font-mono text-sm text-gold-2">{formatKm(l.distanceKm)}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {sameArea > 0 && (
                <Link
                  href={`/properties?area=${encodeURIComponent(p.locality)}`}
                  className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3.5 text-sm transition-colors hover:bg-surface-3"
                >
                  <span>
                    <span className="font-semibold">
                      {sameArea} more {sameArea === 1 ? "property" : "properties"}
                    </span>{" "}
                    <span className="text-muted">available in {p.locality}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              )}
              {landmarks.length > 0 && <p className="mt-3 text-xs text-faint">Distances are approximate.</p>}
            </section>
          )}
        </div>

        {/* RIGHT (desktop) */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 space-y-6 p-6">
            {summary}
            <PropertyActions
              variant="panel"
              propertyId={p.id}
              title={p.title}
              priceLabel={formatPriceShort(p.price)}
              isOpen={isOpen}
              callHref={telLink(s.phone)}
              whatsappHref={whatsappLink(s.whatsappNumber, waText)}
              similarHref={`/properties?${similarQuery}`}
            />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-faint">
              <FileText className="mt-0.5 size-3.5 shrink-0" />
              No sign-up needed. Share your name and number and our team will call you.
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14" aria-labelledby="similar">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="similar" className="section-title">
              Similar properties
            </h2>
            <Link href={`/properties?type=${p.type}`} className="btn btn-ghost btn-sm shrink-0">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((x) => (
              <PropertyCard key={x.id} p={x} />
            ))}
          </div>
        </section>
      )}

      <PropertyActions
        variant="bar"
        propertyId={p.id}
        title={p.title}
        priceLabel={formatPriceShort(p.price)}
        isOpen={isOpen}
        callHref={telLink(s.phone)}
        whatsappHref={whatsappLink(s.whatsappNumber, waText)}
        similarHref={`/properties?${similarQuery}`}
      />
    </div>
  );
}
