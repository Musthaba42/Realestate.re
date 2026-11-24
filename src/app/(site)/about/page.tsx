import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Handshake, House, MapPin, Phone, Tag } from "@/components/glyphs";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { TeamCard } from "@/components/site/TeamCard";
import { SwipeCarousel } from "@/components/site/SwipeCarousel";
import { HomeTrail } from "@/components/site/HomeTrail";
import { displayPhone, telLink } from "@/lib/format";

export const metadata: Metadata = { title: "About Us" };

const SERVICES = [
  { icon: House, title: "Property sales", text: "Residential & commercial land, plots, individual houses, apartments and commercial buildings." },
  { icon: Tag, title: "Sell your property", text: "Owners send their property to our admin team; we review it, list it and bring genuine buyers." },
  { icon: MapPin, title: "Locality guidance", text: "Available areas, nearby landmarks and how far they are — so you know the place before the visit." },
  { icon: Handshake, title: "Negotiation & visits", text: "We arrange site visits and help both sides agree on a fair, negotiable price." },
  { icon: FileText, title: "Documentation", text: "Support with agreements, registration and all paperwork." },
];

export default async function AboutPage() {
  const [s, team] = await Promise.all([
    getSettings(),
    db.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  // Founder first, then everyone else in their saved order.
  const founder = team.find((m) => /founder/i.test(m.role));
  const people = founder ? [founder, ...team.filter((m) => m.id !== founder.id)] : team;

  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <HomeTrail items={[{ label: "About us" }]} />

      <section className="grid gap-8 border-b border-line/70 pb-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16 md:pb-16">
        <div>
          <p className="eyebrow">About us</p>
          <h1 className="mt-4 text-[48px] leading-[0.95] text-foil md:text-[88px]">{s.businessName}</h1>
          {s.tagline && <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-muted md:text-sm">{s.tagline}</p>}
        </div>
        {s.aboutText && <p className="whitespace-pre-line text-lg leading-relaxed text-muted lg:pb-2">{s.aboutText}</p>}
      </section>

      {people.length > 0 && (
        <section className="section pb-0 md:pb-0" aria-labelledby="about-team">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Our team</p>
              <h2 id="about-team" className="section-title mt-3">
                The people who will help you
              </h2>
            </div>
            <Link href="/team" className="btn btn-ghost btn-sm">
              Meet the whole team <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8">
            {/* Slides on its own every few seconds; stops while a visitor hovers or swipes. */}
            <SwipeCarousel label="Our team" perView={3} autoPlay={4500}>
              {people.map((m) => (
                <TeamCard key={m.id} m={m} featured={m.id === founder?.id} gilded />
              ))}
            </SwipeCarousel>
          </div>
        </section>
      )}

      <section className="section pb-0 md:pb-0" aria-labelledby="what-we-do">
        <p className="eyebrow">Services</p>
        <h2 id="what-we-do" className="section-title mt-3">
          What we do
        </h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="border-t border-gold/35 pt-5">
              <div className="flex items-center justify-between">
                <Icon className="size-7 text-gold-2" strokeWidth={1.4} />
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 grid overflow-hidden rounded-card border border-line/70 bg-surface md:grid-cols-[1fr_auto] md:items-center">
        <div className="p-7 md:p-10">
          <h2 className="text-3xl md:text-4xl">Ready to find your property?</h2>
          <p className="mt-2 text-muted">Pick an area and explore — no sign-up needed.</p>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line/70 p-7 md:border-l md:border-t-0 md:p-10">
          <Link href="/properties" className="btn btn-primary">
            Find Property <ArrowRight className="size-4" />
          </Link>
          <a href={telLink(s.phone)} className="btn btn-ghost">
            <Phone className="size-4" /> {displayPhone(s.phone)}
          </a>
        </div>
      </div>
      {s.reraNumber && <p className="mt-6 text-sm text-muted">RERA Registration No: {s.reraNumber}</p>}
    </div>
  );
}
