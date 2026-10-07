import type { Metadata } from "next";
import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { LeadForm } from "@/components/site/LeadForm";
import { displayPhone, mapsSearchLink, telLink, whatsappLink } from "@/lib/format";
import { WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const s = await getSettings();
  const mapHref = s.mapsUrl || (s.address ? mapsSearchLink(s.address) : null);
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">Talk to our team</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">Call, WhatsApp or leave a message — we usually respond within a few hours.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_460px]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <a href={telLink(s.phone)} className="card flex items-center gap-4 p-5 transition-colors hover:border-faint">
              <span className="grid size-12 place-items-center rounded-2xl bg-gold text-on-gold">
                <Phone className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted">Call us</p>
                <p className="font-semibold">{displayPhone(s.phone)}</p>
              </div>
            </a>
            <a
              href={whatsappLink(s.whatsappNumber, "Hi, I have an enquiry.")}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-4 p-5 transition-colors hover:border-faint"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-[#25d366] text-[#0b2e17]">
                <WhatsAppIcon />
              </span>
              <div>
                <p className="text-xs text-muted">WhatsApp</p>
                <p className="font-semibold">{displayPhone(s.whatsappNumber)}</p>
              </div>
            </a>
          </div>
          {s.email && (
            <a href={`mailto:${s.email}`} className="card flex items-center gap-4 p-5 transition-colors hover:border-faint">
              <span className="grid size-12 place-items-center rounded-2xl bg-surface-2">
                <Mail className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted">Email</p>
                <p className="truncate font-semibold">{s.email}</p>
              </div>
            </a>
          )}
          {(s.address || s.workingHours) && (
            <div className="card space-y-4 p-5">
              {s.address && (
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-muted" />
                  <span>{s.address}</span>
                </p>
              )}
              {s.workingHours && (
                <p className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-muted" />
                  <span>{s.workingHours}</span>
                </p>
              )}
              {mapHref && (
                <a href={mapHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                  <Navigation className="size-4" /> Open in Google Maps
                </a>
              )}
            </div>
          )}
        </div>

        <div className="card h-fit p-5 md:p-7">
          <h2 className="text-xl font-bold">Send us a message</h2>
          <p className="mb-5 mt-1 text-sm text-muted">We&apos;ll call you back.</p>
          <LeadForm
            source="contact"
            submitLabel="Send message"
            messagePlaceholder="How can we help you?"
            callHref={telLink(s.phone)}
          />
        </div>
      </div>
    </div>
  );
}
