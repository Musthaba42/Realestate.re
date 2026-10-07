import { Phone } from "lucide-react";
import type { TeamMember } from "@prisma/client";
import { initials, telLink, whatsappLink } from "@/lib/format";
import { WhatsAppIcon } from "@/components/icons";

export function TeamCard({ m }: { m: TeamMember }) {
  return (
    <article className="card flex h-full flex-col p-2">
      <div className="relative aspect-[4/4.2] overflow-hidden rounded-[22px] bg-surface-2">
        {m.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.photoUrl} alt={m.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-surface-3 to-surface-2">
            <span className="text-5xl font-bold text-muted">{initials(m.name)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <h3 className="text-lg font-semibold">{m.name}</h3>
        <p className="text-sm text-muted">{m.role}</p>
        {m.bio && <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{m.bio}</p>}
        {m.showContact && (m.phone || m.whatsapp) && (
          <div className="mt-4 flex gap-2">
            {m.phone && (
              <a href={telLink(m.phone)} className="btn btn-ghost btn-sm flex-1">
                <Phone className="size-4" /> Call
              </a>
            )}
            {m.whatsapp && (
              <a
                href={whatsappLink(m.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm flex-1"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
