import type { Settings } from "@/lib/settings";
import { displayPhone, whatsappLink } from "@/lib/format";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/icons";

type Social = { href: string; label: string; handle: string; Icon: typeof WhatsAppIcon };

/** Instagram, Facebook and WhatsApp, in that order (YouTube is not used). */
export function socialsOf(s: Settings): Social[] {
  return [
    s.instagramUrl && { href: s.instagramUrl, label: "Instagram", handle: handleOf(s.instagramUrl), Icon: InstagramIcon },
    s.facebookUrl && { href: s.facebookUrl, label: "Facebook", handle: s.businessName, Icon: FacebookIcon },
    { href: whatsappLink(s.whatsappNumber), label: "WhatsApp", handle: displayPhone(s.whatsappNumber), Icon: WhatsAppIcon },
  ].filter(Boolean) as Social[];
}

/** Round icon buttons, used in the footer under the contact details. */
export function SocialIcons({ s, className = "" }: { s: Settings; className?: string }) {
  return (
    <ul className={`flex gap-2 ${className}`} aria-label="Social media">
      {socialsOf(s).map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn icon-btn-solid text-gold-2 hover:bg-gold hover:text-on-gold"
            aria-label={label}
            title={label}
          >
            <Icon className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
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
