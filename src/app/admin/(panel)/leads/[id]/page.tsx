import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Phone, Trash } from "lucide-react";
import { db } from "@/lib/db";
import { BHK_OPTIONS, FACINGS, LEAD_SOURCES, PREFERRED_TIMES, PROPERTY_STATUSES, PROPERTY_TYPES, labelOf } from "@/lib/constants";
import { displayPhone, formatDateTime, formatINR, telLink, whatsappLink } from "@/lib/format";
import { LeadEditor } from "@/components/admin/Editors";
import { ConfirmSubmit } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons";
import { deleteLeadAction } from "../../../actions";

export const metadata: Metadata = { title: "Lead" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

const FILTER_LABELS: Record<string, string> = {
  type: "Type",
  area: "Area",
  min: "Min budget",
  max: "Max budget",
  sqmin: "Min sq.ft",
  sqmax: "Max sq.ft",
  bhk: "BHK",
  facing: "Facing",
  status: "Status",
};

function filterValue(k: string, v: string): string {
  if (k === "type") return labelOf(PROPERTY_TYPES, v);
  if (k === "min" || k === "max") return formatINR(Number(v));
  if (k === "bhk") return labelOf(BHK_OPTIONS, v);
  if (k === "facing") return labelOf(FACINGS, v);
  if (k === "status") return labelOf(PROPERTY_STATUSES, v);
  return v;
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  const lead = await db.lead.findUnique({
    where: { id },
    include: { property: { select: { id: true, title: true, code: true, slug: true, price: true, locality: true } } },
  });
  if (!lead) notFound();

  let filters: Record<string, string> = {};
  try {
    filters = lead.searchFilters ? (JSON.parse(lead.searchFilters) as Record<string, string>) : {};
  } catch {
    filters = {};
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Leads
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{lead.name}</h1>
        <p className="mt-1 text-sm text-muted">
          L-{lead.ref} · {labelOf(LEAD_SOURCES, lead.source)} · {formatDateTime(lead.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5 md:p-6">
            <div className="flex flex-wrap gap-2">
              <a href={telLink(lead.phone)} className="btn btn-primary">
                <Phone className="size-4" /> Call {displayPhone(lead.phone)}
              </a>
              <a
                href={whatsappLink(
                  lead.phone,
                  `Hi ${lead.name}, this is regarding your enquiry${lead.property ? ` for ${lead.property.title} (${lead.property.code})` : ""}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
            </div>
            <dl className="mt-5 divide-y divide-line/50">
              <Row label="Name">{lead.name}</Row>
              <Row label="Phone">{displayPhone(lead.phone)}</Row>
              {lead.preferredTime && <Row label="Best time to call">{labelOf(PREFERRED_TIMES, lead.preferredTime)}</Row>}
              {lead.property && (
                <Row label="Property">
                  <Link href={`/admin/properties/${lead.property.id}`} className="font-semibold hover:underline">
                    {lead.property.code} · {lead.property.title}
                  </Link>
                  <span className="block text-muted">
                    {formatINR(lead.property.price)} · {lead.property.locality}{" "}
                    <Link href={`/properties/${lead.property.slug}`} target="_blank" className="inline-flex items-center gap-1 underline">
                      view <ExternalLink className="size-3" />
                    </Link>
                  </span>
                </Row>
              )}
              {lead.source === "loan" && (
                <>
                  {lead.propertyPrice != null && <Row label="Property price">{formatINR(lead.propertyPrice)}</Row>}
                  {lead.budgetAvailable != null && <Row label="Amount available">{formatINR(lead.budgetAvailable)}</Row>}
                  {lead.loanRequired != null && (
                    <Row label="Loan required">
                      {formatINR(lead.loanRequired)}
                      {lead.propertyPrice ? (
                        <span className="text-muted"> ({((lead.loanRequired / lead.propertyPrice) * 100).toFixed(1)}%)</span>
                      ) : null}
                    </Row>
                  )}
                </>
              )}
              {Object.keys(filters).length > 0 && (
                <Row label="Searched for">
                  <span className="flex flex-wrap gap-1.5">
                    {Object.entries(filters).map(([k, v]) => (
                      <span key={k} className="spec">
                        {FILTER_LABELS[k] ?? k}: {filterValue(k, v)}
                      </span>
                    ))}
                  </span>
                </Row>
              )}
              {lead.message && (
                <Row label="Message">
                  <span className="whitespace-pre-line">{lead.message}</span>
                </Row>
              )}
            </dl>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <LeadEditor id={lead.id} status={lead.status} notes={lead.notes} />
          </section>
          <form action={deleteLeadAction} className="text-right">
            <input type="hidden" name="id" value={lead.id} />
            <ConfirmSubmit message="Delete this lead permanently?" className="btn btn-danger btn-sm">
              <Trash className="size-4" /> Delete lead
            </ConfirmSubmit>
          </form>
        </aside>
      </div>
    </div>
  );
}
