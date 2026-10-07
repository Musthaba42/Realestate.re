import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/site/AuthForms";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignupPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "";
  const me = await getCurrentUser();
  if (me) redirect(me.role === "admin" ? "/admin" : next && !next.startsWith("/admin") ? next : "/account");

  const login = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <div className="container-x grid place-items-center pb-10 pt-8 md:pt-16">
      <div className="w-full max-w-md">
        <p className="eyebrow">Sell with Golden Groups</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mb-6 mt-2 text-muted">
          An account lets you submit your property for sale and see whether our team has approved it.
        </p>
        <div className="card p-5 md:p-7">
          <SignupForm next={next} />
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href={login} className="font-semibold text-gold-2 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
