import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/site/AuthForms";
import { AuthShell } from "@/components/site/AuthShell";
import { checkResetToken } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // keep the token out of Referer headers
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const valid = token ? Boolean(await checkResetToken(token)) : false;

  return (
    <AuthShell
      eyebrow="Account help"
      title={valid ? "Choose a new password" : "Link expired"}
      intro={
        valid
          ? "Pick a new password for your account. You will then log in with it."
          : "This reset link has expired or was already used. Links work for 30 minutes and only once."
      }
      footer={
        <Link href="/login" className="font-semibold text-gold-2 hover:underline">
          Back to log in
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Link href="/forgot-password" className="btn btn-primary btn-lg w-full">
          Get a new link
        </Link>
      )}
    </AuthShell>
  );
}
