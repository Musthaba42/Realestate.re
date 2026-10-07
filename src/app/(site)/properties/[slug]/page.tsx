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
  FileText,
  HardHat,
  Layers,
  MapPin,
  Maximize,
  Navigation,
  Route,
  Ruler,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import {
  APPROVAL_TYPES,
  CONSTRUCTION_STAGES,
  FACINGS,
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
  youtubeId,
} from "@/lib/format";
import { PropertyGallery } from "@/components/site/PropertyGallery";
import { PropertyActions } from "@/components/site/PropertyActions";
import { StatusBadge } from "@/components/StatusBadge";
import { PropertyCard } from "@/components/PropertyCard";
import { searchProperties } from "@/lib/properties";

type Props = { params: Promise<{ slug: string }> };

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

  const images = p.media.filter((m) => m.kind === "image").map((m) => ({ url: m.url, category: m.category }));
  const videos = p.media.filter((m) => m.kind === "video" || m.kind === "youtube");
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
  const similar = (await searchProperties({ type: p.type, sort: "newest" }))
    .filter((x) => x.id !== p.id && OPEN_STATUSES.includes(x.status))
    .slice(0, 3);

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
        <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-[28px]">{p.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4 shrink-0" />
          {p.showExactLocation && p.address ? p.address : `${p.locality}, ${p.city}`}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="text-[34px] font-bold leading-none tracking-tight">{formatINR(p.price)}</p>
        <p className="pb-1 text-sm text-muted">
          {perSqft ? `${formatINR(perSqft)}/sq.ft` : ""}
          {perSqft ? " · " : ""}
          {p.isNegotiable ? "Slightly negotiable" : "Fixed price"}
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
          <PropertyGallery images={images} title={p.title} hasVideo={videos.length > 0} sold={p.status === "sold"} />

          <div className="card p-5 lg:hidden">{summary}</div>

          {/* Info tiles — like "Property type / Year built" in the reference */}
          <section aria-labelledby="overview">
            <h2 id="overview" className="mb-3 text-lg font-bold">
              Overview
            </h2>
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
                <h2 id="construction" className="text-lg font-bold">
                  Construction status
                </h2>
                <span className="text-2xl font-bold">{percent}%</span>
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
              <h2 id="about-property" className="mb-3 text-lg font-bold">
                About this property
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{p.description}</p>
            </section>
          )}

          {amenities.length > 0 && (
            <section aria-labelledby="rooms">
              <h2 id="rooms" className="mb-3 text-lg font-bold">
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
                <h2 id="approval" className="font-bold">
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
                <h2 id="road" className="font-bold">
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
              <h2 id="loan" className="font-bold">
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
              <h2 id="location" className="font-bold">
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

          {videos.length > 0 && (
            <section id="videos" className="scroll-mt-24" aria-labelledby="videos-title">
              <h2 id="videos-title" className="mb-3 text-lg font-bold">
                Videos
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {videos.map((v) => {
                  const yt = v.kind === "youtube" ? youtubeId(v.url) : null;
                  return (
                    <div key={v.id} className="overflow-hidden rounded-3xl border border-line/70 bg-black">
                      {yt ? (
                        <iframe
                          className="aspect-video w-full"
                          src={`https://www.youtube-nocookie.com/embed/${yt}`}
                          title={`${p.title} video`}
                          loading="lazy"
                          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                        />
                      ) : v.kind === "video" ? (
                        <video className="aspect-video w-full" src={v.url} controls preload="metadata" playsInline />
                      ) : null}
                    </div>
                  );
                })}
              </div>
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
