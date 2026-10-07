import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { displayPhone, telLink, whatsappLink } from "@/lib/format";
import { LOAN_DISCLAIMER, PROPERTY_TYPES } from "@/lib/constants";
import { Logo } from "@/components/Logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons";

export function Footer({ s }: { s: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line/60 bg-[#0c0b0a] pb-32 pt-14 md:pb-10">
      <div className="container-x grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo name={s.businessName} />
          {s.tagline && <p className="text-sm text-muted">{s.tagline}</p>}
          <div className="flex gap-2">
            {s.instagramUrl && (
              <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn-solid" aria-label="Instagram">
                <InstagramIcon className="size-[18px]" />
              </a>
            )}
            {s.facebookUrl && (
              <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn-solid" aria-label="Facebook">
                <FacebookIcon className="size-[18px]" />
              </a>
            )}
            {s.youtubeUrl && (
              <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn-solid" aria-label="YouTube">
                <YouTubeIcon className="size-[18px]" />
              </a>
            )}
            <a href={whatsappLink(s.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="icon-btn icon-btn-solid" aria-label="WhatsApp">
              <WhatsAppIcon className="size-[18px]" />
            </a>
          </div>
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
                Under Construction
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
              ["/sell", "Sell Your Property"],
              ["/loan", "Loan Assistance"],
              ["/about", "About Us"],
              ["/team", "Our Team"],
              ["/contact", "Contact Us"],
              ["/privacy", "Privacy Policy"],
              ["/terms", "Terms of Service"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-muted hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Contact</h3>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <a href={telLink(s.phone)} className="flex items-start gap-2.5 hover:text-ink">
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
        </div>
      </div>

      <div className="container-x mt-12 space-y-3 border-t border-line/50 pt-6 text-xs leading-relaxed text-faint">
        {s.reraNumber && <p>RERA Registration No: {s.reraNumber}</p>}
        <p>* {LOAN_DISCLAIMER}</p>
        <p>
          Approval badges are shown only after our team has verified the documents. Property details are provided for
          information and should be confirmed during the site visit and documentation.
        </p>
        <p>
          © {year} {s.businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
