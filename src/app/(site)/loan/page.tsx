import type { Metadata } from "next";
import { Banknote, FileText, Landmark, UserRound } from "@/components/glyphs";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { LoanForm } from "@/components/site/LoanForm";
import { LOAN_DISCLAIMER } from "@/lib/constants";
import { formatINR, telLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "Loan Assistance",
  description: "Get help with home loans and property financing.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoanPage({ searchParams }: Props) {
  const params = await searchParams;
  const slug = typeof params.property === "string" ? params.property : undefined;
  const [s, properties] = await Promise.all([
    getSettings(),
    db.property.findMany({
      where: { isPublished: true, status: { notIn: ["sold", "not_available"] } },
      select: { id: true, title: true, locality: true, price: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  const initial = slug ? properties.find((p) => p.slug === slug)?.id : undefined;

  return (
    <div className="container-x pb-10 pt-6 md:pt-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_480px] lg:gap-12">
        <div>
          <p className="eyebrow">Financing</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Buy a bigger property with loan support up to {s.loanMaxPercent}%*
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            Don&apos;t have the full amount? Tell us the property price and how much you have now. Our team will help you
            apply with the right bank and guide you through eligibility and documents.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Banknote, title: "Example", text: `Property ₹40,00,000 — with ${s.loanMaxPercent}%* financing, you would need about ${formatINR((4000000 * (100 - s.loanMaxPercent)) / 100)} as down payment.` },
              { icon: Landmark, title: "Leading banks", text: "We work with nationalised and private banks and housing finance companies." },
              { icon: FileText, title: "Documents", text: "ID & address proof, income proof (salary slips / ITR), bank statements and property documents." },
              { icon: UserRound, title: "Personal guidance", text: "One advisor helps you from application to disbursement." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-5">
                <Icon className="size-6" />
                <h2 className="mt-4 font-semibold">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-2xl border border-line/70 p-4 text-xs leading-relaxed text-faint">* {LOAN_DISCLAIMER}</p>
        </div>

        <div className="card h-fit p-5 md:p-7 lg:sticky lg:top-24">
          <h2 className="mb-1 text-xl font-bold">Request loan assistance</h2>
          <p className="mb-5 text-sm text-muted">Takes less than a minute.</p>
          <LoanForm
            properties={properties.map((p) => ({ id: p.id, label: `${p.title}, ${p.locality}`, price: p.price }))}
            initialPropertyId={initial}
            maxPercent={s.loanMaxPercent}
            callHref={telLink(s.phone)}
          />
        </div>
      </div>
    </div>
  );
}
