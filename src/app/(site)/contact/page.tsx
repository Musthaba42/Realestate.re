import type { Metadata } from "next";
import { ArrowUpRight, Clock, Mail, MapPin, Navigation, Phone, UserRound } from "@/components/glyphs";
import { getSettings } from "@/lib/settings";
import { LeadForm } from "@/components/site/LeadForm";
import { HomeTrail } from "@/components/site/HomeTrail";
import { socialsOf } from "@/components/site/SocialLinks";
import { displayPhone, mapsSearchLink, telLink, whatsappLink } from "@/lib/format";
import { WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const s = await getSettings();
  const mapHref = s.mapsUrl || (s.address ? mapsSearchLink(s.address) : null);
  const socials = socialsOf(s);

  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <HomeTrail items={[{ label: "Contact" }]} />
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 text-[40px] leading-tight md:text-6xl">Talk to our team</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">Call, WhatsApp or leave a message — we usually respond within a few hours.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_460px]">
        {/* CONTACT INFORMATION, with the social media links directly under it */}
        <section className="h-fit overflow-hidden rounded-card border border-line/70 bg-surface" aria-labelledby="contact-info">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line/70 p-5 md:p-7">
            <div>
              <h2 id="contact-info" className="text-2xl md:text-3xl">
                Contact information
              </h2>
              {s.contactPerson && (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <UserRound className="size-4 text-gold-2" />
                  Your contact: <span className="font-semibold text-gold-2">{s.contactPerson}</span>
                </p>
              )}
            </div>
            <a href={telLink(s.phone)} className="btn btn-primary">
              <Phone className="size-4" /> Call now
            </a>
          </div>

          <div className="grid sm:grid-cols-2">
            <InfoRow icon={<Phone className="size-[18px]" />} label={s.contactPerson ? `Call ${s.contactPerson}` : "Call us"} href={telLink(s.phone)}>
              <span className="font-mono">{displayPhone(s.phone)}</span>
            </InfoRow>
            <InfoRow
              icon={<WhatsAppIcon className="size-[18px]" />}
              label="WhatsApp"
              href={whatsappLink(s.whatsappNumber, "Hi, I have an enquiry.")}
              external
              className="border-t border-line/60 sm:border-l sm:border-t-0"
            >
              <span className="font-mono">{displayPhone(s.whatsappNumber)}</span>
            </InfoRow>
            {s.email && (
              <InfoRow icon={<Mail className="size-[18px]" />} label="Email" href={`mailto:${s.email}`} className="border-t border-line/60">
                <span className="break-all">{s.email}</span>
              </InfoRow>
            )}
            {s.workingHours && (
              <InfoRow
                icon={<Clock className="size-[18px]" />}
                label="Working hours"
                className={`border-t border-line/60 ${s.email ? "sm:border-l" : ""}`}
              >
                {s.workingHours}
              </InfoRow>
            )}
            {s.address && (
              <InfoRow icon={<MapPin className="size-[18px]" />} label="Office" className="border-t border-line/60 sm:col-span-2">
                <span className="flex flex-wrap items-center justify-between gap-3">
                  {s.address}
                  {mapHref && (
                    <a href={mapHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      <Navigation className="size-4" /> Open in Google Maps
                    </a>
                  )}
                </span>
              </InfoRow>
            )}
          </div>

          <div className="border-t border-line/70 bg-surface-2/50 p-5 md:p-7">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">Follow us on social media</h3>
            <p className="mt-1.5 text-sm text-muted">New listings, site-visit videos and offers, posted first on our pages.</p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-3" aria-label="Social media">
              {socials.map(({ href, label, handle, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-bg/60 p-3 transition-colors hover:border-gold/60"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-gold-2 transition-colors group-hover:bg-gold group-hover:text-on-gold">
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block truncate font-mono text-[11px] text-muted">{handle}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-faint transition-colors group-hover:text-gold-2" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="card h-fit p-5 md:p-7 lg:sticky lg:top-24">
          <h2 className="text-2xl">Send us a message</h2>
          <p className="mb-5 mt-1 text-sm text-muted">We&apos;ll call you back.</p>
          <LeadForm source="contact" submitLabel="Send message" messagePlaceholder="How can we help you?" callHref={telLink(s.phone)} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  href,
  external,
  className = "",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-gold-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted">{label}</span>
        <span className="mt-0.5 block font-semibold">{children}</span>
      </span>
    </>
  );
  const cls = `flex items-center gap-4 p-5 md:px-7 ${className}`;
  return href ? (
    <a href={href} className={`${cls} transition-colors hover:bg-surface-2/60`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
