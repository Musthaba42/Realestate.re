import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/site/AuthForms";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "";
  const me = await getCurrentUser();
  if (me) redirect(me.role === "admin" ? "/admin" : next && !next.startsWith("/admin") ? next : "/account");

  const signup = `/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <div className="container-x grid place-items-center pb-10 pt-8 md:pt-16">
      <div className="w-full max-w-md">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Log in</h1>
        <p className="mb-6 mt-2 text-muted">Log in to sell a property and track its approval. Browsing properties never needs an account.</p>
        <div className="card p-5 md:p-7">
          <LoginForm next={next} />
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          New here?{" "}
          <Link href={signup} className="font-semibold text-gold-2 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
