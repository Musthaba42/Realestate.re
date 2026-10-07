import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, Handshake, House, Tag, Wallet } from "@/components/glyphs";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { TeamCard } from "@/components/site/TeamCard";
import { SwipeCarousel } from "@/components/site/SwipeCarousel";

export const metadata: Metadata = { title: "About Us" };

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
      <p className="eyebrow">About us</p>
      <h1 className="mt-3 max-w-3xl text-[44px] leading-none text-foil md:text-7xl">{s.businessName}</h1>
      {s.tagline && <p className="mt-3 text-lg text-muted">{s.tagline}</p>}
      {s.aboutText && <p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-muted">{s.aboutText}</p>}

      {people.length > 0 && (
        <section className="mt-12" aria-labelledby="about-team">
          <p className="eyebrow">Our team</p>
          <h2 id="about-team" className="section-title mt-2">The people who will help you</h2>
          <p className="mt-2 text-sm text-muted">Swipe to meet everyone.</p>
          <div className="mt-6">
            <SwipeCarousel label="Our team" perView={3}>
              {people.map((m) => (
                <TeamCard key={m.id} m={m} featured={m.id === founder?.id} />
              ))}
            </SwipeCarousel>
          </div>
        </section>
      )}

      <h2 className="section-title mt-14">What we do</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: House, title: "Property sales", text: "Residential & commercial land, plots, individual houses, apartments and commercial buildings." },
          { icon: Tag, title: "Sell your property", text: "Owners submit their property; we verify, list and bring genuine buyers." },
          { icon: Wallet, title: "Loan assistance", text: `Help with bank loans and financing — up to ${s.loanMaxPercent}%* subject to lender approval.` },
          { icon: BadgeCheck, title: "Verification", text: "We check approvals (DTCP / CMDA etc.) and documents before showing approval badges." },
          { icon: Handshake, title: "Negotiation & visits", text: "We arrange site visits and help both sides agree on a fair price." },
          { icon: FileText, title: "Documentation", text: "Support with agreements, registration and all paperwork." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-5">
            <span className="grid size-11 place-items-center rounded-2xl bg-surface-2">
              <Icon className="size-5 text-gold-2" />
            </span>
            <h3 className="mt-4 font-display text-xl">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="card mt-14 flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="text-3xl">Ready to find your property?</h2>
          <p className="mt-1 text-muted">Pick an area and explore — no sign-up needed.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/properties" className="btn btn-primary">
            Find Property <ArrowRight className="size-4" />
          </Link>
          <Link href="/team" className="btn btn-ghost">
            Meet our team
          </Link>
        </div>
      </div>
      {s.reraNumber && <p className="mt-6 text-sm text-muted">RERA Registration No: {s.reraNumber}</p>}
    </div>
  );
}
