import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Handshake, LogIn, Phone, UserPlus, Users } from "@/components/glyphs";
import { SellForm } from "@/components/site/SellForm";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { telLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sell Your Property",
  description: "Submit your land, house, apartment or commercial property. Our team will verify it and find genuine buyers.",
};

export default async function SellPage() {
  const [s, me] = await Promise.all([getSettings(), getCurrentUser()]);

  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <p className="eyebrow">For property owners</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Sell your property with us</h1>
          <p className="mb-7 mt-3 max-w-2xl leading-relaxed text-muted">
            Share the details below. Our team will review and verify your property, and once the admin approves it, it is shown on our
            website for genuine buyers.
          </p>

          {!me && (
            <div className="card max-w-xl p-6 md:p-8">
              <h2 className="text-xl font-bold">Log in to sell your property</h2>
              <p className="mt-2 leading-relaxed text-muted">
                You need a free account so we can show you the approval status of your property. Browsing and “I am Interested” never
                need an account.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login?next=/sell" className="btn btn-primary">
                  <LogIn className="size-4" /> Log in
                </Link>
                <Link href="/signup?next=/sell" className="btn btn-ghost">
                  <UserPlus className="size-4" /> Create account
                </Link>
              </div>
            </div>
          )}

          {me && !me.phone && (
            <div className="card max-w-xl p-6 md:p-8">
              <h2 className="text-xl font-bold">Admins add properties from the dashboard</h2>
              <p className="mt-2 text-muted">This account is the admin account. Use the dashboard to add or approve properties.</p>
              <Link href="/admin/properties/new" className="btn btn-primary mt-5">
                Open dashboard
              </Link>
            </div>
          )}

          {me && me.phone && <SellForm callHref={telLink(s.phone)} owner={{ name: me.name, phone: me.phone }} />}
        </div>
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {[
            { icon: BadgeCheck, title: "Admin approval", text: "Our admin checks every submission before it goes live." },
            { icon: Users, title: "Genuine buyers", text: "Your property reaches buyers searching in your area." },
            { icon: Handshake, title: "End-to-end help", text: "We handle enquiries, site visits and negotiation." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
          <a href={telLink(s.phone)} className="btn btn-ghost w-full">
            <Phone className="size-4" /> Prefer to talk? Call us
          </a>
        </aside>
      </div>
    </div>
  );
}
