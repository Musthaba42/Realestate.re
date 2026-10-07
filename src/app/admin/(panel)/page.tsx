import Link from "next/link";
import { ArrowRight, Building, Inbox, Plus, Tag, TriangleAlert } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES, SELLER_STATUSES, labelOf } from "@/lib/constants";
import { displayPhone, formatDateTime, formatPriceShort } from "@/lib/format";
import { Pill } from "@/components/admin/Pill";

export default async function DashboardPage() {
  const [s, newLeads, totalLeads, pendingSellers, live, drafts, recentLeads, recentSellers] = await Promise.all([
    getSettings(),
    db.lead.count({ where: { status: "new" } }),
    db.lead.count(),
    db.sellerRequest.count({ where: { status: "pending" } }),
    db.property.count({ where: { isPublished: true } }),
    db.property.count({ where: { isPublished: false } }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { property: { select: { title: true, code: true } } } }),
    db.sellerRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const usingPlaceholders = s.whatsappNumber === "+919876543210" || s.phone === "+919876543210";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Today&apos;s overview of leads and listings.</p>
        </div>
        <Link href="/admin/properties/new" className="btn btn-primary">
          <Plus className="size-4" /> Add property
        </Link>
      </div>

      {usingPlaceholders && (
        <Link href="/admin/settings" className="flex items-start gap-3 rounded-3xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <span>
            Your phone / WhatsApp number is still the placeholder. Leads are sent to this number —{" "}
            <strong className="underline">update it in Settings</strong> before going live.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "New leads", value: newLeads, href: "/admin/leads?status=new", icon: Inbox, highlight: newLeads > 0 },
          { label: "All leads", value: totalLeads, href: "/admin/leads", icon: Inbox },
          { label: "Seller requests pending", value: pendingSellers, href: "/admin/sellers?status=pending", icon: Tag, highlight: pendingSellers > 0 },
          { label: "Live properties", value: live, sub: drafts ? `${drafts} hidden/draft` : undefined, href: "/admin/properties", icon: Building },
        ].map(({ label, value, href, icon: Icon, highlight, sub }) => (
          <Link key={label} href={href} className={`card p-4 transition-colors hover:border-faint md:p-5 ${highlight ? "border-white/40" : ""}`}>
            <div className="flex items-center justify-between">
              <Icon className="size-5 text-muted" />
              {highlight && <span className="badge-dot" />}
            </div>
            <p className="mt-4 text-3xl font-bold">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{label}</p>
            {sub && <p className="mt-1 text-[11px] text-faint">{sub}</p>}
          </Link>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-bold">Latest leads</h2>
          <Link href="/admin/leads" className="btn btn-ghost btn-sm">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-muted">No leads yet. They will appear here when buyers tap “I am Interested”.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/admin/leads/${l.id}`} className="font-semibold hover:underline">
                        {l.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">{displayPhone(l.phone)}</td>
                    <td className="whitespace-nowrap text-muted">{labelOf(LEAD_SOURCES, l.source)}</td>
                    <td className="max-w-[220px] truncate text-muted">{l.property ? `${l.property.code} · ${l.property.title}` : "—"}</td>
                    <td>
                      <Pill value={l.status} label={labelOf(LEAD_STATUSES, l.status)} />
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-bold">Latest seller requests</h2>
          <Link href="/admin/sellers" className="btn btn-ghost btn-sm">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {recentSellers.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-muted">No seller requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Owner</th>
                  <th>Property</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recentSellers.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/sellers/${r.id}`} className="font-semibold hover:underline">
                        S-{r.ref}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">{r.ownerName}</td>
                    <td className="whitespace-nowrap text-muted">
                      {labelOf(PROPERTY_TYPES, r.type)} · {r.locality}
                    </td>
                    <td className="whitespace-nowrap">{formatPriceShort(r.price)}</td>
                    <td>
                      <Pill value={r.status} label={labelOf(SELLER_STATUSES, r.status)} />
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
