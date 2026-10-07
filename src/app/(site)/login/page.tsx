import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/site/AuthForms";
import { AuthShell } from "@/components/site/AuthShell";

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
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      intro="Log in to sell your property and track its approval. Browsing properties never needs an account."
      footer={
        <>
          New here?{" "}
          <Link href={signup} className="font-semibold text-gold-2 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
