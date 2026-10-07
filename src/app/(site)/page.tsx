import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building,
  FileText,
  House,
  Landmark,
  LandPlot,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  Wallet,
} from "@/components/glyphs";
import { getSettings } from "@/lib/settings";
import { featuredProperties, localities, localityCounts } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { HeroSearch } from "@/components/site/HeroSearch";
import { NearbySection } from "@/components/site/NearbySection";
import { WhatsAppIcon } from "@/components/icons";
import { displayPhone, telLink, whatsappLink } from "@/lib/format";
import { LOAN_DISCLAIMER } from "@/lib/constants";

const TYPE_TILES = [
  { value: "land", label: "Land & Plots", desc: "Residential & commercial plots", icon: LandPlot },
  { value: "house", label: "Houses & Villas", desc: "Individual & new houses", icon: House },
  { value: "apartment", label: "Apartments", desc: "Flats in gated communities", icon: Building },
  { value: "commercial", label: "Commercial", desc: "Buildings, shops & land", icon: Landmark },
];

export default async function HomePage() {
  const [s, featured, locs, areas] = await Promise.all([getSettings(), featuredProperties(6), localities(), localityCounts(12)]);
  const heroCards = featured.slice(0, 2);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gold/[0.07] blur-3xl" />
        <div className="container-x relative grid items-center gap-10 pb-10 pt-8 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20">
          <div>
            <h1 className="text-[40px] leading-[1.04] sm:text-[56px] lg:text-[68px]">{s.heroTitle}</h1>
            {s.heroSubtitle && <p className="mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">{s.heroSubtitle}</p>}
            <div className="mt-7 max-w-xl">
              <HeroSearch localities={locs} />
            </div>
            <dl className="mt-7 grid max-w-[16rem] grid-cols-1 gap-3">
              <div className="rounded-2xl bg-surface/70 p-3.5">
                <dt className="text-xs text-muted">Loan support</dt>
                <dd className="mt-1 font-mono text-lg leading-tight text-gold-2 sm:text-2xl">Up to {s.loanMaxPercent}%*</dd>
              </div>
            </dl>
          </div>

          {heroCards.length === 0 && (
            <div className="relative hidden place-items-center lg:grid">
              <div className="absolute size-[420px] rounded-full bg-gold/10 blur-3xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={`${s.businessName} emblem`} width={380} height={380} className="relative size-[380px] rounded-full" />
            </div>
          )}

          {heroCards.length > 0 && (
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="mt-14">
                  <PropertyCard p={heroCards[0]!} priority />
                </div>
                {heroCards[1] && (
                  <div>
                    <PropertyCard p={heroCards[1]} priority />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NEAR YOU */}
      <NearbySection />

      {/* BROWSE BY TYPE */}
      <section className="container-x py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Browse by property type</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {TYPE_TILES.map(({ value, label, desc, icon: Icon }) => (
            <Link
              key={value}
              href={`/properties?type=${value}`}
              className="card group flex flex-col justify-between gap-6 p-4 transition-colors hover:border-faint md:p-5"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
                  <Icon className="size-6" />
                </span>
                <span className="icon-btn icon-btn-solid size-9 transition-colors group-hover:bg-gold group-hover:text-on-gold">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
              <div>
                <h3 className="font-display text-lg md:text-xl">{label}</h3>
                <p className="mt-0.5 text-xs text-muted md:text-sm">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* EXPLORE LOCALITIES */}
      {areas.length > 0 && (
        <section className="container-x py-10 md:py-14" aria-labelledby="areas-title">
          <p className="eyebrow">Explore localities</p>
          <h2 id="areas-title" className="section-title mt-2">
            Areas where we have property for sale
          </h2>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((a) => (
              <li key={a.locality + a.city}>
                <Link
                  href={`/properties?area=${encodeURIComponent(a.locality)}`}
                  className="group flex items-center gap-3.5 rounded-2xl border border-line/60 bg-surface px-4 py-3.5 transition-colors hover:border-gold/50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-gold-2">
                    <MapPin className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{a.locality}</span>
                    <span className="block text-xs text-muted">{a.city}</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-faint transition-colors group-hover:text-gold-2" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FEATURED */}
      <section className="container-x py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="section-title mt-2">Featured properties</h2>
          </div>
          <Link href="/properties" className="btn btn-ghost btn-sm shrink-0">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <p className="max-w-md text-muted">
              New properties are being added. Tell us the area and budget you want and we&apos;ll call you with matching options.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Tell us what you need <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </section>

      {/* SELL + LOAN */}
      <section className="container-x grid gap-4 py-10 md:grid-cols-2 md:py-14">
        <div className="card flex flex-col justify-between gap-8 p-6 md:p-8">
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
              <Tag className="size-6" />
            </span>
            <h2 className="mt-5 text-3xl">Have a property to sell?</h2>
            <p className="mt-2 leading-relaxed text-muted">
              Share your property details, photos and location. Our team will verify it and connect you with genuine buyers.
            </p>
          </div>
          <Link href="/sell" className="btn btn-primary self-start">
            Sell Your Property <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="card flex flex-col justify-between gap-8 p-6 md:p-8">
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
              <Wallet className="size-6" />
            </span>
            <h2 className="mt-5 text-3xl">Need a home loan?</h2>
            <p className="mt-2 leading-relaxed text-muted">
              Limited savings shouldn&apos;t stop you. We help you apply for financing of up to {s.loanMaxPercent}%* of the property value.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-faint">* {LOAN_DISCLAIMER}</p>
          </div>
          <Link href="/loan" className="btn btn-ghost self-start">
            Get Loan Assistance <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* WHY US */}
      <section className="container-x py-10 md:py-14">
        <p className="eyebrow">Why choose us</p>
        <h2 className="section-title mt-2">Buy with complete clarity</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "Verified approvals", text: "DTCP / CMDA badges appear only after we check the documents." },
            { icon: Tag, title: "Negotiable price", text: "A clear price on every property, and room to negotiate it with the owner." },
            { icon: Wallet, title: "Loan assistance", text: "We work with leading banks to help you get the right loan." },
            { icon: FileText, title: "End-to-end support", text: "Site visits, negotiation, documentation and registration." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <Icon className="size-7 text-gold-2" />
              <h3 className="mt-4 font-display text-xl">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="container-x py-10 md:py-14">
        <div className="on-gold relative overflow-hidden rounded-[32px] bg-gradient-to-br from-gold-2 via-gold to-gold-3 p-7 text-on-gold md:p-12">
          <ShieldCheck className="absolute -right-6 -top-6 size-48 text-black/[0.06]" />
          <h2 className="relative max-w-xl text-3xl md:text-5xl">
            Didn&apos;t find what you need? Talk to us directly.
          </h2>
          <p className="relative mt-3 max-w-xl text-on-gold/80">
            Tell us the area and budget. Our team will find matching properties for you.
          </p>
          <div className="relative mt-7 flex flex-wrap gap-3">
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
