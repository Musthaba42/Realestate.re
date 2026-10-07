import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { PROPERTY_TYPES, SELLER_STATUSES, labelOf } from "@/lib/constants";
import { displayPhone, formatDateTime, formatNumber, formatPriceShort } from "@/lib/format";
import { Pill } from "@/components/admin/Pill";

export const metadata: Metadata = { title: "Seller requests" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SellersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && SELLER_STATUSES.some((s) => s.value === sp.status) ? sp.status : "";
  const [requests, counts] = await Promise.all([
    db.sellerRequest.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 300 }),
    db.sellerRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((a, c) => a + c._count._all, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Seller requests</h1>
        <p className="mt-1 text-sm text-muted">Properties submitted by owners through “Sell Your Property”.</p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Link href="/admin/sellers" className={`chip shrink-0 ${!status ? "chip-active" : ""}`}>
          All <span className="opacity-60">{total}</span>
        </Link>
        {SELLER_STATUSES.map((s) => (
          <Link key={s.value} href={`/admin/sellers?status=${s.value}`} className={`chip shrink-0 ${status === s.value ? "chip-active" : ""}`}>
            {s.label} <span className="opacity-60">{countOf(s.value)}</span>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {requests.length === 0 ? (
          <p className="p-8 text-center text-muted">No seller requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Owner</th>
                  <th>Property</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Files</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  let files = 0;
                  try {
                    files = (JSON.parse(r.media) as unknown[]).length;
                  } catch {
                    files = 0;
                  }
                  return (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/admin/sellers/${r.id}`} className="font-semibold hover:underline">
                          S-{r.ref}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap">
                        {r.ownerName}
                        <span className="block text-xs text-muted">{displayPhone(r.ownerPhone)}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        {labelOf(PROPERTY_TYPES, r.type)}
                        {r.bhk ? ` · ${r.bhk} BHK` : ""}
                        <span className="block text-xs text-muted">
                          {r.locality}, {r.city}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{formatNumber(r.totalSqft)} sq.ft</td>
                      <td className="whitespace-nowrap font-semibold">{formatPriceShort(r.price)}</td>
                      <td>{files}</td>
                      <td>
                        <Pill value={r.status} label={labelOf(SELLER_STATUSES, r.status)} />
                      </td>
                      <td className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
