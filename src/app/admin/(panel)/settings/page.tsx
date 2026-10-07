import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PasswordForm, SettingsForm } from "@/components/admin/SettingsForms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const s = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Business details, contact numbers and website text.</p>
      </div>

      <SettingsForm s={s} />

      <section className="card flex items-start gap-4 p-5 md:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2">
          <ShieldCheck className="size-5 text-gold-2" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold">Admin account</h2>
          <p className="mt-1 break-all text-sm text-muted">
            Logged in as <span className="font-semibold text-ink">{me.name}</span> · {me.email ?? me.login}
          </p>
          <p className="mt-1 text-sm text-muted">
            This is the only admin. Everyone else who signs up is a customer and can only sell a property and track it.
          </p>
        </div>
      </section>

      <PasswordForm />
    </div>
  );
}
