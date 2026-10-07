import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CirclePlus, ExternalLink, LogOut, MessageSquareWarning } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logoutAction } from "@/app/auth/actions";
import { PROPERTY_TYPES, SELLER_STATUSES, labelOf } from "@/lib/constants";
import { displayPhone, formatDateTime, formatPriceShort } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold/15 text-gold-2",
  needs_info: "bg-warn/15 text-warn",
  approved: "bg-accent/15 text-accent",
  rejected: "bg-danger/15 text-danger",
};
const STATUS_TEXT: Record<string, string> = {
  pending: "Waiting for admin review",
  needs_info: "The admin needs more information",
  approved: "Approved and live on the website",
  rejected: "Not approved",
};

export default async function AccountPage() {
  const me = await requireUser("/account");
  if (me.role === "admin") redirect("/admin");

  const submissions = await db.sellerRequest.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } });
  const listings = await db.property.findMany({
    where: { id: { in: submissions.map((r) => r.propertyId).filter((x): x is string => Boolean(x)) } },
    select: { id: true, slug: true, isPublished: true, code: true },
  });

  return (
    <div className="container-x max-w-3xl pb-10 pt-6 md:pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Hello, {me.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {me.phone ? displayPhone(me.phone) : me.login}
            {me.email ? ` · ${me.email}` : ""}
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost btn-sm">
            <LogOut className="size-4" /> Log out
          </button>
        </form>
      </div>

      <div className="mb-4 mt-10 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">My properties for sale</h2>
        <Link href="/sell" className="btn btn-primary btn-sm">
          <CirclePlus className="size-4" /> Sell a property
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted">You have not submitted any property yet.</p>
          <Link href="/sell" className="btn btn-primary mt-5">
            Sell your property
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {submissions.map((r) => {
            const listing = listings.find((l) => l.id === r.propertyId);
            return (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-faint">
                      S-{r.ref} · submitted {formatDateTime(r.createdAt)}
                    </p>
                    <h3 className="mt-1 font-semibold">{r.title || `${labelOf(PROPERTY_TYPES, r.type)} in ${r.locality}`}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {r.locality}, {r.city} · {formatPriceShort(r.price)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[r.status] ?? "bg-surface-3 text-muted"}`}>
                    {labelOf(SELLER_STATUSES, r.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">{STATUS_TEXT[r.status] ?? ""}</p>
                {r.ownerMessage && r.status !== "approved" && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
                    <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-warn" />
                    <span>
                      <span className="block text-xs font-semibold text-muted">Message from our team</span>
                      {r.ownerMessage}
                    </span>
                  </p>
                )}
                {listing?.isPublished && (
                  <Link href={`/properties/${listing.slug}`} className="btn btn-ghost btn-sm mt-4">
                    <ExternalLink className="size-4" /> View my listing ({listing.code})
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
