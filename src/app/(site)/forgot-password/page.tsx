import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/site/AuthForms";
import { AuthShell } from "@/components/site/AuthShell";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account help"
      title="Forgot your password?"
      intro="Enter the mobile number or email you signed up with. We will email you a link to choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-gold-2 hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
