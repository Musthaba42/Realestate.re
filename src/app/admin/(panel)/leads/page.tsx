import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { db } from "@/lib/db";
import { LEAD_SOURCES, LEAD_STATUSES, PREFERRED_TIMES, labelOf } from "@/lib/constants";
import { displayPhone, formatDateTime, telLink, whatsappLink } from "@/lib/format";
import { QuickLeadStatus } from "@/components/admin/QuickStatus";
import { WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Leads" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && LEAD_STATUSES.some((s) => s.value === sp.status) ? sp.status : "";
  const source = typeof sp.source === "string" && LEAD_SOURCES.some((s) => s.value === sp.source) ? sp.source : "";
  const propertyId = typeof sp.property === "string" && /^[a-f0-9]{24}$/.test(sp.property) ? sp.property : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [leads, counts] = await Promise.all([
    db.lead.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(propertyId ? { propertyId } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q.replace(/\D/g, "") || q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { property: { select: { id: true, title: true, code: true } } },
    }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((a, c) => a + c._count._all, 0);

  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(status ? { status } : {}), ...(source ? { source } : {}), ...(q ? { q } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return `/admin/leads${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leads</h1>
        <p className="mt-1 text-sm text-muted">Buyers who tapped “I am Interested”, loan requests, contact messages and search requests.</p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Link href={link({ status: "" })} className={`chip shrink-0 ${!status ? "chip-active" : ""}`}>
          All <span className="opacity-60">{total}</span>
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link key={s.value} href={link({ status: s.value })} className={`chip shrink-0 ${status === s.value ? "chip-active" : ""}`}>
            {s.label} <span className="opacity-60">{countOf(s.value)}</span>
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} className="input max-w-xs flex-1" placeholder="Search name or phone" />
        <select name="source" defaultValue={source} className="input w-auto">
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-soft">
          Filter
        </button>
        {propertyId && (
          <Link href="/admin/leads" className="btn btn-ghost">
            Clear property filter
          </Link>
        )}
      </form>

      <div className="card overflow-hidden">
        {leads.length === 0 ? (
          <p className="p-8 text-center text-muted">No leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Source / Property</th>
                  <th>Call time</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className={l.status === "new" ? "bg-white/[0.03]" : ""}>
                    <td>
                      <Link href={`/admin/leads/${l.id}`} className="whitespace-nowrap font-semibold hover:underline">
                        {l.name}
                      </Link>
                      <span className="block text-xs text-faint">L-{l.ref}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="whitespace-nowrap">{displayPhone(l.phone)}</span>
                        <a href={telLink(l.phone)} className="icon-btn icon-btn-solid size-8" aria-label={`Call ${l.name}`} title="Call">
                          <Phone className="size-3.5" />
                        </a>
                        <a
                          href={whatsappLink(l.phone, `Hi ${l.name}, this is regarding your property enquiry.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="icon-btn icon-btn-solid size-8"
                          aria-label={`WhatsApp ${l.name}`}
                          title="WhatsApp"
                        >
                          <WhatsAppIcon className="size-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="max-w-[260px]">
                      <span className="block text-xs text-muted">{labelOf(LEAD_SOURCES, l.source)}</span>
                      {l.property ? (
                        <Link href={`/admin/properties/${l.property.id}`} className="block truncate hover:underline">
                          {l.property.code} · {l.property.title}
                        </Link>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-muted">{l.preferredTime ? labelOf(PREFERRED_TIMES, l.preferredTime).split(" (")[0] : "—"}</td>
                    <td>
                      <QuickLeadStatus key={l.status} id={l.id} status={l.status} />
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
