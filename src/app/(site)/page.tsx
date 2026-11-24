import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building,
  FileText,
  Handshake,
  House,
  Landmark,
  LandPlot,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Tag,
  Upload,
} from "@/components/glyphs";
import { getSettings } from "@/lib/settings";
import { featuredProperties, localities, localityGuide, spotlightProperties, typeCounts } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { HeroSearch } from "@/components/site/HeroSearch";
import { HeroShowcase, type HeroSlide } from "@/components/site/HeroShowcase";
import { SplitSpotlight, type SpotlightSlide } from "@/components/site/SplitSpotlight";
import { NearbySection } from "@/components/site/NearbySection";
import { LANDMARK_ICON } from "@/components/landmark-icons";
import { WhatsAppIcon } from "@/components/icons";
import { displayPhone, formatKm, formatNumber, formatPriceShort, telLink, whatsappLink } from "@/lib/format";
import { FACINGS, PROPERTY_TYPES, labelOf } from "@/lib/constants";

const TYPE_TILES = [
  { value: "land", label: "Land & Plots", desc: "Residential & commercial plots", icon: LandPlot },
  { value: "house", label: "Houses & Villas", desc: "Individual & new houses", icon: House },
  { value: "apartment", label: "Apartments", desc: "Flats in gated communities", icon: Building },
  { value: "commercial", label: "Commercial", desc: "Buildings, shops & land", icon: Landmark },
];

const REASONS = [
  { icon: BadgeCheck, title: "Clear documents", text: "We check approvals and papers, and walk you through them before you decide." },
  { icon: Tag, title: "Negotiable prices", text: "One clear price on every property, always open to negotiation with the owner." },
  { icon: Handshake, title: "Site visits arranged", text: "We take you to the property and meet the owner with you." },
  { icon: FileText, title: "End-to-end support", text: "Negotiation, agreement, documentation and registration." },
];

const SELL_STEPS = [
  { icon: Upload, title: "You submit", text: "Details, photos and videos from your account." },
  { icon: ShieldCheck, title: "Only our admin sees it", text: "Nothing is posted on the website automatically." },
  { icon: Pencil, title: "Admin reviews & edits", text: "We check and correct the details with you." },
  { icon: BadgeCheck, title: "Published by us", text: "It goes live only when the admin publishes it." },
];

