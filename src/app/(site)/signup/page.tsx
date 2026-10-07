import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/site/AuthForms";
import { AuthShell } from "@/components/site/AuthShell";

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
    <AuthShell
      eyebrow="Free account"
      title="Create your account"
      intro="An account lets you submit your property for sale and see when our team approves it. Browsing properties never needs one."
      footer={
        <>
          Already have an account?{" "}
          <Link href={login} className="font-semibold text-gold-2 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
