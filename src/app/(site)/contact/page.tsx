import type { Metadata } from "next";
import { Clock, Mail, MapPin, Navigation, Phone } from "@/components/glyphs";
import { getSettings } from "@/lib/settings";
import { LeadForm } from "@/components/site/LeadForm";
import { displayPhone, mapsSearchLink, telLink, whatsappLink } from "@/lib/format";
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const s = await getSettings();
  const mapHref = s.mapsUrl || (s.address ? mapsSearchLink(s.address) : null);
  const socials = [
    s.instagramUrl && { href: s.instagramUrl, label: "Instagram", handle: handleOf(s.instagramUrl), Icon: InstagramIcon },
    s.facebookUrl && { href: s.facebookUrl, label: "Facebook", handle: "Golden Groups", Icon: FacebookIcon },
    s.youtubeUrl && { href: s.youtubeUrl, label: "YouTube", handle: handleOf(s.youtubeUrl), Icon: YouTubeIcon },
    { href: whatsappLink(s.whatsappNumber), label: "WhatsApp", handle: displayPhone(s.whatsappNumber), Icon: WhatsAppIcon },
  ].filter(Boolean) as { href: string; label: string; handle: string; Icon: typeof WhatsAppIcon }[];
  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-3 text-[40px] leading-tight md:text-6xl">Talk to our team</h1>
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

          <section className="card p-5" aria-labelledby="follow-us">
            <h2 id="follow-us" className="text-xl">
              Follow us
            </h2>
            <p className="mt-1 text-sm text-muted">New listings, site-visit videos and offers, posted first on our pages.</p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {socials.map(({ href, label, handle, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-surface-2 p-3 transition-colors hover:border-gold/60"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg text-gold-2 transition-colors group-hover:bg-gold group-hover:text-on-gold">
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block truncate font-mono text-[11px] text-muted">{handle}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="card h-fit p-5 md:p-7">
          <h2 className="text-2xl">Send us a message</h2>
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

/** "@goldengroups_re" from a profile link (query strings dropped). */
function handleOf(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean)[0] ?? "";
    return seg ? (seg.startsWith("@") ? seg : `@${seg}`) : new URL(url).hostname;
  } catch {
    return url;
  }
}
