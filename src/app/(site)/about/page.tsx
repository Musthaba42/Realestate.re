import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, Handshake, House, Tag, Wallet } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { initials } from "@/lib/format";
import { TeamCard } from "@/components/site/TeamCard";

export const metadata: Metadata = { title: "About Us" };

export default async function AboutPage() {
  const [s, team] = await Promise.all([
    getSettings(),
    db.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  const founder = team.find((m) => /founder/i.test(m.role));
  const others = team.filter((m) => m.id !== founder?.id);
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <p className="eyebrow">About us</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">{s.businessName}</h1>
      {s.tagline && <p className="mt-3 text-lg text-muted">{s.tagline}</p>}
      {s.aboutText && <p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-muted">{s.aboutText}</p>}

      {founder && (
        <section className="card mt-12 grid items-center gap-6 overflow-hidden p-3 md:grid-cols-[320px_1fr] md:gap-10 md:p-4" aria-label="Founder">
          <div className="aspect-[4/4.2] overflow-hidden rounded-[24px] bg-surface-2">
            {founder.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={founder.photoUrl} alt={founder.name} className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-5xl font-bold text-muted">{initials(founder.name)}</span>
            )}
          </div>
          <div className="px-2 pb-4 md:pb-0 md:pr-8">
            <p className="eyebrow">Founder</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{founder.name}</h2>
            <p className="mt-1 text-lg text-gold-2">{founder.role}</p>
            {founder.bio && <p className="mt-4 max-w-xl leading-relaxed text-muted">{founder.bio}</p>}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-14" aria-labelledby="about-team">
          <p className="eyebrow">Our team</p>
          <h2 id="about-team" className="section-title mt-2">The people who will help you</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((m) => (
              <TeamCard key={m.id} m={m} />
            ))}
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
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="card mt-14 flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="text-2xl font-bold">Ready to find your property?</h2>
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
