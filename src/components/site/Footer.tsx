import Link from "next/link";
import { Mail, MapPin, Phone, Clock, UserRound } from "@/components/glyphs";
import type { Settings } from "@/lib/settings";
import { displayPhone, telLink } from "@/lib/format";
import { PROPERTY_TYPES } from "@/lib/constants";
import { Logo } from "@/components/Logo";
import { SocialIcons } from "./SocialLinks";

export function Footer({ s }: { s: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line/60 bg-[#0c0b0a] pb-32 pt-14 md:pb-10">
      <div className="container-x grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="space-y-4">
          <Logo name={s.businessName} />
          {s.tagline && <p className="max-w-xs text-sm leading-relaxed text-muted">{s.tagline}</p>}
          <Link href="/sell" className="btn btn-ghost btn-sm">
            Sell your property
          </Link>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Properties</h3>
          <ul className="space-y-2.5 text-sm">
            {PROPERTY_TYPES.map((t) => (
              <li key={t.value}>
                <Link href={`/properties?type=${t.value}`} className="text-muted hover:text-ink">
                  {t.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/properties?status=under_construction" className="text-muted hover:text-ink">
                Under Construction · For Sale
              </Link>
            </li>
            <li>
              <Link href="/properties?status=ready_to_move" className="text-muted hover:text-ink">
                Ready to Move
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Company</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/", "Home"],
              ["/sell", "Sell Your Property"],
              ["/about", "About Us"],
              ["/team", "Our Team"],
              ["/contact", "Contact Us"],
              ["/privacy", "Privacy Policy"],
              ["/terms", "Terms of Service"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href!} className="text-muted hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Contact information</h3>
          <ul className="space-y-3 text-sm text-muted">
            {s.contactPerson && (
              <li className="flex items-start gap-2.5 text-ink">
                <UserRound className="mt-0.5 size-4 shrink-0 text-gold-2" /> {s.contactPerson}
              </li>
            )}
            <li>
              <a href={telLink(s.phone)} className="flex items-start gap-2.5 font-mono hover:text-ink">
                <Phone className="mt-0.5 size-4 shrink-0" /> {displayPhone(s.phone)}
              </a>
            </li>
            {s.email && (
              <li>
                <a href={`mailto:${s.email}`} className="flex items-start gap-2.5 break-all hover:text-ink">
                  <Mail className="mt-0.5 size-4 shrink-0" /> {s.email}
                </a>
              </li>
            )}
            {s.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {s.address}
              </li>
            )}
            {s.workingHours && (
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0" /> {s.workingHours}
              </li>
            )}
          </ul>
          <p className="mb-2.5 mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Follow us</p>
          <SocialIcons s={s} />
        </div>
      </div>

      <div className="container-x mt-12 space-y-3 border-t border-line/50 pt-6 text-xs leading-relaxed text-faint">
        {s.reraNumber && <p>RERA Registration No: {s.reraNumber}</p>}
        <p>
          All prices are negotiable. Property details are provided for information and should be confirmed during the site visit and
          documentation.
        </p>
        <p>
          © {year} {s.businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