export default async function HomePage() {
  const [s, featured, locs, guide, byType, fresh] = await Promise.all([
    getSettings(),
    featuredProperties(6),
    localities(),
    localityGuide(9),
    typeCounts(),
    spotlightProperties(6),
  ]);

  const slides: HeroSlide[] = featured.slice(0, 5).map((p) => ({
    slug: p.slug,
    src: p.media[0]?.url ?? null,
    title: p.title,
    price: formatPriceShort(p.price),
    place: `${p.locality}, ${p.city}`,
    code: p.code,
    type: labelOf(PROPERTY_TYPES, p.type),
  }));

  const spotlight: SpotlightSlide[] = fresh.map((p) => ({
    slug: p.slug,
    src: p.media[0]!.url,
    title: p.title,
    price: formatPriceShort(p.price),
    place: `${p.locality}, ${p.city}`,
    type: labelOf(PROPERTY_TYPES, p.type),
    code: p.code,
    specs: [
      p.bhk != null ? `${p.bhk >= 5 ? "5+" : p.bhk} BHK` : null,
      `${formatNumber(p.totalSqft)} sq.ft`,
      p.facing ? `${labelOf(FACINGS, p.facing)} facing` : null,
      p.status === "under_construction" ? "Under construction · For sale" : null,
    ].filter((x): x is string => Boolean(x)),
  }));

  return (
    <>
      {/* HERO — full-bleed photos of the featured properties */}
      <HeroShowcase slides={slides}>
        <p className="eyebrow hidden sm:inline-flex">Land · Houses · Apartments · Commercial</p>
        <h1 className="text-[44px] leading-[0.98] sm:mt-4 sm:text-[64px] lg:text-[84px]">{s.heroTitle}</h1>
        {s.heroSubtitle && <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/80 md:text-lg">{s.heroSubtitle}</p>}
        <div className="mt-8 max-w-xl">
          <HeroSearch localities={locs} />
        </div>
      </HeroShowcase>

      {/* NEAR YOU */}
      <NearbySection />

      {/* SPOTLIGHT — half original photo, half background effect; the sides swap on their own */}
      {spotlight.length > 0 && (
        <section className="container-x section pb-0 md:pb-0" aria-labelledby="spotlight-title">
          <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
            <div>
              <p className="eyebrow">Fresh on the market</p>
              <h2 id="spotlight-title" className="section-title mt-3">
                New listings in focus
              </h2>
            </div>
            <Link href="/properties" className="btn btn-ghost btn-sm shrink-0">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <SplitSpotlight slides={spotlight} />
        </section>
      )}

      {/* FEATURED */}
      <section className="container-x section">
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="section-title mt-3">Featured properties</h2>
          </div>
          <Link href="/properties" className="btn btn-ghost btn-sm shrink-0">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="survey-grid flex flex-col items-center gap-4 rounded-card border border-line/70 p-10 text-center">
            <p className="max-w-md text-muted">
              New properties are being added. Tell us the area and budget you want and we&apos;ll call you with matching options.
            </p>
            <a href={whatsappLink(s.whatsappNumber, "Hi, I am looking for a property.")} className="btn btn-primary">
              <WhatsAppIcon /> WhatsApp us
            </a>
          </div>
        )}
      </section>

      {/* BROWSE BY TYPE — one ruled band, with live counts */}
      <section className="container-x pb-14 md:pb-20" aria-labelledby="types-title">
        <h2 id="types-title" className="section-title">
          Browse by property type
        </h2>
        <div className="mt-8 grid grid-cols-2 border-y border-line/70 lg:grid-cols-4">
          {TYPE_TILES.map(({ value, label, desc, icon: Icon }, i) => {
            const n = byType[value] ?? 0;
            return (
              <Link
                key={value}
                href={`/properties?type=${value}`}
                className={`group relative flex min-h-48 flex-col justify-between gap-8 p-5 transition-colors hover:bg-surface md:p-7 ${
                  i % 2 === 1 ? "border-l border-line/70" : ""
                } ${i >= 2 ? "border-t border-line/70 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <Icon className="size-8 text-gold-2" strokeWidth={1.4} />
                  <ArrowUpRight className="size-5 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-2" />
                </div>
                <div>
                  <h3 className="font-display text-2xl leading-tight md:text-[28px]">{label}</h3>
                  <p className="mt-1 text-xs text-muted md:text-sm">{desc}</p>
                  <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">{n > 0 ? `${n} listed` : "Ask us"}</p>
                </div>
                <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* EXPLORE LOCALITY — available areas and how far the big landmarks are */}
      {guide.length > 0 && (
        <section className="survey-grid border-y border-line/70" aria-labelledby="areas-title">
          <div className="container-x section">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="eyebrow">Explore locality</p>
                <h2 id="areas-title" className="section-title mt-3">
                  Available areas &amp; nearby landmarks
                </h2>
                <p className="mt-3 text-muted">
                  Every area where we have property for sale right now, with the distance to the big landmarks around it.
                </p>
              </div>
              <Link href="/properties" className="btn btn-ghost btn-sm">
                All properties <ArrowRight className="size-4" />
              </Link>
            </div>

            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {guide.map((a) => (
                <li key={a.locality + a.city}>
                  <Link
                    href={`/properties?area=${encodeURIComponent(a.locality)}`}
                    className="group flex h-full flex-col rounded-card border border-line/70 bg-bg/85 p-5 backdrop-blur transition-colors hover:border-gold/55 md:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                          <MapPin className="size-3.5 text-gold" /> {a.city}
                        </p>
                        <h3 className="mt-1.5 line-clamp-2 font-display text-[24px] leading-tight transition-colors group-hover:text-gold-2">
                          {a.locality}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[11px] text-gold-2">
                        {a.count} for sale
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{a.types.map((t) => labelOf(PROPERTY_TYPES, t)).join(" · ")}</p>

                    {a.landmarks.length > 0 ? (
                      <ul className="mt-4 space-y-2 border-t border-line/60 pt-4">
                        {a.landmarks.map((l) => {
                          const Icon = LANDMARK_ICON[l.kind] ?? MapPin;
                          return (
                            <li key={l.name} className="flex items-center gap-2.5 text-sm">
                              <Icon className="size-4 shrink-0 text-gold-2" />
                              <span className="min-w-0 truncate">{l.name}</span>
                              <span className="leader" aria-hidden="true" />
                              <span className="shrink-0 font-mono text-xs text-gold-2">{formatKm(l.distanceKm)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-4 border-t border-line/60 pt-4 text-sm text-faint">Landmark distances on request.</p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-semibold text-gold-2">
                      See properties in {a.locality} <ArrowUpRight className="size-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* SELL YOUR PROPERTY */}
      <section className="container-x section" aria-labelledby="sell-title">
        <div className="grid overflow-hidden rounded-card border border-line/70 bg-surface lg:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col justify-between gap-8 p-7 md:p-10">
            <div>
              <p className="eyebrow">For owners</p>
              <h2 id="sell-title" className="mt-4 text-3xl md:text-[44px] md:leading-[1.04]">
                Have a property to sell?
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-muted">
                Send us the details, photos and location. Only our admin team sees your submission — we review it with you and publish it
                for genuine buyers when it is ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/sell" className="btn btn-primary btn-lg">
                <Tag className="size-[18px]" /> Sell Your Property
              </Link>
              <a href={telLink(s.phone)} className="btn btn-ghost btn-lg">
                <Phone className="size-[18px]" /> Talk to us
              </a>
            </div>
          </div>
          <ol className="grid border-t border-line/70 sm:grid-cols-2 lg:border-l lg:border-t-0">
            {SELL_STEPS.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className={`p-6 md:p-8 ${i % 2 === 1 ? "sm:border-l sm:border-line/70" : ""} ${i >= 1 ? "border-t border-line/70" : ""} ${
                  i === 1 ? "sm:border-t-0" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-7 text-gold-2" strokeWidth={1.4} />
                  <span className="font-mono text-xs text-faint">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHY US — ruled columns */}
      <section className="container-x pb-14 md:pb-20">
        <p className="eyebrow">Why choose us</p>
        <h2 className="section-title mt-3">Buy with complete clarity</h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="border-t border-gold/35 pt-5">
              <Icon className="size-7 text-gold-2" strokeWidth={1.4} />
              <h3 className="mt-5 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="container-x pb-14 md:pb-16">
        <div className="on-gold relative overflow-hidden rounded-card bg-gradient-to-br from-gold-2 via-gold to-gold-3 p-7 text-on-gold md:p-14">
          <ShieldCheck className="absolute -right-6 -top-6 size-56 text-black/[0.06]" />
          <h2 className="relative max-w-2xl text-[34px] leading-[1.04] md:text-6xl">Didn&apos;t find what you need? Talk to us directly.</h2>
          <p className="relative mt-4 max-w-xl text-on-gold/80">
            Tell us the area and budget{s.contactPerson ? ` — ${s.contactPerson} will` : ". Our team will"} find matching properties for you.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <a href={telLink(s.phone)} className="btn btn-lg bg-on-gold text-gold-2 hover:bg-black">
              <Phone className="size-[18px]" /> {displayPhone(s.phone)}
            </a>
            <a
              href={whatsappLink(s.whatsappNumber, "Hi, I am looking for a property.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
            >
              <WhatsAppIcon /> WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
